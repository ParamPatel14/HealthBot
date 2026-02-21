from fastapi import APIRouter, HTTPException
from database.connection import get_db
from database.seed import get_doctor_for_specialization
from models.session import SessionCreate, MessageCreate, UploadCreate
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def session_to_dict(doc: dict) -> dict:
    """Convert MongoDB session doc to API response."""
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("")
async def create_session(user_id: str, data: SessionCreate):
    db = get_db()
    assigned_doctor = None
    if data.specialization:
        assigned_doctor = get_doctor_for_specialization(data.specialization)

    messages = []
    
    # SILENT HANDOFF: If opening a specialist chat, import the triage context silently
    if data.type == "specialist":
        last_triage = await db.sessions.find_one(
            {"userId": user_id, "type": "triage", "status": "completed"},
            sort=[("createdAt", -1)]
        )
        if last_triage and "messages" in last_triage:
            transcript = "--- PREVIOUS TRIAGE TRANSCRIPT ---\n"
            for m in last_triage["messages"]:
                if m.get("type") == "text":
                    speaker = "Patient" if m.get("sender") == "user" else "Triage Agent"
                    transcript += f"{speaker}: {m.get('text')}\n"
            
            messages.append({
                "id": str(ObjectId()),
                "sender": "system",
                "senderName": "System",
                "text": transcript,
                "type": "hidden", # The frontend filters this so patient doesn't see it
                "timestamp": datetime.utcnow().isoformat()
            })

    session = {
        "userId": user_id,
        "type": data.type,
        "specialization": data.specialization,
        "status": "active",
        "messages": messages,
        "uploads": [],
        "assignedDoctor": assigned_doctor,
        "reportId": None,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }
    result = await db.sessions.insert_one(session)
    session["_id"] = result.inserted_id
    return session_to_dict(session)


@router.get("")
async def get_user_sessions(user_id: str):
    db = get_db()
    cursor = db.sessions.find({"userId": user_id}).sort("createdAt", 1)
    sessions = []
    async for doc in cursor:
        sessions.append(session_to_dict(doc))
    return sessions


@router.get("/{session_id}")
async def get_session(session_id: str):
    db = get_db()
    doc = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_to_dict(doc)


@router.post("/{session_id}/messages")
async def add_message(session_id: str, message: MessageCreate):
    db = get_db()
    msg = {
        "id": str(ObjectId()),
        "sender": message.sender,
        "senderName": message.senderName,
        "text": message.text,
        "type": message.type,
        "attachments": message.attachments,
        "timestamp": datetime.utcnow().isoformat(),
    }
    result = await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"messages": msg}, "$set": {"updatedAt": datetime.utcnow().isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return msg


@router.post("/{session_id}/uploads")
async def add_upload(session_id: str, upload: UploadCreate):
    db = get_db()
    upload_doc = {
        "id": str(ObjectId()),
        "name": upload.name,
        "type": upload.type,
        "size": upload.size,
        "uploadedAt": datetime.utcnow().isoformat(),
    }
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"uploads": upload_doc}}
    )
    return upload_doc


@router.put("/{session_id}/status")
async def update_session_status(session_id: str, status: str, assigned_doctor: str = None):
    db = get_db()
    update = {"status": status, "updatedAt": datetime.utcnow().isoformat()}
    if assigned_doctor:
        update["assignedDoctor"] = assigned_doctor
    await db.sessions.update_one({"_id": ObjectId(session_id)}, {"$set": update})
    return {"success": True}

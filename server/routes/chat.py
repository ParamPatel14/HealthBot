"""
Chat route — the main endpoint that connects frontend chat to LangChain agents.
Handles both triage and specialist conversations with full session memory.
"""
from fastapi import APIRouter, HTTPException
from database.connection import get_db
from database.seed import get_doctor_for_specialization, get_specialization
from agents.triage_agent import get_triage_response
from agents.specialist_agent import get_specialist_response
from models.session import MessageCreate
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/{session_id}/send")
async def send_message(session_id: str, message: MessageCreate):
    """
    Send a user message and get an AI agent response.
    This is the main chat endpoint that routes to triage or specialist agents.
    All messages are stored in MongoDB — agents have full session memory.
    """
    db = get_db()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message to DB
    user_msg = {
        "id": str(ObjectId()),
        "sender": message.sender,
        "senderName": message.senderName,
        "text": message.text,
        "type": message.type,
        "attachments": message.attachments,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"messages": user_msg}, "$set": {"updatedAt": datetime.utcnow().isoformat()}}
    )

    # Get updated session with all messages (for agent memory)
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    all_messages = session.get("messages", [])

    # Get patient info for personalization
    patient = await db.users.find_one({"_id": ObjectId(session["userId"])}) if session.get("userId") else None
    patient_name = patient.get("firstName", "there") if patient else "there"

    # Route to appropriate agent
    if session["type"] == "triage":
        result = await get_triage_response(all_messages, patient_name)
    elif session["type"] == "specialist":
        spec_id = session.get("specialization", "general")
        result = await get_specialist_response(spec_id, all_messages, patient_name)
    else:
        result = {"text": "I'm not sure how to help with that. Please start a new consultation."}

    # Save agent response to DB
    spec = get_specialization(session.get("specialization", "")) if session.get("specialization") else None
    agent_name = f"{spec['name']} Assistant" if spec and session["type"] == "specialist" else "Triage Assistant"

    agent_msg = {
        "id": str(ObjectId()),
        "sender": "agent",
        "senderName": agent_name,
        "text": result["text"],
        "type": "text",
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"messages": agent_msg}, "$set": {"updatedAt": datetime.utcnow().isoformat()}}
    )

    response = {"userMessage": user_msg, "agentMessage": agent_msg}

    # Handle triage routing
    if session["type"] == "triage" and result.get("route_to"):
        response["routeTo"] = result["route_to"]
        # Update session status
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": "completed"}}
        )

    # Handle specialist report generation
    if result.get("report"):
        report_data = result["report"]
        assigned_doctor = get_doctor_for_specialization(session.get("specialization", "general"))
        
        report = {
            "sessionId": session_id,
            "userId": session["userId"],
            "status": "ai_generated",
            "aiReport": report_data,
            "doctorReview": None,
            "finalReport": None,
            "assignedDoctor": assigned_doctor,
            "specialization": session.get("specialization"),
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        }
        report_result = await db.reports.insert_one(report)
        report_id = str(report_result.inserted_id)

        # Link to session and update status
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"reportId": report_id, "status": "awaiting_review"}}
        )

        # Notify the assigned doctor (find their user account)
        doctor_user = await db.users.find_one({"doctorId": assigned_doctor})
        if doctor_user:
            await db.notifications.insert_one({
                "userId": str(doctor_user["_id"]),
                "type": "new_report",
                "title": "New Report for Review",
                "message": f"A new {session.get('specialization', '')} report from {patient_name} needs your review.",
                "reportId": report_id,
                "read": False,
                "createdAt": datetime.utcnow().isoformat(),
            })

        response["reportGenerated"] = True
        response["reportId"] = report_id

    return response


@router.get("/{session_id}/messages")
async def get_messages(session_id: str):
    """Get all messages for a session — used for polling/refreshing."""
    db = get_db()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "messages": session.get("messages", []),
        "status": session.get("status", "active"),
        "reportId": session.get("reportId"),
    }

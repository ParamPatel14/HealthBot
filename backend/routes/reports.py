from fastapi import APIRouter, HTTPException
from database.connection import get_db
from models.report import DoctorReviewSubmit
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/reports", tags=["reports"])


def report_to_dict(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("")
async def create_report(session_id: str, user_id: str, specialization: str, assigned_doctor: str, ai_report: dict):
    db = get_db()
    report = {
        "sessionId": session_id,
        "userId": user_id,
        "status": "ai_generated",
        "aiReport": ai_report,
        "doctorReview": None,
        "finalReport": None,
        "assignedDoctor": assigned_doctor,
        "specialization": specialization,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }
    result = await db.reports.insert_one(report)
    report_id = str(result.inserted_id)
    # Link report to session
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"reportId": report_id, "status": "awaiting_review"}}
    )
    report["_id"] = result.inserted_id
    return report_to_dict(report)


@router.get("")
async def get_reports(user_id: str = None):
    db = get_db()
    query = {"userId": user_id} if user_id else {}
    cursor = db.reports.find(query).sort("createdAt", -1)
    reports = []
    async for doc in cursor:
        reports.append(report_to_dict(doc))
    return reports


@router.get("/pending")
async def get_pending_reviews():
    db = get_db()
    cursor = db.reports.find({"status": {"$in": ["ai_generated", "under_review"]}}).sort("createdAt", 1)
    reports = []
    async for doc in cursor:
        reports.append(report_to_dict(doc))
    return reports


@router.get("/{report_id}")
async def get_report(report_id: str):
    db = get_db()
    doc = await db.reports.find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return report_to_dict(doc)


@router.post("/{report_id}/review")
async def submit_doctor_review(report_id: str, review: DoctorReviewSubmit, doctor_id: str = None, doctor_name: str = "Doctor"):
    db = get_db()
    report = await db.reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Get doctor info if doctor_id provided
    if doctor_id:
        doctor = await db.doctors.find_one({"_id": doctor_id})
        if doctor:
            doctor_name = doctor["name"]

    final_report = {
        "summary": report.get("aiReport", {}).get("summary", ""),
        "findings": report.get("aiReport", {}).get("findings", []),
        "suggestions": report.get("aiReport", {}).get("suggestions", []),
        "doctorNotes": review.notes,
        "doctorCorrections": review.corrections,
        "doctorRecommendations": review.recommendations,
        "reviewedAt": datetime.utcnow().isoformat(),
        "reviewedBy": doctor_name,
    }

    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {
            "status": "final",
            "doctorReview": review.model_dump(),
            "finalReport": final_report,
            "updatedAt": datetime.utcnow().isoformat(),
        }}
    )

    # Add system message to the chat session so patient sees it
    session_id = report.get("sessionId")
    if session_id:
        system_msg = {
            "id": str(ObjectId()),
            "sender": "system",
            "senderName": "System",
            "text": f"✅ **Your report has been reviewed by {doctor_name}!**\n\nThe doctor has provided their notes, any corrections, and recommendations. You can view the complete report in your Reports section.",
            "type": "system",
            "timestamp": datetime.utcnow().isoformat(),
        }
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"messages": system_msg}, "$set": {"status": "completed", "updatedAt": datetime.utcnow().isoformat()}}
        )

    # Create notification for the patient
    await db.notifications.insert_one({
        "userId": report["userId"],
        "type": "report_ready",
        "title": "Your Report is Ready",
        "message": f"{doctor_name} has reviewed your {report.get('specialization', '')} report.",
        "reportId": report_id,
        "read": False,
        "createdAt": datetime.utcnow().isoformat(),
    })

    return {"success": True, "message": "Review submitted successfully"}

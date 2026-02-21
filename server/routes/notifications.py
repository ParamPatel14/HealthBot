from fastapi import APIRouter
from database.connection import get_db
from bson import ObjectId

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(user_id: str):
    db = get_db()
    cursor = db.notifications.find({"userId": user_id}).sort("createdAt", -1)
    notifs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        notifs.append(doc)
    return notifs


@router.get("/unread-count")
async def get_unread_count(user_id: str):
    db = get_db()
    count = await db.notifications.count_documents({"userId": user_id, "read": False})
    return {"count": count}


@router.put("/{notif_id}/read")
async def mark_read(notif_id: str):
    db = get_db()
    await db.notifications.update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"read": True}}
    )
    return {"success": True}

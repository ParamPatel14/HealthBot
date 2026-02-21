from fastapi import APIRouter, HTTPException
from database.connection import get_db
from models.user import UserCreate, UserLogin, UserUpdate, UserResponse
from passlib.hash import pbkdf2_sha256
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_doc_to_response(doc: dict) -> dict:
    """Convert MongoDB user document to API response."""
    return {
        "id": str(doc["_id"]),
        "email": doc.get("email", ""),
        "role": doc.get("role", "patient"),
        "firstName": doc.get("firstName", ""),
        "lastName": doc.get("lastName", ""),
        "phone": doc.get("phone"),
        "dob": doc.get("dob"),
        "gender": doc.get("gender"),
        "address": doc.get("address"),
        "emergencyName": doc.get("emergencyName"),
        "emergencyPhone": doc.get("emergencyPhone"),
        "emergencyRelation": doc.get("emergencyRelation"),
        "profileComplete": doc.get("profileComplete", False),
        "createdAt": doc.get("createdAt"),
        "doctorId": doc.get("doctorId"),
        "specialization": doc.get("specialization"),
    }


@router.post("/register")
async def register(user_data: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    doc = {
        "email": user_data.email,
        "password_hash": pbkdf2_sha256.hash(user_data.password),
        "role": user_data.role,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "phone": user_data.phone,
        "dob": user_data.dob,
        "gender": user_data.gender,
        "address": user_data.address,
        "profileComplete": False,
        "createdAt": datetime.utcnow().isoformat(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "user": user_doc_to_response(doc)}


@router.post("/login")
async def login(creds: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": creds.email, "role": creds.role})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not pbkdf2_sha256.verify(creds.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"success": True, "user": user_doc_to_response(user), "role": user["role"]}


@router.put("/profile/{user_id}")
async def update_profile(user_id: str, updates: UserUpdate):
    db = get_db()
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["profileComplete"] = True
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return {"success": True, "user": user_doc_to_response(user)}


@router.get("/user/{user_id}")
async def get_user(user_id: str):
    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        # Try as string ID (for doctor IDs)
        user = await db.users.find_one({"doctorId": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_response(user)

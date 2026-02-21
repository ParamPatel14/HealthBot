from fastapi import APIRouter
from database.connection import get_db

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("")
async def get_all_doctors():
    db = get_db()
    cursor = db.doctors.find({})
    doctors = []
    async for doc in cursor:
        doc["id"] = doc.pop("_id")
        doctors.append(doc)
    return doctors


@router.get("/{doctor_id}")
async def get_doctor(doctor_id: str):
    db = get_db()
    doc = await db.doctors.find_one({"_id": doctor_id})
    if doc:
        doc["id"] = doc.pop("_id")
    return doc


@router.get("/specialization/{spec_id}")
async def get_doctors_by_specialization(spec_id: str):
    db = get_db()
    cursor = db.doctors.find({"specialization": spec_id})
    doctors = []
    async for doc in cursor:
        doc["id"] = doc.pop("_id")
        doctors.append(doc)
    return doctors

from database.connection import get_db
from passlib.hash import pbkdf2_sha256

# Specializations — each maps to a specialist agent and a doctor
SPECIALIZATIONS = [
    {"id": "cardiology", "name": "Cardiology", "icon": "fa-heartbeat", "color": "#ef4444",
     "description": "Heart and cardiovascular system",
     "keywords": ["heart", "chest", "cardio", "blood pressure", "palpitation", "cardiac"]},
    {"id": "dermatology", "name": "Dermatology", "icon": "fa-hand-dots", "color": "#f59e0b",
     "description": "Skin, hair, and nails",
     "keywords": ["skin", "rash", "acne", "itch", "derma", "mole", "eczema"]},
    {"id": "orthopedics", "name": "Orthopedics", "icon": "fa-bone", "color": "#3b82f6",
     "description": "Bones, joints, and muscles",
     "keywords": ["bone", "joint", "fracture", "muscle", "back pain", "knee", "spine"]},
    {"id": "neurology", "name": "Neurology", "icon": "fa-brain", "color": "#8b5cf6",
     "description": "Brain and nervous system",
     "keywords": ["head", "brain", "migraine", "dizzy", "neuro", "seizure", "headache"]},
    {"id": "pulmonology", "name": "Pulmonology", "icon": "fa-lungs", "color": "#06b6d4",
     "description": "Lungs and respiratory system",
     "keywords": ["breath", "lung", "cough", "asthma", "respiratory", "wheeze"]},
    {"id": "general", "name": "General Medicine", "icon": "fa-stethoscope", "color": "#10b981",
     "description": "General health concerns", "keywords": []},
]

# Seeded doctors — each assigned to one specialization
SEED_DOCTORS = [
    {"_id": "doc_cardiology", "name": "Dr. Sarah Chen", "email": "sarah.chen@hal.health",
     "specialization": "cardiology", "initials": "SC", "experience": "12 years", "status": "available"},
    {"_id": "doc_dermatology", "name": "Dr. James Patel", "email": "james.patel@hal.health",
     "specialization": "dermatology", "initials": "JP", "experience": "8 years", "status": "available"},
    {"_id": "doc_orthopedics", "name": "Dr. Maria Gonzalez", "email": "maria.gonzalez@hal.health",
     "specialization": "orthopedics", "initials": "MG", "experience": "15 years", "status": "available"},
    {"_id": "doc_neurology", "name": "Dr. Ahmed Khan", "email": "ahmed.khan@hal.health",
     "specialization": "neurology", "initials": "AK", "experience": "10 years", "status": "available"},
    {"_id": "doc_pulmonology", "name": "Dr. David Lee", "email": "david.lee@hal.health",
     "specialization": "pulmonology", "initials": "DL", "experience": "14 years", "status": "available"},
    {"_id": "doc_general", "name": "Dr. Emily Woods", "email": "emily.woods@hal.health",
     "specialization": "general", "initials": "EW", "experience": "6 years", "status": "available"},
]

async def seed_database():
    """Seed doctors and create their user accounts if they don't exist."""
    db = get_db()
    
    # Seed doctors
    for doc in SEED_DOCTORS:
        existing = await db.doctors.find_one({"_id": doc["_id"]})
        if not existing:
            await db.doctors.insert_one(doc)
            # Also create a user account for each doctor
            user_exists = await db.users.find_one({"email": doc["email"]})
            if not user_exists:
                await db.users.insert_one({
                    "email": doc["email"],
                    "password_hash": pbkdf2_sha256.hash("doctor123"),  # Default password
                    "role": "doctor",
                    "firstName": doc["name"].split(". ")[1].split(" ")[0] if ". " in doc["name"] else doc["name"],
                    "lastName": doc["name"].split()[-1],
                    "doctorId": doc["_id"],
                    "specialization": doc["specialization"],
                    "profileComplete": True,
                })
    
    # Seed specializations
    for spec in SPECIALIZATIONS:
        existing = await db.specializations.find_one({"id": spec["id"]})
        if not existing:
            await db.specializations.insert_one(spec)
    
    doc_count = await db.doctors.count_documents({})
    spec_count = await db.specializations.count_documents({})
    print(f"✅ Seeded {doc_count} doctors and {spec_count} specializations")


def get_specialization(spec_id: str):
    """Get specialization data by ID."""
    for s in SPECIALIZATIONS:
        if s["id"] == spec_id:
            return s
    return SPECIALIZATIONS[-1]  # Default to general


def get_doctor_for_specialization(spec_id: str):
    """Get the assigned doctor ID for a specialization."""
    return f"doc_{spec_id}"


def detect_specialization(text: str) -> str:
    """Detect specialization from symptom text."""
    lower = text.lower()
    for spec in SPECIALIZATIONS:
        if any(kw in lower for kw in spec["keywords"]):
            return spec["id"]
    return "general"

from pydantic import BaseModel
from typing import Optional, List

class DoctorReviewSubmit(BaseModel):
    notes: str
    corrections: Optional[str] = ""
    recommendations: str

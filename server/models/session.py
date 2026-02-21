from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class MessageCreate(BaseModel):
    sender: str  # "user" or "agent"
    senderName: Optional[str] = None
    text: str
    type: str = "text"
    attachments: Optional[List[dict]] = None

class SessionCreate(BaseModel):
    type: str  # "triage" or "specialist"
    specialization: Optional[str] = None

class UploadCreate(BaseModel):
    name: str
    type: str  # "document", "image", "audio"
    size: Optional[str] = None

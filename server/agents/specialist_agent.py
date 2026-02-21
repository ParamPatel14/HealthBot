"""
LangChain Specialist Agent — Gemini Pro (with thinking)
Collects detailed medical data and generates comprehensive reports.
Each specialist has domain-specific prompts and is linked to an assigned doctor.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from config import settings
from database.seed import get_specialization, SEED_DOCTORS


SPECIALIST_SYSTEM_PROMPTS = {
    "cardiology": """You are a Cardiology Specialist AI Assistant. You specialize in heart and cardiovascular conditions.
Focus on: chest pain characteristics, heart rate patterns, blood pressure history, family cardiac history, exercise tolerance, palpitations, shortness of breath during activity.""",
    
    "dermatology": """You are a Dermatology Specialist AI Assistant. You specialize in skin, hair, and nail conditions.
Focus on: rash location/appearance, duration, triggers, skin type, sun exposure, allergies, topical products used, family skin conditions.""",
    
    "orthopedics": """You are an Orthopedics Specialist AI Assistant. You specialize in bones, joints, and musculoskeletal conditions.
Focus on: pain location/intensity, range of motion, injury history, physical activity level, posture habits, previous fractures, swelling patterns.""",
    
    "neurology": """You are a Neurology Specialist AI Assistant. You specialize in brain and nervous system conditions.
Focus on: headache patterns, dizziness, vision changes, numbness/tingling, cognitive changes, sleep patterns, stress levels, seizure history.""",
    
    "pulmonology": """You are a Pulmonology Specialist AI Assistant. You specialize in lung and respiratory conditions.
Focus on: breathing difficulty patterns, cough characteristics, wheezing, smoking history, environmental exposures, exercise capacity, sleep quality.""",
    
    "general": """You are a General Medicine Specialist AI Assistant. You handle general health concerns.
Focus on: overall symptoms, medical history, current medications, lifestyle factors, diet, exercise, sleep, stress levels.""",
}

BASE_SPECIALIST_PROMPT = """{domain_prompt}

Your role:
1. Review the information from the triage assessment
2. Ask detailed, domain-specific questions to gather comprehensive data
3. Consider any uploaded documents, images, or voice notes the patient mentions
4. After collecting enough information (usually 2-3 exchanges), generate a comprehensive report

IMPORTANT RULES:
- Be professional, thorough, and empathetic
- Ask focused questions specific to your domain
- Consider uploaded files in your assessment
- When you have enough info (after patient has sent 3+ messages), generate the report
- When generating a report, format it EXACTLY as below, starting with GENERATE_REPORT:

GENERATE_REPORT:
SUMMARY: [1-2 sentence summary of the consultation]
FINDINGS:
- [Finding 1]
- [Finding 2]
- [Finding 3]
- [Finding 4]
SUGGESTIONS:
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]
- [Suggestion 4]

The assigned doctor {doctor_name} will review this report before it reaches the patient.
Keep responses caring but clinical. Use markdown for clarity."""


def get_specialist_llm():
    return ChatGoogleGenerativeAI(
        model=settings.SPECIALIST_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.4,
        max_output_tokens=2048,
    )


def get_doctor_for_spec(spec_id: str) -> dict:
    for doc in SEED_DOCTORS:
        if doc["specialization"] == spec_id:
            return doc
    return SEED_DOCTORS[-1]


async def get_specialist_response(spec_id: str, messages: list[dict], patient_name: str = "there") -> dict:
    """
    Process a specialist conversation and return the agent's response.
    
    Args:
        spec_id: Specialization ID
        messages: Full conversation history from the session
        patient_name: Patient's first name
    
    Returns:
        dict with 'text' (response) and optionally 'report' (AI-generated report data)
    """
    llm = get_specialist_llm()
    
    domain_prompt = SPECIALIST_SYSTEM_PROMPTS.get(spec_id, SPECIALIST_SYSTEM_PROMPTS["general"])
    doctor = get_doctor_for_spec(spec_id)
    spec = get_specialization(spec_id)
    
    system_prompt = BASE_SPECIALIST_PROMPT.format(
        domain_prompt=domain_prompt,
        doctor_name=doctor["name"]
    )
    
    # Build LangChain message list from session history
    lc_messages = [SystemMessage(content=system_prompt)]
    
    for msg in messages:
        if msg.get("sender") == "user":
            content = msg["text"]
            # Include info about attachments
            if msg.get("attachments"):
                att_desc = ", ".join(f"{a['name']} ({a['type']})" for a in msg["attachments"])
                content += f"\n[Patient shared files: {att_desc}]"
            lc_messages.append(HumanMessage(content=content))
        elif msg.get("sender") == "agent":
            lc_messages.append(AIMessage(content=msg["text"]))
    
    # Get response from Gemini Pro with thinking
    response = await llm.ainvoke(lc_messages)
    response_text = response.content
    
    # Check if agent generated a report
    report = None
    if "GENERATE_REPORT:" in response_text:
        parts = response_text.split("GENERATE_REPORT:")
        response_text = parts[0].strip()
        report_text = parts[1].strip()
        
        # Parse the report
        report = parse_report(report_text, spec_id, patient_name)
        
        # Add a nice message about report generation
        if not response_text:
            response_text = f"Thank you for providing all this information, {patient_name}. I've generated a comprehensive report based on our consultation."
        
        response_text += f"\n\n📋 **Report Generated**\n\nYour report has been created and sent to **{doctor['name']}** for professional review. You'll receive a notification when the doctor has reviewed it."
    else:
        # Auto-generate report after enough messages
        user_msgs = [m for m in messages if m.get("sender") == "user"]
        if len(user_msgs) >= 3 and not report:
            # Force report generation on next response by asking the LLM
            report = await force_generate_report(llm, lc_messages, spec_id, patient_name, doctor)
            if report:
                response_text += f"\n\n📋 **Report Generated**\n\nYour report has been created and sent to **{doctor['name']}** for professional review. You'll receive a notification when the doctor has reviewed it."
    
    return {"text": response_text, "report": report}


async def force_generate_report(llm, messages, spec_id, patient_name, doctor) -> dict:
    """Force the LLM to generate a report based on collected information."""
    report_prompt = f"""Based on all the information collected in this conversation, generate a medical report.

Format EXACTLY as:
SUMMARY: [1-2 sentence summary]
FINDINGS:
- [Finding 1]
- [Finding 2]
- [Finding 3]
SUGGESTIONS:
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]"""
    
    messages_copy = messages + [HumanMessage(content=report_prompt)]
    response = await llm.ainvoke(messages_copy)
    return parse_report(response.content, spec_id, patient_name)


def parse_report(report_text: str, spec_id: str, patient_name: str) -> dict:
    """Parse report text into structured data."""
    summary = ""
    findings = []
    suggestions = []
    
    current_section = None
    for line in report_text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.upper().startswith("SUMMARY:"):
            summary = line.split(":", 1)[1].strip()
            current_section = "summary"
        elif line.upper().startswith("FINDINGS:"):
            current_section = "findings"
        elif line.upper().startswith("SUGGESTIONS:") or line.upper().startswith("RECOMMENDATION"):
            current_section = "suggestions"
        elif line.startswith("- ") or line.startswith("• "):
            item = line.lstrip("-•").strip()
            if current_section == "findings":
                findings.append(item)
            elif current_section == "suggestions":
                suggestions.append(item)
        elif current_section == "summary" and not summary:
            summary = line
    
    if not summary:
        summary = f"{get_specialization(spec_id)['name']} consultation report for {patient_name}."
    if not findings:
        findings = ["Patient symptoms assessed and documented.", "Medical history reviewed."]
    if not suggestions:
        suggestions = ["Follow-up consultation recommended.", "Continue monitoring symptoms."]
    
    return {"summary": summary, "findings": findings, "suggestions": suggestions}

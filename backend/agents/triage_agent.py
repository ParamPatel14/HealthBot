"""
LangChain Triage Agent — Gemini Flash
Listens to patient symptoms, asks follow-up questions, and routes to the correct specialist.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from config import settings
from database.seed import detect_specialization, get_specialization

TRIAGE_SYSTEM_PROMPT = """You are an AI healthcare triage assistant. Your role is to:

1. Greet the patient warmly and ask them to describe their health concerns
2. Ask targeted follow-up questions to understand their symptoms better
3. After gathering enough information (usually 2-3 exchanges), identify the most likely medical specialization needed
4. Inform the patient you're connecting them with the appropriate specialist

IMPORTANT RULES:
- Be empathetic, professional, and reassuring
- Ask ONE set of 2-3 focused questions per response
- Never provide diagnoses or medical advice
- After the patient has described symptoms adequately (usually after 2-3 messages from them), identify the specialization and say you'll connect them
- When ready to route, include the EXACT phrase "ROUTE_TO_SPECIALIST:{specialization_id}" at the very end of your message (this will be parsed by the system and hidden from the patient)
- Valid specialization_ids: cardiology, dermatology, orthopedics, neurology, pulmonology, general

EXAMPLE of routing message:
"Based on your symptoms, I believe you should consult with our Cardiology specialist. They'll be able to collect more detailed information and provide a thorough assessment. I'm connecting you now..."
ROUTE_TO_SPECIALIST:cardiology

Keep responses concise but caring. Use markdown for clarity when listing questions."""


def get_triage_llm():
    return ChatGoogleGenerativeAI(
        model=settings.TRIAGE_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.7,
        max_output_tokens=1024,
    )


async def get_triage_response(messages: list[dict], patient_name: str = "there") -> dict:
    """
    Process a triage conversation and return the agent's response.
    
    Args:
        messages: Full conversation history from the session
        patient_name: Patient's first name for personalization
    
    Returns:
        dict with 'text' (response) and optionally 'route_to' (specialization ID)
    """
    llm = get_triage_llm()
    
    # Build LangChain message list from session history
    lc_messages = [SystemMessage(content=TRIAGE_SYSTEM_PROMPT.replace("the patient", patient_name))]
    
    for msg in messages:
        if msg.get("sender") == "user":
            lc_messages.append(HumanMessage(content=msg["text"]))
        elif msg.get("sender") == "agent":
            lc_messages.append(AIMessage(content=msg["text"]))
    
    # Get response from Gemini Flash
    response = await llm.ainvoke(lc_messages)
    response_text = response.content
    
    # Check if agent wants to route to a specialist
    route_to = None
    if "ROUTE_TO_SPECIALIST:" in response_text:
        parts = response_text.split("ROUTE_TO_SPECIALIST:")
        response_text = parts[0].strip()
        route_to = parts[1].strip().split()[0].lower()
        # Validate the specialization
        spec = get_specialization(route_to)
        if not spec:
            route_to = detect_specialization(" ".join(m.get("text", "") for m in messages))
    else:
        # Also check if we should auto-route based on message count
        user_msgs = [m for m in messages if m.get("sender") == "user"]
        if len(user_msgs) >= 3:
            all_text = " ".join(m.get("text", "") for m in messages)
            route_to = detect_specialization(all_text)
    
    return {"text": response_text, "route_to": route_to}

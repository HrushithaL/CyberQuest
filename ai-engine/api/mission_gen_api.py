from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

class MissionRequest(BaseModel):
    topic: str
    difficulty: str
    type: str
    format: str | None = "mcq"   # Optional mission format


# Helper function to scramble events for challenges
def scramble_events(events_list):
    """Scramble a list of events and return the scrambled version."""
    scrambled = events_list.copy()
    random.shuffle(scrambled)
    return scrambled


# Utility: random placeholder MCQ
def generate_mcq(topic, difficulty):
    return {
        "title": f"{topic.title()} Challenge ({difficulty})",
        "description": f"Identify the correct security concept related to {topic}.",
        "points": {
            "easy": 20, "medium": 40, "hard": 70, "expert": 100
        }.get(difficulty, 20),

        "content": {
            "questions": [
                {
                    "question": f"What is a key risk in {topic}?",
                    "options": [
                        "Unauthorized access",
                        "Sunny weather",
                        "Low battery",
                        "Keyboard color"
                    ],
                    "answer": 0,
                    "hint": "Think security risks."
                }
            ],
            "scenarios": [],
            "challenges": []
        }
    }


# Utility: phishing / scenario-style mission
def generate_scenario(topic, difficulty):
    return {
        "title": f"{topic.title()} Scenario Investigation",
        "description": "Analyze the suspicious message and decide the correct action.",
        "points": {
            "easy": 30, "medium": 60, "hard": 90, "expert": 150
        }.get(difficulty, 30),

        "content": {
            "questions": [],
            "scenarios": [
                {
                    "title": f"{topic.title()} Suspicious Email",
                    "sender": "admin@secure-mail.com",
                    "subject": "Urgent: Your account needs verification",
                    "content": f"This message may involve a {topic} threat. Decide how to handle it.",
                    "options": [
                        "Click the link immediately",
                        "Ignore the message",
                        "Report as phishing",
                        "Forward to everyone"
                    ],
                    "answer": 2
                }
            ],
            "challenges": []
        }
    }


# Utility: coding/network-style challenge
def generate_challenge(topic, difficulty):
    # Determine challenge type based on topic
    if "incident" in topic.lower() or "response" in topic.lower() or "forensic" in topic.lower():
        # Event ordering challenge
        return generate_event_ordering_challenge(topic, difficulty)
    else:
        # Forensic IP detection challenge
        return generate_forensic_challenge(topic, difficulty)


def generate_forensic_challenge(topic, difficulty):
    """Generate a forensic challenge where user must find suspicious IP."""
    # Generate correct solution first
    correct_ip = "182.76.12.54"
    
    # Create scrambled log events for display
    log_events = [
        "[INFO] GET /home 200",
        "[INFO] GET /login 200",
        "[WARN] Multiple failed attempts detected",
        f"[FAIL] Unauthorized access attempt from IP {correct_ip}"
    ]
    
    return {
        "title": f"{topic.title()} Forensics Challenge",
        "description": "Inspect the logs and identify suspicious behavior.",
        "points": {
            "easy": 40, "medium": 80, "hard": 120, "expert": 200
        }.get(difficulty, 40),

        "content": {
            "questions": [],
            "scenarios": [],
            "challenges": [
                {
                    "title": "Analyze Server Logs",
                    "description": "Find the suspicious IP address in the logs.",
                    "code": "\n".join(log_events),
                    "language": "text",
                    "hints": ["Check unusual IP activity."],
                    "expected": correct_ip,
                    "correctSolution": correct_ip,  # Store correct solution
                    "officialAnswer": correct_ip,
                    "testCases": [
                        {"input": "log_analysis", "output": correct_ip}
                    ]
                }
            ]
        }
    }


def generate_event_ordering_challenge(topic, difficulty):
    """Generate an event ordering challenge where user must order security events."""
    # Define the correct sequence of events
    correct_events = [
        "1. Initial reconnaissance scan detected",
        "2. Suspicious login attempts from foreign IP",
        "3. Privilege escalation detected",
        "4. Unauthorized data access",
        "5. Data exfiltration attempt blocked"
    ]
    
    # Create the correct solution (order as indices or the ordered list)
    correct_solution = list(range(len(correct_events)))  # [0, 1, 2, 3, 4]
    
    # Scramble events for display
    scrambled_events = scramble_events(correct_events)
    
    return {
        "title": f"{topic.title()} Incident Timeline",
        "description": "Order the security incident events in the correct sequence.",
        "points": {
            "easy": 50, "medium": 90, "hard": 140, "expert": 220
        }.get(difficulty, 50),

        "content": {
            "questions": [],
            "scenarios": [],
            "challenges": [
                {
                    "title": "Order Security Events",
                    "description": "Arrange the following events in the correct chronological order based on a typical attack sequence.",
                    "code": "\n".join(scrambled_events),
                    "language": "text",
                    "hints": ["Think about the typical attack lifecycle.", "Reconnaissance comes before exploitation."],
                    "expected": ", ".join(correct_events),  # Human-readable expected
                    "correctSolution": {
                        "type": "ordering",
                        "correctOrder": correct_events,
                        "correctIndices": correct_solution
                    },
                    "officialAnswer": ", ".join(correct_events),
                    "testCases": []
                }
            ]
        }
    }
           


def generate_comprehensive(topic, difficulty):
    """Return a combined mission: MCQs (3), 1 Scenario, 1 Challenge."""
    # Base parts
    mcq_base = generate_mcq(topic, difficulty)
    scen_base = generate_scenario(topic, difficulty)
    chall_base = generate_challenge(topic, difficulty)

    # Expand MCQs to 3 simple variants
    questions = []
    for i in range(3):
        q = dict(mcq_base["content"]["questions"][0])
        q["question"] = q["question"].replace("key risk", f"key risk ({i+1})")
        questions.append(q)

    scenarios = scen_base["content"]["scenarios"] or []
    challenges = chall_base["content"]["challenges"] or []

    points_map = {"easy": 100, "medium": 180, "hard": 260, "expert": 400}
    return {
        "title": f"{topic.title()} Mixed Mission ({difficulty})",
        "description": f"A comprehensive mission about {topic} mixing MCQs, a realistic scenario, and a hands-on challenge.",
        "points": points_map.get(difficulty, 100),
        "content": {
            "questions": questions,
            "scenarios": scenarios,
            "challenges": challenges
        }
    }


def normalize_format(fmt: str | None, t: str | None) -> str:
    """Normalize user-provided format/type into one of: mcq, scenario, challenge, comprehensive."""
    raw = (fmt or t or "mcq").strip().lower()
    raw = raw.replace("_", " ").replace("-", " ")
    # Direct matches
    if raw in {"mcq", "multiple choice", "multiplechoice"}:
        return "mcq"
    if raw in {"scenario", "scenarios", "email", "phishing", "social engineering", "social"}:
        return "scenario"
    if raw in {"challenge", "challenges", "coding", "code", "forensics", "lab"}:
        return "challenge"
    if raw in {"comprehensive", "mixed", "all", "combo"}:
        return "comprehensive"
    # Heuristics
    if "scenario" in raw or "phishing" in raw or "email" in raw:
        return "scenario"
    if "challenge" in raw or "code" in raw or "forensic" in raw:
        return "challenge"
    if "comprehensive" in raw or "mixed" in raw:
        return "comprehensive"
    # Default
    return "mcq"


@router.post("/generate-mission")
async def generate_mission(req: MissionRequest):
    """Generate a mission structure fully compatible with your frontend."""
    topic = (req.topic or "security").lower()
    difficulty = (req.difficulty or "easy").lower()
    fmt = normalize_format(req.format, req.type)

    # Pick generator function
    if fmt == "mcq":
        return generate_mcq(topic, difficulty)
    if fmt == "scenario":
        return generate_scenario(topic, difficulty)
    if fmt == "challenge":
        return generate_challenge(topic, difficulty)
    if fmt == "comprehensive":
        return generate_comprehensive(topic, difficulty)

    # Fallback (should not hit)
    return generate_mcq(topic, difficulty)

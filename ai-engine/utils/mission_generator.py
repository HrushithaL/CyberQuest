from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os, json

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class MissionRequest(BaseModel):
    topic: str
    difficulty: str

@router.post("/generate-mission")
def generate_mission_route(req: MissionRequest):
    
    prompt = f"""
    Create a cybersecurity mission on topic '{req.topic}' with difficulty '{req.difficulty}'.

    Output JSON ONLY:
    {{
      "title": "",
      "description": "",
      "type": "mcq | game | concept | scenario",
      "rewardPoints": 10,
      "questions": [],
      "spec": {{}}
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{ "role": "user", "content": prompt }],
        temperature=0.4
    )

    raw = response.choices[0].message.content

    try:
        data = json.loads(raw)
    except:
        return {"error": "Invalid JSON", "raw": raw}

    data["aiGenerated"] = True
    return data

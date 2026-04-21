from fastapi import APIRouter, Depends, HTTPException
from ..clients.dema import DemaClient

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def get_dema() -> DemaClient:
    return DemaClient()

_GOAL_TEMPLATES = [
    ("research", "Research {message}"),
    ("summarize", "Summarize {message}"),
    ("search", "Search for {message}"),
    ("find", "Find information about {message}"),
    ("what", "Research and summarize {message}"),
]


def _parse_message(msg: str) -> str:
    lower = msg.lower()
    for keyword, template in _GOAL_TEMPLATES:
        if lower.startswith(keyword):
            return template.replace("{message}", msg[len(keyword):].strip())
    return f"Research and summarize: {msg}"


@router.post("/")
async def chat(message: str, dema: DemaClient = Depends(get_dema)):
    goal = _parse_message(message)
    try:
        plan = await dema.create_plan(goal=goal)
        plan_id = plan.get("plan_id", "")
        await dema.run_plan(plan_id, mode="auto")
        return {
            "plan_id": plan_id,
            "status": "created",
            "message": f"Plan created: {goal}",
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Orchestration error: {e}")

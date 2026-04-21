from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from ..clients.dema import DemaClient

router = APIRouter(prefix="/api/plans", tags=["plans"])


class CreatePlanRequest(BaseModel):
    goal: str
    constraints: Optional[list] = None
    metadata: Optional[dict] = None


async def get_dema() -> DemaClient:
    return DemaClient()


@router.post("/")
async def create_plan(body: CreatePlanRequest = Body(...),
                      dema: DemaClient = Depends(get_dema)):
    try:
        return await dema.create_plan(body.goal, body.constraints, body.metadata)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")

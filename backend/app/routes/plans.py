from fastapi import APIRouter, Depends, HTTPException
from ..clients.dema import DemaClient, get_plan_ids

router = APIRouter(prefix="/api/plans", tags=["plans"])


async def get_dema() -> DemaClient:
    return DemaClient()


@router.get("/active")
async def list_active_plans(dema: DemaClient = Depends(get_dema)):
    try:
        results = []
        for plan_id in get_plan_ids():
            try:
                state = await dema.get_plan_state(plan_id)
                plan = state.get("plan", {})
                results.append({
                    "plan_id": plan.get("plan_id", plan_id),
                    "goal": plan.get("goal", ""),
                    "status": plan.get("status", ""),
                    "current_stage_idx": plan.get("current_stage_idx", 0),
                    "stages": plan.get("stages"),
                    "run_id": plan.get("run_id"),
                })
            except Exception:
                pass  # skip plans that no longer exist
        return results
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")


@router.get("/{plan_id}/state")
async def get_plan_detail(plan_id: str, dema: DemaClient = Depends(get_dema)):
    try:
        state = await dema.get_plan_state(plan_id)
        audit = await dema.get_audit_logs(plan_id)
        plan = state.get("plan", state)
        return {
            **state,
            "plan_id": plan.get("plan_id", plan_id),
            "audit_logs": audit.get("logs", []),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")


@router.post("/{plan_id}/pause")
async def pause_plan(plan_id: str, dema: DemaClient = Depends(get_dema)):
    try:
        return await dema.pause_plan(plan_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")


@router.post("/{plan_id}/resume")
async def resume_plan(plan_id: str, dema: DemaClient = Depends(get_dema)):
    try:
        return await dema.resume_plan(plan_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")


@router.post("/{plan_id}/run")
async def run_plan(plan_id: str, mode: str = "auto",
                   dema: DemaClient = Depends(get_dema)):
    try:
        return await dema.run_plan(plan_id, mode)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")


@router.post("/approval/{approval_id}")
async def handle_approval(approval_id: str, approved: bool,
                          approval_token: str | None = None,
                          dema: DemaClient = Depends(get_dema)):
    try:
        return await dema.handle_approval(approval_id, approved, approval_token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Dema error: {e}")

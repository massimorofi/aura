from fastapi import APIRouter, Depends
from ..clients.dema import DemaClient
from ..clients.tinymcp import TinyMCPClient

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


async def get_dema() -> DemaClient:
    return DemaClient()


async def get_tinymcp() -> TinyMCPClient:
    return TinyMCPClient()


@router.get("/dashboard")
async def dashboard_metrics(
    dema: DemaClient = Depends(get_dema),
    tinymcp: TinyMCPClient = Depends(get_tinymcp),
):
    plans = []
    active = 0
    completed = 0
    paused = 0
    awaiting = 0
    try:
        state = await dema.get_plan_state("active")
        plans = state.get("plans", [])
        for p in plans:
            s = p.get("status", "")
            if s == "EXECUTING":
                active += 1
            elif s == "COMPLETED":
                completed += 1
            elif s == "PAUSED":
                paused += 1
            elif s == "AWAITING_HITL":
                awaiting += 1
    except Exception:
        pass

    tool_count = 0
    server_count = 0
    try:
        tools = await tinymcp.list_tools()
        if isinstance(tools, list):
            tool_count = len(tools)
        elif isinstance(tools, dict):
            tool_count = len(tools.get("tools", tools.get("items", [])))
    except Exception:
        pass
    try:
        servers = await tinymcp.get_active_servers()
        if isinstance(servers, list):
            server_count = len(servers)
        elif isinstance(servers, dict):
            server_count = len(servers.get("servers", servers.get("items", [])))
    except Exception:
        pass

    return {
        "total_plans": len(plans),
        "active_plans": active,
        "completed_plans": completed,
        "paused_plans": paused,
        "awaiting_hitl": awaiting,
        "tool_count": tool_count,
        "server_count": server_count,
    }

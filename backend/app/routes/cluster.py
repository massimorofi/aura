from fastapi import APIRouter, Depends
from ..models import ClusterHealth
from ..clients.dema import DemaClient
from ..clients.tinymcp import TinyMCPClient

router = APIRouter(prefix="/api/cluster", tags=["cluster"])


async def get_dema() -> DemaClient:
    return DemaClient()


async def get_tinymcp() -> TinyMCPClient:
    return TinyMCPClient()


@router.get("/health", response_model=ClusterHealth)
async def cluster_health(
    dema: DemaClient = Depends(get_dema),
    tinymcp: TinyMCPClient = Depends(get_tinymcp),
):
    services = []
    overall = "healthy"

    for name, client in [("dema", dema), ("tinymcp", tinymcp)]:
        try:
            await client.health()
            services.append({"service": name, "status": "healthy"})
        except Exception:
            services.append({
                "service": name,
                "status": "unhealthy",
                "detail": f"Could not reach {name}",
            })
            overall = "degraded"

    return {"overall": overall, "services": services}

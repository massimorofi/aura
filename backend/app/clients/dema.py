import httpx
from typing import Any, Optional, Set
from dotenv import load_dotenv
import os

load_dotenv()

DEMA_URL = os.getenv("DEMA_URL", "http://localhost:8090")

# Global plan ID registry — DEMA has no list-plans endpoint
_plan_ids: Set[str] = set()


def get_plan_ids() -> Set[str]:
    return _plan_ids


def register_plan(plan_id: str) -> None:
    _plan_ids.add(plan_id)


class DemaClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or DEMA_URL

    async def health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/health")
            return r.json()

    async def create_plan(self, goal: str, constraints: list | None = None,
                          metadata: dict | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            body: dict[str, Any] = {"goal": goal}
            if constraints is not None:
                body["constraints"] = constraints
            if metadata is not None:
                body["metadata"] = metadata
            r = await client.post(f"{self.base_url}/v1/plans", json=body)
            r.raise_for_status()
            data = r.json()
            plan_id = data.get("plan_id")
            if plan_id:
                register_plan(plan_id)
            return data

    async def get_plan(self, plan_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/v1/plans/{plan_id}")
            r.raise_for_status()
            return r.json()

    async def get_plan_state(self, plan_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/v1/plans/{plan_id}/state")
            r.raise_for_status()
            return r.json()

    async def run_plan(self, plan_id: str, mode: str = "auto") -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{self.base_url}/v1/plans/{plan_id}/run",
                                  json={"mode": mode})
            r.raise_for_status()
            return r.json()

    async def pause_plan(self, plan_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(f"{self.base_url}/v1/plans/{plan_id}/pause")
            r.raise_for_status()
            return r.json()

    async def resume_plan(self, plan_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(f"{self.base_url}/v1/plans/{plan_id}/resume")
            r.raise_for_status()
            return r.json()

    async def get_audit_logs(self, plan_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/v1/plans/{plan_id}/audit")
            r.raise_for_status()
            return r.json()

    async def handle_approval(self, approval_id: str, approved: bool,
                              approval_token: str | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(f"{self.base_url}/v1/approvals/{approval_id}",
                                  json={"approved": approved, "approval_token": approval_token})
            r.raise_for_status()
            return r.json()

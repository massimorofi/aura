import asyncio
import json
import traceback
from pathlib import Path
from typing import Any

from httpx import AsyncClient, ASGITransport

from app.main import app
from app.routes import cluster as cluster_routes
from app.routes import gateway as gateway_routes
from app.routes import metrics as metrics_routes
from app.routes import plans as plans_routes
from app.routes import plans_create as plans_create_routes
from app.routes import chat as chat_routes
from app.clients.dema import register_plan

RESULTS_FILE = Path(__file__).resolve().parent / "backend_test_results.json"


class FakeDemaClient:
    async def health(self) -> dict[str, Any]:
        return {"status": "healthy"}

    async def create_plan(self, goal: str, constraints=None, metadata=None) -> dict[str, Any]:
        return {"plan_id": "plan-123", "goal": goal, "status": "CREATED"}

    async def get_plan_state(self, plan_id: str) -> dict[str, Any]:
        return {
            "plan": {
                "plan_id": plan_id,
                "goal": "Test goal",
                "status": "EXECUTING",
                "current_stage_idx": 1,
                "stages": [{"name": "stage-1"}],
                "run_id": "run-123",
            }
        }

    async def run_plan(self, plan_id: str, mode: str = "auto") -> dict[str, Any]:
        return {"plan_id": plan_id, "mode": mode, "status": "running"}

    async def pause_plan(self, plan_id: str) -> dict[str, Any]:
        return {"plan_id": plan_id, "status": "paused"}

    async def resume_plan(self, plan_id: str) -> dict[str, Any]:
        return {"plan_id": plan_id, "status": "resumed"}

    async def get_audit_logs(self, plan_id: str) -> dict[str, Any]:
        return {"logs": [{"event": "created", "plan_id": plan_id}]}

    async def handle_approval(self, approval_id: str, approved: bool, approval_token: str | None = None) -> dict[str, Any]:
        return {"approval_id": approval_id, "approved": approved, "approval_token": approval_token}


class FakeTinyMCPClient:
    async def health(self) -> dict[str, Any]:
        return {"status": "healthy"}

    async def list_tools(self, server: str | None = None) -> Any:
        return {"tools": [{"name": "tool-1"}, {"name": "tool-2"}]}

    async def get_active_servers(self) -> Any:
        return {"servers": [{"id": "server-1"}]}

    async def execute_tool(self, tool_name: str, arguments: dict, session_id: str | None = None) -> dict[str, Any]:
        return {"name": tool_name, "arguments": arguments, "executed": True}


def override_dependencies() -> None:
    fake_dema = FakeDemaClient()
    fake_tinymcp = FakeTinyMCPClient()

    app.dependency_overrides = {
        cluster_routes.get_dema: lambda: fake_dema,
        cluster_routes.get_tinymcp: lambda: fake_tinymcp,
        plans_routes.get_dema: lambda: fake_dema,
        plans_create_routes.get_dema: lambda: fake_dema,
        gateway_routes.get_tinymcp: lambda: fake_tinymcp,
        chat_routes.get_dema: lambda: fake_dema,
        metrics_routes.get_dema: lambda: fake_dema,
        metrics_routes.get_tinymcp: lambda: fake_tinymcp,
    }


async def run_tests() -> dict[str, Any]:
    register_plan("plan-123")
    override_dependencies()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        tests = []

        async def add_test(name: str, func):
            try:
                details = await func()
                tests.append({"name": name, "status": "passed", "details": details})
            except Exception as exc:
                tests.append({
                    "name": name,
                    "status": "failed",
                    "details": {
                        "error": str(exc),
                        "traceback": traceback.format_exc(),
                    },
                })

        async def test_root():
            response = await client.get("/")
            assert response.status_code == 200
            assert response.json().get("message") == "Aura API - MCP Cluster Admin"
            return response.json()

        async def test_cluster_health():
            response = await client.get("/api/cluster/health")
            assert response.status_code == 200
            data = response.json()
            assert data["overall"] == "healthy"
            assert isinstance(data["services"], list)
            return data

        async def test_list_active_plans():
            response = await client.get("/api/plans/active")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert data[0]["plan_id"] == "plan-123"
            return data

        async def test_get_plan_detail():
            response = await client.get("/api/plans/plan-123/state")
            assert response.status_code == 200
            data = response.json()
            assert data["plan_id"] == "plan-123"
            assert "audit_logs" in data
            return data

        async def test_pause_plan():
            response = await client.post("/api/plans/plan-123/pause")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "paused"
            return data

        async def test_resume_plan():
            response = await client.post("/api/plans/plan-123/resume")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "resumed"
            return data

        async def test_run_plan():
            response = await client.post("/api/plans/plan-123/run", params={"mode": "auto"})
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "running"
            return data

        async def test_approval():
            response = await client.post(
                "/api/plans/approval/approval-1",
                params={"approved": True, "approval_token": "token-abc"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["approved"] is True
            return data

        async def test_create_plan():
            payload = {"goal": "Test plan goal", "constraints": ["c1"], "metadata": {"env": "test"}}
            response = await client.post("/api/plans/", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["plan_id"] == "plan-123"
            return data

        async def test_list_tools():
            response = await client.get("/api/gateway/tools")
            assert response.status_code == 200
            data = response.json()
            assert "tools" in data
            return data

        async def test_list_servers():
            response = await client.get("/api/gateway/servers")
            assert response.status_code == 200
            data = response.json()
            assert "servers" in data
            return data

        async def test_execute_tool():
            response = await client.post(
                "/api/gateway/execute",
                params={"tool_name": "test-tool"},
                json={"arguments": {"arg1": "value1"}},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["executed"] is True
            return data

        async def test_chat():
            response = await client.post("/api/chat/", params={"message": "research test message"})
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "created"
            return data

        async def test_metrics_dashboard():
            response = await client.get("/api/metrics/dashboard")
            assert response.status_code == 200
            data = response.json()
            assert "total_plans" in data
            assert "tool_count" in data
            return data

        await add_test("root", test_root)
        await add_test("cluster_health", test_cluster_health)
        await add_test("list_active_plans", test_list_active_plans)
        await add_test("get_plan_detail", test_get_plan_detail)
        await add_test("pause_plan", test_pause_plan)
        await add_test("resume_plan", test_resume_plan)
        await add_test("run_plan", test_run_plan)
        await add_test("approval", test_approval)
        await add_test("create_plan", test_create_plan)
        await add_test("list_tools", test_list_tools)
        await add_test("list_servers", test_list_servers)
        await add_test("execute_tool", test_execute_tool)
        await add_test("chat", test_chat)
        await add_test("metrics_dashboard", test_metrics_dashboard)

    summary = {
        "total": len(tests),
        "passed": sum(1 for t in tests if t["status"] == "passed"),
        "failed": sum(1 for t in tests if t["status"] == "failed"),
        "tests": tests,
    }
    return summary


def save_results(summary: dict[str, Any]) -> None:
    with RESULTS_FILE.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)
    print(f"Saved backend API test results to {RESULTS_FILE}")


def main() -> int:
    summary = asyncio.run(run_tests())
    save_results(summary)
    if summary["failed"] > 0:
        print("Some backend tests failed.")
        return 1
    print("All backend tests passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

import httpx
from typing import Any, Optional
from dotenv import load_dotenv
import os

load_dotenv()

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8080")


class TinyMCPClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or GATEWAY_URL

    async def health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/healthz")
            return r.json()

    async def list_tools(self, server: str | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            params = {"server": server} if server else {}
            r = await client.get(f"{self.base_url}/tools", params=params)
            r.raise_for_status()
            return r.json()

    async def list_servers(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/registry/servers")
            r.raise_for_status()
            return r.json()

    async def get_active_servers(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{self.base_url}/registry/external/active")
            r.raise_for_status()
            return r.json()

    async def execute_tool(self, tool_name: str, arguments: dict,
                           session_id: str | None = None) -> dict[str, Any]:
        headers = {}
        if session_id:
            headers["X-Session-ID"] = session_id
        async with httpx.AsyncClient(timeout=60, headers=headers) as client:
            r = await client.post(f"{self.base_url}/execute",
                                  json={"name": tool_name, "arguments": arguments})
            r.raise_for_status()
            return r.json()

    async def get_sse_url(self) -> str:
        return f"{self.base_url}/sse"

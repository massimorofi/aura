from fastapi import APIRouter, Depends, HTTPException
from ..clients.tinymcp import TinyMCPClient

router = APIRouter(prefix="/api/gateway", tags=["gateway"])


async def get_tinymcp() -> TinyMCPClient:
    return TinyMCPClient()


@router.get("/tools")
async def list_tools(server: str | None = None,
                     tinymcp: TinyMCPClient = Depends(get_tinymcp)):
    try:
        # If no specific server requested, query all servers
        if not server:
            servers = await tinymcp.list_servers()
            all_tools = []
            for s in servers:
                sid = s.get("id")
                if sid:
                    try:
                        tools_data = await tinymcp.list_tools(sid)
                        tools = tools_data.get("tools", [])
                        for t in tools:
                            t["_server"] = sid
                        all_tools.extend(tools)
                    except Exception:
                        pass
            return {"tools": all_tools}
        return await tinymcp.list_tools(server)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/servers")
async def list_servers(tinymcp: TinyMCPClient = Depends(get_tinymcp)):
    try:
        return await tinymcp.list_servers()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.post("/execute")
async def execute_tool(tool_name: str, arguments: dict,
                       tinymcp: TinyMCPClient = Depends(get_tinymcp)):
    try:
        return await tinymcp.execute_tool(tool_name, arguments)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")

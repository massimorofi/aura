from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.cluster import router as cluster_router
from .routes.plans import router as plans_router
from .routes.plans_create import router as plans_create_router
from .routes.gateway import router as gateway_router
from .routes.chat import router as chat_router
from .routes.metrics import router as metrics_router

app = FastAPI(
    title="Aura",
    description="MCP Cluster Administration & Orchestration Portal",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cluster_router)
app.include_router(plans_router)
app.include_router(plans_create_router)
app.include_router(gateway_router)
app.include_router(chat_router)
app.include_router(metrics_router)


@app.get("/")
async def root():
    return {"message": "Aura API - MCP Cluster Admin"}

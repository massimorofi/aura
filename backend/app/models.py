from pydantic import BaseModel
from typing import Any, Optional


class HealthStatus(BaseModel):
    service: str
    status: str
    detail: Optional[str] = None


class ClusterHealth(BaseModel):
    overall: str
    services: list[HealthStatus]


class PlanListItem(BaseModel):
    plan_id: str
    goal: str
    status: str
    current_stage_idx: int
    stages: Optional[list[dict[str, Any]]] = None
    run_id: Optional[str] = None


class PlanDetail(BaseModel):
    plan_id: str
    goal: str
    status: str
    stages: Optional[list[dict[str, Any]]] = None
    current_stage_idx: int
    tenant_id: Optional[str] = None
    run_id: Optional[str] = None
    context: Optional[dict[str, Any]] = None
    audit_logs: Optional[list[dict[str, Any]]] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    plan_id: Optional[str] = None
    status: str
    message: str


class ApprovalRequest(BaseModel):
    approved: bool
    approval_token: Optional[str] = None

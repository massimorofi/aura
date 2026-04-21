# Aura

MCP Cluster Administration and Orchestration Portal

Aura is a unified web interface for administering and interacting with an MCP cluster. It bridges the gap between the **Dema** orchestration control plane and the **tinymcp** tool gateway, providing a single dashboard for monitoring, managing, and driving agentic workflows.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────┬──────────────┬──────────────┬───────────────┐ │
│  │ Cluster  │  Orchestrator│  Gateway     │  Agentic Chat │ │
│  │  Pulse   │   (Dema)     │  Registry    │   (LLM)       │ │
│  └──────────┴──────────────┴──────────────┴───────────────┘ │
│                           React + Vite (:3000)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────┐
│              Aura Backend (FastAPI BFF) (:3001)              │
│  Aggregates & enriches REST APIs from Dema & tinymcp        │
└──────┬──────────────────────────────┬───────────────────────┘
       │                              │
┌──────▼───────────┐         ┌────────▼──────────────┐
│   Dema Control   │         │    tinymcp Gateway    │
│   Plane (:8090)  │         │    (:8080)            │
│   Plan lifecycle │         │   Tool registry & exec│
└──────────────────┘         └───────────────────────┘
```

- **Backend** — FastAPI acts as a Backend-for-Frontend (BFF), aggregating the REST APIs of Dema and tinymcp into a single coherent surface.
- **Frontend** — React + Vite + Tailwind CSS + Lucide Icons, with TanStack Query for data fetching and caching.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| **Cluster Pulse** | `/` | Health dashboard showing service status, tool counts, and plan metrics |
| **Orchestrator** | `/plans` | Active plans grid with progress bars, detail view with audit logs and HITL approvals |
| **Gateway Registry** | `/tools` | Searchable catalog of all tools exposed by the tinymcp gateway |
| **Agentic Chat** | `/chat` | Natural-language interface that creates and runs Dema plans on your behalf |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for running the Dema and tinymcp services)

### One-command start

```bash
cd /path/to/aura/aura_ui
./start.sh
```

This script will:
1. Create a Python virtual environment and install backend dependencies
2. Install frontend npm dependencies
3. Start the backend on `http://localhost:3001`
4. Start the frontend dev server on `http://localhost:3000`

Open http://localhost:3000 in your browser.

### Manual start

**Backend:**
```bash
cd aura_ui/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit if your services run on different ports
uvicorn app.main:app --host 0.0.0.0 --port 3001
```

**Frontend:**
```bash
cd aura_ui/frontend
npm install
npm run dev
```

### Stop

```bash
./stop.sh
```

Or kill the processes tracked in `.aura_pids`.

## Configuration

Edit `backend/.env` (copied from `.env.example` on first start):

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMA_URL` | `http://localhost:8090` | Dema control plane endpoint |
| `GATEWAY_URL` | `http://localhost:8080` | tinymcp gateway endpoint |

## API Endpoints

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| `GET` | `/api/cluster/health` | aggregated | Health of all cluster services |
| `GET` | `/api/plans/active` | Dema | List active plans |
| `GET` | `/api/plans/{id}/state` | Dema | Plan detail, stages, audit logs |
| `POST` | `/api/plans/{id}/run` | Dema | Run a plan (`auto` or `manual` mode) |
| `POST` | `/api/plans/{id}/pause` | Dema | Pause an executing plan |
| `POST` | `/api/plans/{id}/resume` | Dema | Resume a paused plan |
| `POST` | `/api/plans/{id}/approval/{approval_id}` | Dema | Approve or reject a pending action |
| `POST` | `/api/plans/` | Dema | Create a new plan |
| `GET` | `/api/gateway/tools` | tinymcp | List all available tools |
| `GET` | `/api/gateway/servers` | tinymcp | List registered MCP servers |
| `POST` | `/api/gateway/execute` | tinymcp | Execute a tool |
| `POST` | `/api/chat/` | Aura | Natural-language chat -> plan creation |

## Project Structure

```
aura_ui/
├── start.sh                 # One-command start (backend + frontend)
├── stop.sh                  # Stop running processes
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entrypoint
│   │   ├── models.py        # Pydantic data models
│   │   ├── clients/
│   │   │   ├── dema.py      # Dema control plane HTTP client
│   │   │   └── tinymcp.py   # tinymcp gateway HTTP client
│   │   └── routes/
│   │       ├── cluster.py   # Health endpoint
│   │       ├── plans.py     # Plan CRUD
│   │       ├── plans_create.py  # Plan creation
│   │       ├── gateway.py   # Tool/server management
│   │       └── chat.py      # Chat -> plan orchestration
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.tsx           # Sidebar layout + routes
    │   ├── main.tsx          # React entrypoint
    │   ├── index.css          # Tailwind dark theme
    │   ├── lib/api.ts         # API client
    │   └── pages/
    │       ├── Dashboard.tsx  # Cluster Pulse
    │       ├── Plans.tsx      # Orchestrator
    │       ├── Tools.tsx      # Gateway Registry
    │       └── Chat.tsx       # Agentic Chat
    ├── package.json
    └── vite.config.ts
```

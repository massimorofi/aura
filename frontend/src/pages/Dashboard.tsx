import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  XCircle,
  Cpu,
  Activity,
  Play,
  Pause,
  AlertTriangle,
  CheckSquare,
  Wrench,
  Server,
} from 'lucide-react'
import { getClusterHealth, getActivePlans } from '../lib/api'

function StatusBadge({ status }: { status: string }) {
  const healthy = status === 'healthy'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      healthy
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'bg-red-500/10 text-red-400'
    }`}>
      {healthy ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, sub }: {
  icon: typeof Cpu; label: string; value: string | number; sub?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-secondary p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function PlanStats({ plans }: { plans: any[] }) {
  let executing = 0
  let paused = 0
  let awaiting = 0
  let completed = 0
  for (const p of plans) {
    const s = p.status
    if (s === 'EXECUTING') executing++
    else if (s === 'PAUSED') paused++
    else if (s === 'AWAITING_HITL') awaiting++
    else if (s === 'COMPLETED') completed++
  }

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <MetricCard icon={Play} label="Executing" value={executing} />
      <MetricCard icon={Pause} label="Paused" value={paused} />
      <MetricCard icon={AlertTriangle} label="Awaiting HITL" value={awaiting} />
      <MetricCard icon={CheckSquare} label="Completed" value={completed} />
      <MetricCard icon={Activity} label="Total" value={plans.length} />
    </div>
  )
}

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: getClusterHealth,
  })

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: getActivePlans,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cluster Pulse</h2>
        <p className="text-sm text-muted-foreground">
          Real-time health of the MCP cluster
        </p>
      </div>

      {healthLoading && <p className="text-muted-foreground">Loading...</p>}

      {health && (
        <>
          <div className="flex items-center gap-2">
            <StatusBadge status={health.overall} />
            <span className="text-sm text-muted-foreground">
              Overall cluster status
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {health.services.map((s: { service: string; status: string; detail?: string }) => (
              <div key={s.service} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{s.service}</h3>
                    {s.detail && (
                      <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Gateway metrics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard icon={Wrench} label="Available Tools" value="—" sub="Check Gateway Registry" />
            <MetricCard icon={Server} label="Registered Servers" value="—" sub="Check Gateway Registry" />
          </div>
        </>
      )}

      {!plansLoading && plans && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Orchestration Load</h3>
          <PlanStats plans={plans} />
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Loader2,
  Plus,
} from 'lucide-react'
import {
  getActivePlans,
  getPlanDetail,
  runPlan,
  pausePlan,
  resumePlan,
  handleApproval,
  createPlan,
} from '../lib/api'

function HitlApproval({ approval }: { approval: { id: string; prompt?: string; action?: string } }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  const onAction = async (approved: boolean) => {
    setLoading(true)
    try {
      await handleApproval(approval.id, approved)
      qc.invalidateQueries({ queryKey: ['plan', approval.id] })
    } catch {
      // error handled by query refetch
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-500/20 p-1">
          <AlertCircle className="h-3 w-3 text-amber-400" />
        </span>
        <span className="text-xs font-medium text-amber-400">Action Requires Approval</span>
      </div>
      {approval.prompt && (
        <p className="text-xs text-muted-foreground">{approval.prompt}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onAction(true)}
          disabled={loading}
          className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </button>
        <button
          onClick={() => onAction(false)}
          disabled={loading}
          className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Reject
        </button>
      </div>
    </div>
  )
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function PlanCard({ planId }: { planId: string }) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()

  const { data: detail } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => getPlanDetail(planId),
    refetchInterval: expanded ? 3000 : 10000,
  })

  if (!detail) return null

  const totalStages = detail.stages?.length ?? 1
  const progress = totalStages > 0
    ? Math.round(((detail.current_stage_idx + 1) / totalStages) * 100)
    : 0

  const toggleAction = async () => {
    if (detail.status === 'PAUSED') {
      await resumePlan(planId)
    } else {
      await pausePlan(planId)
    }
    qc.invalidateQueries({ queryKey: ['plan', planId] })
  }

  // Extract HITL approvals from audit logs or detail
  const approvals: any[] = []
  if (detail.audit_logs) {
    for (const log of detail.audit_logs) {
      const text = typeof log === 'string' ? log : JSON.stringify(log)
      if (text.includes('AWAITING_HITL') || text.includes('approval')) {
        // Try to extract approval_id from the log
        const match = text.match(/approval[_-]?id[=:]\s*([a-zA-Z0-9-]+)/i)
        if (match) {
          approvals.push({ id: match[1], prompt: text.slice(0, 100) })
        }
      }
    }
  }
  // Also check if detail has a pending_approvals field
  if (detail.pending_approvals) {
    for (const a of detail.pending_approvals) {
      if (!approvals.find(ap => ap.id === a.id)) {
        approvals.push(a)
      }
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</>
          <div>
            <p className="font-medium">{detail.goal}</p>
            <p className="text-xs text-muted-foreground">ID: {planId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {approvals.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
              {approvals.length} pending
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            detail.status === 'EXECUTING' ? 'bg-emerald-500/10 text-emerald-400' :
            detail.status === 'AWAITING_HITL' ? 'bg-amber-500/10 text-amber-400' :
            detail.status === 'PAUSED' ? 'bg-muted text-muted-foreground' :
            'bg-secondary text-muted-foreground'
          }`}>
            {detail.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-4">
          {/* HITL approvals */}
          {approvals.length > 0 && (
            <div className="space-y-2">
              {approvals.map((a: any, i: number) => (
                <HitlApproval key={a.id || i} approval={a} />
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Stage {detail.current_stage_idx + 1} of {totalStages}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {detail.status !== 'EXECUTING' && (
              <button
                onClick={() => runPlan(planId).then(() => qc.invalidateQueries({ queryKey: ['plan', planId] }))}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Run
              </button>
            )}
            <button
              onClick={toggleAction}
              className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:opacity-90"
            >
              {detail.status === 'PAUSED' ? 'Resume' : 'Pause'}
            </button>
          </div>

          {/* Audit logs */}
          {detail.audit_logs && detail.audit_logs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Audit Logs</h4>
              <div className="rounded-md bg-background p-3 font-mono text-xs space-y-1 max-h-60 overflow-y-auto">
                {detail.audit_logs.slice(-20).map((log: any, i: number) => (
                  <div key={i} className="text-muted-foreground">
                    {typeof log === 'string' ? log : JSON.stringify(log)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context tiers */}
          {detail.context && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Context Tiers</h4>
              <pre className="rounded-md bg-background p-3 text-xs overflow-auto max-h-40">
                {JSON.stringify(detail.context, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Plans() {
  const [creating, setCreating] = useState(false)
  const [goal, setGoal] = useState('')
  const qc = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: getActivePlans,
  })

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim()) return
    setCreating(true)
    try {
      await createPlan(goal.trim())
      setGoal('')
      setCreating(false)
      qc.invalidateQueries({ queryKey: ['plans'] })
    } catch {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orchestrator Command Center</h2>
          <p className="text-sm text-muted-foreground">
            Manage agentic workflow plans
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      </div>

      {creating && (
        <form onSubmit={onCreate} className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Research 2026 AI trends using Wikipedia and summarize them"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !goal.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create & Run'}
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setGoal('') }}
              className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:opacity-90"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-muted-foreground">Loading plans...</p>}
      {!isLoading && (!plans || plans.length === 0) && !creating && (
        <p className="text-muted-foreground">No active plans. Create one to get started.</p>
      )}

      <div className="space-y-2">
        {plans?.map((p: any) => (
          <PlanCard key={p.plan_id} planId={p.plan_id} />
        ))}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../lib/api'
import {
  Send,
  Bot,
  User,
  Loader2,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  planId?: string
  timestamp: number
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Aura Agentic Chat. Describe a goal and I\'ll orchestrate a plan to achieve it.',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const resp = await sendChat(userMsg.content)
      const assistantMsg: Message = {
        role: 'assistant',
        content: resp.message || 'Plan created successfully.',
        planId: resp.plan_id,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error creating plan. Check backend logs.',
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div>
        <h2 className="text-2xl font-bold">Agentic Chat</h2>
        <p className="text-sm text-muted-foreground">
          Natural language planning via Dema orchestrator
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 rounded-full bg-primary/10 p-1.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-lg rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border'
            }`}>
              <p>{msg.content}</p>
              {msg.planId && (
                <p className="mt-1 text-xs opacity-70">
                  Plan: {msg.planId}
                </p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="mt-1 rounded-full bg-secondary p-1.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your goal (e.g. Research 2026 AI trends)..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}

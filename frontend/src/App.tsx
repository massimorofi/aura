import { Routes, Route, NavLink } from 'react-router-dom'
import {
  Activity,
  Layers,
  Wrench,
  MessageSquare,
  Zap,
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Plans from './pages/Plans'
import Tools from './pages/Tools'
import Chat from './pages/Chat'

function NavItem({ to, icon: Icon, label }: {
  to: string; icon: typeof Zap; label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  )
}

function App() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card/50 p-4 flex flex-col gap-1">
        <div className="mb-4 px-3 py-2">
          <h1 className="text-lg font-bold text-primary">Aura</h1>
          <p className="text-xs text-muted-foreground">MCP Cluster Admin</p>
        </div>
        <nav className="flex flex-col gap-1">
          <NavItem to="/" icon={Activity} label="Cluster Pulse" />
          <NavItem to="/plans" icon={Layers} label="Orchestrator" />
          <NavItem to="/tools" icon={Wrench} label="Gateway Registry" />
          <NavItem to="/chat" icon={MessageSquare} label="Agentic Chat" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

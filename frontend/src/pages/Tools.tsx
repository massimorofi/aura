import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Wrench } from 'lucide-react'
import { getTools, getServers } from '../lib/api'

export default function Tools() {
  const [search, setSearch] = useState('')
  const [selectedServer, setSelectedServer] = useState<string | undefined>()

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
  })

  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools', selectedServer],
    queryFn: () => getTools(selectedServer),
  })

  const filtered = search
    ? (tools || []).filter((t: any) =>
        JSON.stringify(t).toLowerCase().includes(search.toLowerCase()))
    : tools

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gateway Registry</h2>
        <p className="text-sm text-muted-foreground">
          Tool catalog and server management
        </p>
      </div>

      {/* Server filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedServer(undefined)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            !selectedServer ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:opacity-90'
          }`}
        >
          All Servers
        </button>
        {servers?.map((s: any) => (
          <button
            key={s.name}
            onClick={() => setSelectedServer(s.name)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              selectedServer === s.name ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:opacity-90'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {/* Tools grid */}
      {isLoading && <p className="text-muted-foreground">Loading tools...</p>}
      {!isLoading && (!filtered || filtered.length === 0) && (
        <p className="text-muted-foreground">No tools found</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((tool: any) => (
          <div key={tool.name} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">{tool.name}</h3>
            </div>
            {tool.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {tool.description}
              </p>
            )}
            {tool.inputSchema && (
              <pre className="text-xs bg-background rounded p-2 overflow-auto max-h-32">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
interface ActiveSession {
  id: string
  visitor_id: string
  agent_id?: string
  status: 'active' | 'paused' | 'ended'
  created_at: string
  updated_at: string
  current_url: string
  page_title: string
}

interface SessionListProps {
  sessions: ActiveSession[]
  selectedSession: ActiveSession | null
  onSelectSession: (session: ActiveSession) => void
  onEndSession: (sessionId: string) => void
}

export default function SessionList({
  sessions,
  selectedSession,
  onSelectSession,
  onEndSession
}: SessionListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'ended':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'paused':
        return 'Paused'
      case 'ended':
        return 'Ended'
      default:
        return 'Unknown'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const truncateUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + urlObj.pathname.substring(0, 30)
    } catch {
      return url.substring(0, 40)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Filter Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({sessions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            filter === 'active'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({sessions.filter(s => s.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('paused')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            filter === 'paused'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Paused ({sessions.filter(s => s.status === 'paused').length})
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No {filter} sessions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSessions.map((session) => {
              console.log('Rendering session:', session)
              return (
                <div
                  key={session.id || `session-${Math.random()}`}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSession?.id === session.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                      <span className="text-xs font-medium text-gray-500">
                        {getStatusText(session.status)}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {session.page_title || 'Untitled Page'}
                    </h3>

                    <p className="text-xs text-gray-500 truncate">
                      {truncateUrl(session.current_url)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(session.created_at)}
                      </span>

                      {session.agent_id && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Agent Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {session.status !== 'ended' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEndSession(session.id)
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="End session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}

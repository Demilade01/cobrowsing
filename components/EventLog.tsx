'use client'

import { useState } from 'react'

interface VisitorEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'dom_change'
  target?: string
  data: any
  timestamp: number
  sequence: number
}

interface EventLogProps {
  events: VisitorEvent[]
}

export default function EventLog({ events }: EventLogProps) {
  const [filter, setFilter] = useState<'all' | 'click' | 'scroll' | 'input' | 'navigation' | 'dom_change'>('all')

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    return event.type === filter
  })

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
          </svg>
        )
      case 'scroll':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )
      case 'input':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'navigation':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      case 'dom_change':
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'click':
        return 'bg-blue-50 border-blue-200'
      case 'scroll':
        return 'bg-green-50 border-green-200'
      case 'input':
        return 'bg-purple-50 border-purple-200'
      case 'navigation':
        return 'bg-orange-50 border-orange-200'
      case 'dom_change':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatEventData = (event: VisitorEvent) => {
    switch (event.type) {
      case 'click':
        return `Clicked at (${event.data.x}, ${event.data.y})`
      case 'scroll':
        return `Scrolled to (${event.data.scrollX}, ${event.data.scrollY})`
      case 'input':
        return `Filled "${event.data.value}" in ${event.target || 'input'}`
      case 'navigation':
        return `Navigated to ${event.data.url}`
      case 'dom_change':
        return `Modified ${event.target || 'element'}`
      default:
        return JSON.stringify(event.data)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Log</h3>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'click', 'scroll', 'input', 'navigation', 'dom_change'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-xs rounded ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type !== 'all' && (
                <span className="ml-1">
                  ({events.filter(e => e.type === type).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No {filter} events yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.slice().reverse().map((event, index) => (
              <div
                key={`${event.sequence}-${event.timestamp}`}
                className={`p-3 rounded border ${getEventColor(event.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700">
                      {formatEventData(event)}
                    </p>

                    {event.target && (
                      <p className="text-xs text-gray-500 mt-1">
                        Target: <code className="bg-gray-200 px-1 rounded">{event.target}</code>
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        Sequence: {event.sequence}
                      </span>

                      {event.type === 'input' && event.data.type && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {event.data.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600">
          <p>Total events: {events.length}</p>
          <p>Showing: {filteredEvents.length} {filter !== 'all' ? filter : ''} events</p>
        </div>
      </div>
    </div>
  )
}

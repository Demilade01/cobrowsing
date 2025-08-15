'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import EventLog from '@/components/EventLog'

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

interface SessionViewerProps {
  session: ActiveSession
  onEndSession: () => void
}

interface VisitorEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'dom_change'
  target?: string
  data: any
  timestamp: number
  sequence: number
}

export default function SessionViewer({ session, onEndSession }: SessionViewerProps) {
  const [events, setEvents] = useState<VisitorEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showEventLog, setShowEventLog] = useState(false)
  const [sessionStatus, setSessionStatus] = useState('connecting')
  const channelRef = useRef<any>(null)
  const isSetupRef = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastMouseMove = useRef(0)

  // Setup connection once on mount
  useEffect(() => {
    if (!isSetupRef.current) {
      setupRealtimeConnection()
      isSetupRef.current = true
    }
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      isSetupRef.current = false
    }
  }, [])

  const setupRealtimeConnection = () => {
    console.log('Setting up realtime connection for session:', session.id)

    // Clean up existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Use dashboard channel for all communication
    const channel = supabase.channel('cobrowse-dashboard')

    channel
      .on('broadcast', { event: 'session-started' }, (payload: any) => {
        console.log('Session started event received:', payload)
        const sessionData = payload.payload || payload
        if (sessionData.session_id === session.id) {
          setSessionStatus('active')
          setIsConnected(true)
        }
      })
      .on('broadcast', { event: 'visitor-action' }, (payload: any) => {
        console.log('Visitor action received:', payload)
        const actionData = payload.payload || payload
        if (actionData.session_id === session.id) {
          const event: VisitorEvent = {
            type: actionData.type,
            target: actionData.target,
            data: actionData.data,
            timestamp: actionData.timestamp,
            sequence: actionData.sequence,
          }
          setEvents(prev => [...prev, event])
          handleVisitorAction(actionData)
        }
      })
      .on('broadcast', { event: 'session-ended' }, (payload: any) => {
        console.log('Session ended event received:', payload)
        const sessionData = payload.payload || payload
        if (sessionData.session_id === session.id) {
          setSessionStatus('ended')
          setIsConnected(false)
        }
      })
      .on('broadcast', { event: '*' }, (payload: any) => {
        console.log('Dashboard received event:', payload.event, payload)
      })
      .subscribe((status: any) => {
        console.log('Dashboard channel status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard channel successfully connected')
          setIsConnected(true)
          setSessionStatus('connected')
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          console.log('❌ Dashboard channel connection failed')
          setIsConnected(false)
          setSessionStatus('disconnected')
        }
      })

    channelRef.current = channel
  }

  const handleVisitorAction = (action: any) => {
    console.log('Handling visitor action:', action)
    // In a real implementation, you would apply the action to the viewer
    // For now, we'll just log it
  }

  const sendAgentControl = async (type: string, data: any) => {
    if (!channelRef.current) return

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'agent-control',
        payload: {
          type,
          data,
          session_id: session.id,
          timestamp: Date.now(),
        },
      })
      console.log('Agent control sent:', { type, data })
    } catch (error) {
      console.error('Failed to send agent control:', error)
    }
  }

  const requestSnapshot = async () => {
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'request-snapshot',
        payload: {
          session_id: session.id,
          timestamp: Date.now(),
        },
      })
      console.log('Snapshot requested for session:', session.id)
    } catch (error) {
      console.error('Failed to request snapshot:', error)
    }
  }

  // Agent Control Handlers
  const handleIframeLoad = () => {
    console.log('Iframe loaded, ready for agent controls')
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate the actual position in the iframe
    const iframe = iframeRef.current
    if (iframe) {
      const iframeRect = iframe.getBoundingClientRect()
      const iframeX = x - iframeRect.left
      const iframeY = y - iframeRect.top

      sendAgentControl('click', {
        x: iframeX,
        y: iframeY,
        button: e.button,
        timestamp: Date.now()
      })
    }
  }

    const handleOverlayMouseMove = (e: React.MouseEvent) => {
    // Send mouse position for cursor tracking
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Throttle mouse move events
    if (Date.now() - lastMouseMove.current > 50) {
      sendAgentControl('mouse-move', {
        x,
        y,
        timestamp: Date.now()
      })
      lastMouseMove.current = Date.now()
    }
  }

  const handleOverlayScroll = (e: React.UIEvent) => {
    const target = e.currentTarget as HTMLElement
    sendAgentControl('scroll', {
      scrollX: target.scrollLeft,
      scrollY: target.scrollTop,
      timestamp: Date.now()
    })
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {session.page_title || 'Untitled Page'}
            </h2>
            <p className="text-sm text-gray-600">
              {session.current_url}
            </p>
            <p className="text-xs text-gray-500">
              Session: {session.id} | Status: {sessionStatus} | Events: {events.length}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

                         <button
               onClick={requestSnapshot}
               className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
             >
               Request Snapshot
             </button>

             <button
               onClick={() => sendAgentControl('test-click', { x: 100, y: 100 })}
               className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 rounded"
             >
               Test Click
             </button>

            <button
              onClick={() => setShowEventLog(!showEventLog)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              {showEventLog ? 'Hide' : 'Show'} Events
            </button>

            <button
              onClick={onEndSession}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

            {/* Main Content */}
      <div className="flex-1 flex">
        {/* Page Viewer - Full Width */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-gray-100 p-4">
                         {isConnected ? (
               <div className="w-full h-full border border-gray-300 rounded bg-white overflow-hidden relative">
                 {/* Live Demo Page Viewer */}
                 <iframe
                   src="/demo"
                   className="w-full h-full border-0"
                   title="Live Demo Page"
                   sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                   onLoad={handleIframeLoad}
                   ref={iframeRef}
                 />

                 {/* Agent Control Overlay */}
                 <div
                   className="absolute inset-0 pointer-events-none"
                   style={{ zIndex: 10 }}
                 >
                   <div
                     className="w-full h-full pointer-events-auto"
                     onClick={handleOverlayClick}
                     onMouseMove={handleOverlayMouseMove}
                     onScroll={handleOverlayScroll}
                   />
                 </div>
               </div>
            ) : (
              <div className="w-full h-full border border-gray-300 rounded bg-white flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
                      <div className="w-8 h-8 rounded-full bg-red-500" />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Connecting...
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Establishing connection to the visitor's session...
                  </p>

                  <div className="animate-pulse">
                    <div className="w-32 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded mx-auto"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Log - Only show if enabled */}
        {showEventLog && (
          <div className="w-80 bg-white border-l">
            <EventLog events={events} />
          </div>
        )}
      </div>
    </div>
  )
}

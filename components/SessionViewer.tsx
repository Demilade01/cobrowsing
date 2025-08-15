'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CobrowseSession } from '@/lib/supabase'
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

interface DOMSnapshot {
  session_id: string
  timestamp: number
  html: string
  css: string[]
  viewport: {
    width: number
    height: number
    scrollX: number
    scrollY: number
  }
}

interface VisitorEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'dom_change'
  target?: string
  data: any
  timestamp: number
  sequence: number
}

export default function SessionViewer({ session, onEndSession }: SessionViewerProps) {
  const [currentSnapshot, setCurrentSnapshot] = useState<DOMSnapshot | null>(null)
  const [events, setEvents] = useState<VisitorEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showEventLog, setShowEventLog] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const channelRef = useRef<any>(null)
  const isSetupRef = useRef(false)

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
  }, []) // Remove session.id dependency to prevent reconnections

  // Handle session changes without reconnecting
  useEffect(() => {
    if (channelRef.current && session.id) {
      console.log('Session changed to:', session.id)
      // Update the session ID in the channel if needed
      // But don't recreate the connection
    }
  }, [session.id])

    const setupRealtimeConnection = () => {
    console.log('Setting up realtime connection for session:', session.id)

    // Clean up existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Use a single channel for the session
    const sessionChannel = supabase.channel(`cobrowse:${session.id}`)

    // Also listen to dashboard channel as fallback
    const dashboardChannel = supabase.channel('cobrowse-dashboard')

    // Listen for all events on the session channel
    sessionChannel
      .on('broadcast', { event: 'snapshot' }, (payload: any) => {
        console.log('Received snapshot from session channel:', payload)
        const snapshotData = payload.payload || payload
        if (snapshotData.session_id === session.id) {
          console.log('Snapshot data:', {
            session_id: snapshotData.session_id,
            html_length: snapshotData.html?.length,
            css_count: snapshotData.css?.length,
            viewport: snapshotData.viewport
          })
          setCurrentSnapshot(snapshotData)
          renderSnapshot(snapshotData)
        }
      })
      .on('broadcast', { event: 'visitor-action' }, (payload: any) => {
        console.log('Received visitor action from session channel:', payload)
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
      .on('broadcast', { event: '*' }, (payload: any) => {
        console.log('Received broadcast event from session channel:', payload)
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('Session presence synced')
        // Don't set isConnected here to avoid re-renders
      })
      .subscribe((status: any) => {
        console.log('Session channel status:', status)
        setIsConnected(status === 'SUBSCRIBED')

        // Only track presence after successful subscription
        if (status === 'SUBSCRIBED') {
          console.log('✅ Session channel successfully connected')
          // Track agent presence
          sessionChannel.track({
            agent_id: 'agent_1',
            session_id: session.id,
            timestamp: Date.now(),
          }).then(() => {
            console.log('Agent presence tracked successfully')
          }).catch((error: any) => {
            console.error('Failed to track agent presence:', error)
          })
        }
        // Remove retry logic - let dashboard channel handle fallback
      })

    // Listen on dashboard channel for snapshots (fallback)
    dashboardChannel
      .on('broadcast', { event: 'snapshot' }, (payload: any) => {
        console.log('Received snapshot from dashboard channel (fallback):', payload)
        const snapshotData = payload.payload || payload
        if (snapshotData.session_id === session.id) {
          console.log('✅ Snapshot received from dashboard channel for session:', session.id)
          console.log('Snapshot data from dashboard channel:', {
            session_id: snapshotData.session_id,
            html_length: snapshotData.html?.length,
            css_count: snapshotData.css?.length,
            viewport: snapshotData.viewport
          })
          setCurrentSnapshot(snapshotData)
          renderSnapshot(snapshotData)
        } else {
          console.log('❌ Snapshot session ID mismatch:', snapshotData.session_id, 'vs', session.id)
        }
      })
      .on('broadcast', { event: '*' }, (payload: any) => {
        console.log('Dashboard channel received event:', payload.event, payload)
      })
      .subscribe((status: any) => {
        console.log('Dashboard channel status (fallback):', status)
      })

    channelRef.current = sessionChannel
  }

  const renderSnapshot = (snapshot: DOMSnapshot) => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (!doc) {
      console.error('Cannot access iframe document')
      return
    }

    console.log('Rendering snapshot...')
    console.log('HTML length:', snapshot.html?.length)
    console.log('CSS count:', snapshot.css?.length)

    try {
      // Clear existing content
      doc.open()
      doc.write(snapshot.html || '<html><body>No content available</body></html>')
      doc.close()

      // Apply CSS
      if (snapshot.css && snapshot.css.length > 0) {
        snapshot.css.forEach((css, index) => {
          if (css.startsWith('http')) {
            // External stylesheet
            const link = doc.createElement('link')
            link.rel = 'stylesheet'
            link.href = css
            doc.head.appendChild(link)
          } else if (css.trim()) {
            // Inline styles
            const style = doc.createElement('style')
            style.textContent = css
            doc.head.appendChild(style)
          }
        })
      }

      // Set viewport
      if (iframe.contentWindow && snapshot.viewport) {
        iframe.contentWindow.scrollTo(snapshot.viewport.scrollX || 0, snapshot.viewport.scrollY || 0)
      }

      console.log('✅ Snapshot rendered successfully')
      console.log('Iframe content length:', doc.documentElement.outerHTML.length)
    } catch (error) {
      console.error('❌ Failed to render snapshot:', error)
    }
  }

  const handleVisitorAction = (action: any) => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (!doc) return

    switch (action.type) {
      case 'click':
        // Highlight clicked element
        if (action.target) {
          const element = doc.querySelector(action.target)
          if (element) {
            element.style.outline = '2px solid red'
            element.style.outlineOffset = '2px'
            setTimeout(() => {
              element.style.outline = ''
              element.style.outlineOffset = ''
            }, 2000)
          }
        }
        break

      case 'scroll':
        // Update scroll position
        if (iframe.contentWindow) {
          iframe.contentWindow.scrollTo(action.data.scrollX, action.data.scrollY)
        }
        break

      case 'input':
        // Update input value
        if (action.target) {
          const element = doc.querySelector(action.target) as HTMLInputElement
          if (element) {
            element.value = action.data.value
            element.style.backgroundColor = '#fff3cd'
            setTimeout(() => {
              element.style.backgroundColor = ''
            }, 1000)
          }
        }
        break

      case 'navigation':
        // Handle navigation (might need to request new snapshot)
        console.log('Navigation detected:', action.data)
        break
    }
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
          timestamp: Date.now(),
        },
      })
      console.log('Agent control sent:', { type, data })
    } catch (error) {
      console.error('Failed to send agent control:', error)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLIFrameElement>) => {
    const iframe = e.currentTarget
    const rect = iframe.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    sendAgentControl('click', {
      selector: 'body', // TODO: Calculate actual selector
      x,
      y,
    })
  }

  const handleScroll = (e: React.UIEvent<HTMLIFrameElement>) => {
    const iframe = e.currentTarget
    if (iframe.contentWindow) {
      sendAgentControl('scroll', {
        scrollX: iframe.contentWindow.scrollX,
        scrollY: iframe.contentWindow.scrollY,
      })
    }
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
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

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
             <iframe
               ref={iframeRef}
               className="w-full h-full border border-gray-300 rounded bg-white"
               onClick={handleClick}
               onScroll={handleScroll}
               srcDoc="<html><body style='display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; color: #666;'><div>Loading session content...</div></body></html>"
             />
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

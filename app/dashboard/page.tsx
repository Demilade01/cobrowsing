'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import SessionList from '@/components/SessionList'
import SessionViewer from '@/components/SessionViewer'

// Interface for active sessions using presence
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

export default function Dashboard() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [agentId] = useState('agent_' + Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    setupRealtimeConnection()
    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels()
    }
  }, [])

    const setupRealtimeConnection = () => {
    console.log('Setting up dashboard realtime connection...')

    // Listen for broadcast events from cobrowse sessions
    const channel = supabase.channel('cobrowse-dashboard')

    channel
      .on('broadcast', { event: 'session-started' }, (payload) => {
        console.log('🎉 New session started:', payload)
        console.log('Payload details:', {
          session_id: payload.payload?.session_id || payload.session_id,
          visitor_id: payload.payload?.visitor_id || payload.visitor_id,
          url: payload.payload?.url || payload.url,
          title: payload.payload?.title || payload.title
        })

        // Handle both payload structures
        const sessionData = payload.payload || payload

        const newSession: ActiveSession = {
          id: sessionData.session_id,
          visitor_id: sessionData.visitor_id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          current_url: sessionData.url || window.location.href,
          page_title: sessionData.title || 'Demo Page'
        }
        console.log('Adding session to dashboard:', newSession)
        setSessions(prev => [...prev, newSession])
        setLoading(false)
      })
      .on('broadcast', { event: 'session-ended' }, (payload) => {
        console.log('Session ended:', payload)
        const sessionData = payload.payload || payload
        setSessions(prev => prev.filter(s => s.id !== sessionData.session_id))
      })
      .on('broadcast', { event: '*' }, (payload) => {
        console.log('Dashboard received broadcast event:', payload)
      })
      .subscribe((status) => {
        console.log('Dashboard connection status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard successfully connected to realtime')
          setLoading(false)
        }
      })

    // Also listen for any broadcast events to debug
    console.log('Dashboard channel setup complete')
  }

  const updateSessionsFromPresence = async () => {
    try {
      // For now, we'll use a simpler approach - just track sessions manually
      // In a real implementation, you'd want to use Supabase's presence API properly
      const activeSessions: ActiveSession[] = []

      // This is a simplified version - in production you'd want to properly
      // track presence across all channels
      console.log('Updating sessions from presence...')

      setSessions(activeSessions)
    } catch (error) {
      console.error('Error updating sessions from presence:', error)
    }
  }

    const joinSession = async (session: ActiveSession) => {
    try {
      // Join the presence channel for this session
      const channel = supabase.channel(`cobrowse:${session.id}`)

      // Subscribe to the channel first
      await channel.subscribe()

      // Then track presence
      await channel.track({
        agent_id: agentId,
        session_id: session.id,
        visitor_id: session.visitor_id,
        url: window.location.href,
        timestamp: Date.now(),
        type: 'agent'
      })

      // Update session with agent info
      const updatedSession = { ...session, agent_id: agentId }
      setSelectedSession(updatedSession)

      // Broadcast session update
      await channel.send({
        type: 'broadcast',
        event: 'session-update',
        payload: updatedSession
      })

      console.log('Joined session:', session.id)
    } catch (error) {
      console.error('Error joining session:', error)
    }
  }

    const endSession = async (sessionId: string) => {
    try {
      // Leave the presence channel
      const channel = supabase.channel(`cobrowse:${sessionId}`)

      // Untrack presence first
      await channel.untrack()

      // Then unsubscribe
      await channel.unsubscribe()

      // Update local state
      setSelectedSession(null)
      setSessions(prev => prev.filter(s => s.id !== sessionId))

      console.log('Ended session:', sessionId)
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to co-browse sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Co-browse Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Live visitor sessions</p>
          <p className="text-xs text-gray-500 mt-1">Agent ID: {agentId}</p>
        </div>

        <SessionList
          sessions={sessions}
          selectedSession={selectedSession}
          onSelectSession={joinSession}
          onEndSession={endSession}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <SessionViewer
            session={selectedSession}
            onEndSession={() => endSession(selectedSession.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Session Selected
              </h2>
              <p className="text-gray-600 mb-4">
                Select a session from the sidebar to start co-browsing
              </p>
                             {sessions.length === 0 && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <p className="text-blue-800 text-sm mb-3">
                     No active sessions found. Open the demo page to create a session.
                   </p>
                   <div className="space-y-2">
                     <a
                       href="/demo"
                       className="text-blue-600 hover:text-blue-800 underline text-sm block"
                     >
                       Go to Demo Page
                     </a>
                     <button
                       onClick={() => {
                         console.log('Manual test: Creating a test session')
                         const testSession: ActiveSession = {
                           id: 'test_' + Math.random().toString(36).substr(2, 9),
                           visitor_id: 'test_visitor',
                           status: 'active',
                           created_at: new Date().toISOString(),
                           updated_at: new Date().toISOString(),
                           current_url: 'http://localhost:3000/demo',
                           page_title: 'Test Demo Page'
                         }
                         setSessions([testSession])
                       }}
                       className="text-blue-600 hover:text-blue-800 underline text-sm block"
                     >
                       Add Test Session (Debug)
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

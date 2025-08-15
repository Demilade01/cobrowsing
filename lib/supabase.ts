import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Types for co-browsing sessions
export interface CobrowseSession {
  id: string
  visitor_id: string
  agent_id?: string
  status: 'active' | 'paused' | 'ended'
  created_at: string
  updated_at: string
  current_url: string
  page_title: string
}

export interface DOMEvent {
  id: string
  session_id: string
  type: 'click' | 'scroll' | 'navigation' | 'input' | 'dom_change'
  timestamp: number
  data: any
  sequence: number
}

export interface DOMSnapshot {
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

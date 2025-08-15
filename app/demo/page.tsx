'use client'

import { useEffect, useState } from 'react'

export default function DemoPage() {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    const setupSupabaseAndWidget = async () => {
      // Make Supabase client available globally for the widget
      if (typeof window !== 'undefined') {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          const supabase = createClient(supabaseUrl, supabaseKey, {
            realtime: {
              params: {
                eventsPerSecond: 10,
              },
            },
          })
          ;(window as any).supabase = supabase
          console.log('Supabase client made available globally')

          // Now load the widget script after Supabase is ready
          const script = document.createElement('script')
          script.src = '/tour-cobrowse.js'
          script.onload = () => {
            setIsWidgetLoaded(true)
            initializeWidget()
          }
          script.onerror = () => {
            console.error('Failed to load widget script')
          }
          document.head.appendChild(script)
        } catch (error) {
          console.error('Failed to setup Supabase client:', error)
        }
      }
    }

    setupSupabaseAndWidget()

    return () => {
      // Cleanup if needed
    }
  }, [])

  const initializeWidget = () => {
    console.log('Initializing widget...')
    console.log('Environment variables:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    })

    if (typeof window !== 'undefined' && (window as any).initTourCobrowse) {
      // Use a consistent session ID for demo purposes
      const sessionId = 'demo_rcqo661fz'
      setSessionId(sessionId)

      try {
        const cobrowse = (window as any).initTourCobrowse({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
          sessionId: sessionId,
          visitorId: 'demo_visitor',
          enableControl: true,
          // Add more detailed configuration
          requireConsent: false,
          maxSessionDuration: 60, // 60 minutes
          rateLimit: 20, // 20 events per second
          anonymizeData: true,
        })

                console.log('Co-browse initialized:', cobrowse)

        // Store the cobrowse instance globally for debugging
        ;(window as any).cobrowseInstance = cobrowse

        // Listen for agent controls
        setupAgentControlListener()
      } catch (error) {
        console.error('Failed to initialize cobrowse:', error)
      }
    } else {
      console.error('initTourCobrowse function not found on window object')
    }
  }

  const setupAgentControlListener = () => {
    if (typeof window !== 'undefined') {
      // Listen for agent control events from the dashboard channel
      const channel = (window as any).supabase?.channel('cobrowse-dashboard')

      if (channel) {
        channel
          .on('broadcast', { event: 'agent-control' }, (payload: any) => {
            console.log('Agent control received:', payload)
            const controlData = payload.payload || payload

            if (controlData.session_id === 'demo_rcqo661fz') {
              executeAgentControl(controlData)
            }
          })
          .subscribe()
      }
    }
  }

  const executeAgentControl = (control: any) => {
    console.log('Executing agent control:', control)

    switch (control.type) {
      case 'click':
        executeClick(control.data)
        break
      case 'scroll':
        executeScroll(control.data)
        break
      case 'input':
        executeInput(control.data)
        break
      case 'mouse-move':
        executeMouseMove(control.data)
        break
      default:
        console.log('Unknown agent control type:', control.type)
    }
  }

  const executeClick = (data: any) => {
    // Find element at coordinates and click it
    const element = document.elementFromPoint(data.x, data.y) as HTMLElement
    if (element) {
      console.log('Agent clicking element:', element)

      // Show visual indicator
      showAgentControlIndicator()

      // Show agent cursor at click position
      showAgentCursor(data.x, data.y)

      // Highlight the element briefly
      const originalOutline = element.style.outline
      element.style.outline = '2px solid #10b981'
      element.style.outlineOffset = '2px'

      // Click the element
      element.dispatchEvent(new MouseEvent('click', {
        clientX: data.x,
        clientY: data.y,
        button: data.button || 0,
        bubbles: true,
        cancelable: true
      }))

      // Remove highlight after 1 second
      setTimeout(() => {
        element.style.outline = originalOutline
        element.style.outlineOffset = ''
      }, 1000)
    }
  }

  const executeScroll = (data: any) => {
    window.scrollTo(data.scrollX, data.scrollY)
  }

  const executeInput = (data: any) => {
    const element = document.querySelector(data.selector)
    if (element && element instanceof HTMLInputElement) {
      element.value = data.value
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  const executeMouseMove = (data: any) => {
    // Show agent cursor position
    console.log('Agent mouse position:', data.x, data.y)
    showAgentCursor(data.x, data.y)
  }

  // Show agent cursor on the page
  const showAgentCursor = (x: number, y: number) => {
    let cursor = document.getElementById('agent-cursor')

    if (!cursor) {
      cursor = document.createElement('div')
      cursor.id = 'agent-cursor'
      cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.1s ease;
      `
      document.body.appendChild(cursor)
    }

    cursor.style.left = x + 'px'
    cursor.style.top = y + 'px'

    // Add a subtle pulse effect
    cursor.style.transform = 'translate(-50%, -50%) scale(1.2)'
    setTimeout(() => {
      cursor!.style.transform = 'translate(-50%, -50%) scale(1)'
    }, 100)
  }

  // Add visual indicator for agent control
  const showAgentControlIndicator = () => {
    const indicator = document.createElement('div')
    indicator.id = 'agent-control-indicator'
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `
    indicator.textContent = 'Agent is controlling this page'
    document.body.appendChild(indicator)

    // Remove after 3 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator)
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Co-browse Demo</h1>
              <p className="text-sm text-gray-600">Test the co-browsing functionality</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isWidgetLoaded ? 'Widget Loaded' : 'Loading Widget...'}
                </span>
              </div>
              {sessionId && (
                <div className="text-sm text-gray-600">
                  Session: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Demo Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Interactive Demo Elements</h2>

          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Buttons</h3>
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Primary Button
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                  Secondary Button
                </button>
                <button className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50">
                  Danger Button
                </button>
              </div>
            </div>

            {/* Form Inputs */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Form Inputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue="test@example.com"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    defaultValue="password123"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue="John Doe"
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue="+1 (555) 123-4567"
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Dropdown */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dropdown</h3>
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm">
                <option value="">Select an option</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </select>
            </div>

            {/* Checkboxes and Radio Buttons */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Checkboxes & Radio Buttons</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="checkbox1" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
                  <label htmlFor="checkbox1" className="text-sm text-gray-700">Checkbox 1</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="checkbox2" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
                  <label htmlFor="checkbox2" className="text-sm text-gray-700">Checkbox 2</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="radio" id="radio1" name="radio" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2" />
                  <label htmlFor="radio1" className="text-sm text-gray-700">Radio 1</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="radio" id="radio2" name="radio" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2" />
                  <label htmlFor="radio2" className="text-sm text-gray-700">Radio 2</label>
                </div>
              </div>
            </div>

            {/* Submit Form */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Submit Form</h3>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    defaultValue="This is a test message for the co-browsing demo. You can edit this text to test real-time updates."
                    placeholder="Enter your message"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 resize-none shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Form
                </button>
              </form>
            </div>

            {/* Scrollable Content */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Scrollable Content</h3>
              <div className="h-40 overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50">
                <p className="text-sm text-gray-700 mb-2">
                  This is a scrollable content area. Try scrolling up and down to test the scroll tracking functionality.
                </p>
                {Array.from({ length: 20 }, (_, i) => (
                  <p key={i} className="text-sm text-gray-600 mb-1">
                    Line {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                ))}
              </div>
            </div>

            {/* Dynamic Content */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dynamic Content</h3>
              <button
                onClick={() => {
                  const container = document.getElementById('dynamic-content')
                  if (container) {
                    const newElement = document.createElement('div')
                    newElement.className = 'p-3 bg-blue-100 rounded mb-2'
                    newElement.textContent = `Dynamic element added at ${new Date().toLocaleTimeString()}`
                    container.appendChild(newElement)
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Add Dynamic Element
              </button>
              <div id="dynamic-content" className="mt-3">
                <div className="p-3 bg-gray-100 rounded mb-2">
                  Initial dynamic content
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test</h3>
          <ol className="text-blue-800 space-y-2">
            <li>1. Open the <a href="/dashboard" className="underline font-medium">Dashboard</a> in another tab</li>
            <li>2. Interact with the elements on this page (click, scroll, type)</li>
            <li>3. Watch the real-time events in the dashboard</li>
            <li>4. Try using agent controls from the dashboard</li>
            <li>5. Check the browser console for widget logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}


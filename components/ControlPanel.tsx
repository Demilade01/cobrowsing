'use client'

import { useState } from 'react'
import { CobrowseSession } from '@/lib/supabase'

interface ControlPanelProps {
  session: CobrowseSession
  onSendControl: (type: string, data: any) => void
}

export default function ControlPanel({ session, onSendControl }: ControlPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [inputSelector, setInputSelector] = useState('')
  const [clickSelector, setClickSelector] = useState('')

  const handleScrollToTop = () => {
    onSendControl('scroll', { scrollX: 0, scrollY: 0 })
  }

  const handleScrollToBottom = () => {
    onSendControl('scroll', { scrollX: 0, scrollY: 10000 })
  }

  const handleClickElement = () => {
    if (clickSelector.trim()) {
      onSendControl('click', { selector: clickSelector.trim() })
      setClickSelector('')
    }
  }

  const handleFillInput = () => {
    if (inputSelector.trim() && inputValue.trim()) {
      onSendControl('input', {
        selector: inputSelector.trim(),
        value: inputValue.trim(),
      })
      setInputValue('')
      setInputSelector('')
    }
  }

  const handleNavigate = (url: string) => {
    onSendControl('navigation', { url })
  }

  return (
    <div className="w-80 bg-white border-l p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Controls</h3>

      <div className="space-y-4">
        {/* Session Info */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Session Info</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Visitor: {session.visitor_id}</p>
            <p>Status: {session.status}</p>
            <p>Started: {new Date(session.created_at).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Scroll Controls</h4>
          <div className="flex space-x-2">
            <button
              onClick={handleScrollToTop}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Top
            </button>
            <button
              onClick={handleScrollToBottom}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Bottom
            </button>
          </div>
        </div>

        {/* Click Control */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Click Element</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={clickSelector}
              onChange={(e) => setClickSelector(e.target.value)}
              placeholder="CSS selector (e.g., #button, .class)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleClickElement}
              disabled={!clickSelector.trim()}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Click
            </button>
          </div>
        </div>

        {/* Input Control */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Fill Input</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={inputSelector}
              onChange={(e) => setInputSelector(e.target.value)}
              placeholder="CSS selector (e.g., input[name='email'])"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Value to fill"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleFillInput}
              disabled={!inputSelector.trim() || !inputValue.trim()}
              className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Fill Input
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavigate('https://google.com')}
              className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Go to Google
            </button>
            <button
              onClick={() => handleNavigate('https://github.com')}
              className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Go to GitHub
            </button>
          </div>
        </div>

        {/* Common Selectors */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Common Selectors</h4>
          <div className="space-y-1">
            <button
              onClick={() => setClickSelector('button')}
              className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
            >
              button - Any button
            </button>
            <button
              onClick={() => setClickSelector('input[type="submit"]')}
              className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
            >
              input[type="submit"] - Submit buttons
            </button>
            <button
              onClick={() => setInputSelector('input[type="email"]')}
              className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
            >
              input[type="email"] - Email inputs
            </button>
            <button
              onClick={() => setInputSelector('input[type="password"]')}
              className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
            >
              input[type="password"] - Password inputs
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 p-3 rounded">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Instructions</h4>
          <ul className="text-xs text-yellow-800 space-y-1">
            <li>• Use CSS selectors to target elements</li>
            <li>• Common: #id, .class, tag[attribute]</li>
            <li>• Click events will be sent to visitor</li>
            <li>• Input fills will update form fields</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

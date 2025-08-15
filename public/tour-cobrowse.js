/**
 * Tour Co-browse Widget
 * Real-time co-browsing module for Tour.video / LeaseMagnets
 */

class TourCobrowse {
  constructor(config) {
    this.config = config
    this.sessionId = config.sessionId || this.generateId()
    this.visitorId = config.visitorId || this.generateId()
    this.sequence = 0
    this.observer = null
    this.isConnected = false
    this.eventQueue = []
    this.lastSnapshot = ''
    this.sessionStartTime = Date.now()
    this.lastEventTime = 0
    this.eventCount = 0
    this.userConsent = false
    this.supabase = null

    this.initSupabase()
    this.init()
  }

  generateId() {
    return 'cb_' + Math.random().toString(36).substr(2, 9)
  }

    async initSupabase() {
    try {
      console.log('Initializing Supabase client...')
      console.log('Supabase URL:', this.config.supabaseUrl)
      console.log('Supabase Key length:', this.config.supabaseKey ? this.config.supabaseKey.length : 0)

      // Use the Supabase client from the global scope (bundled with Next.js)
      if (typeof window !== 'undefined' && window.supabase) {
        console.log('Using global Supabase client')
        this.supabase = window.supabase
      } else {
        // Wait for the global client to be available
        console.log('Waiting for global Supabase client...')
        let attempts = 0
        const maxAttempts = 10

        while (!window.supabase && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
          console.log(`Attempt ${attempts}/${maxAttempts} - waiting for global Supabase client...`)
        }

        if (window.supabase) {
          console.log('Global Supabase client found after waiting')
          this.supabase = window.supabase
        } else {
          throw new Error('Global Supabase client not available after waiting')
        }
      }

      console.log('Supabase client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      throw new Error('Co-browsing initialization failed. Please check your Supabase configuration and internet connection.')
    }
  }

  async init() {
    try {
      // Check for user consent if required
      if (this.config.requireConsent && !this.userConsent) {
        this.requestUserConsent()
        return
      }

      // Check session duration limit
      if (this.config.maxSessionDuration) {
        this.setupSessionTimeout()
      }

      await this.initSupabase()
      this.setupDOMObserver()
      this.setupEventListeners()
      this.setupRealtimeConnection()
      this.takeInitialSnapshot()
      console.log('Tour Co-browse initialized:', this.sessionId)
    } catch (error) {
      console.error('Failed to initialize Tour Co-browse:', error)
    }
  }

  setupDOMObserver() {
    // Use MutationObserver to detect DOM changes
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.handleDOMChange(mutation)
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
    })
  }

  handleDOMChange(mutation) {
    const change = {
      type: this.getMutationType(mutation),
      target: this.getSelector(mutation.target),
      data: this.serializeNode(mutation.target),
      timestamp: Date.now(),
    }

    this.queueEvent(change)
  }

  getMutationType(mutation) {
    return 'dom_change'
  }

  getSelector(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node
      if (element.id) return `#${element.id}`
      if (element.className) return `.${element.className.split(' ')[0]}`
      return element.tagName.toLowerCase()
    }
    return 'text'
  }

  serializeNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node
      return {
        tagName: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        attributes: this.getAttributes(element),
        innerHTML: element.innerHTML.substring(0, 1000), // Limit size
      }
    }
    return { textContent: node.textContent?.substring(0, 500) }
  }

  getAttributes(element) {
    const attrs = {}
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      attrs[attr.name] = attr.value
    }
    return attrs
  }

  setupEventListeners() {
    // Click events
    document.addEventListener('click', (e) => {
      const event = {
        type: 'click',
        target: this.getSelector(e.target),
        data: {
          x: e.clientX,
          y: e.clientY,
          button: e.button,
        },
        timestamp: Date.now(),
      }
      this.queueEvent(event)
    })

    // Scroll events (throttled)
    let scrollTimeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = window.setTimeout(() => {
        const event = {
          type: 'scroll',
          data: {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
          },
          timestamp: Date.now(),
        }
        this.queueEvent(event)
      }, 100)
    })

    // Input events
    document.addEventListener('input', (e) => {
      const target = e.target
      const event = {
        type: 'input',
        target: this.getSelector(target),
        data: {
          value: target.value,
          type: target.type,
          name: target.name,
        },
        timestamp: Date.now(),
      }
      this.queueEvent(event)
    })

    // Navigation events
    window.addEventListener('popstate', () => {
      const event = {
        type: 'navigation',
        data: {
          url: window.location.href,
          title: document.title,
        },
        timestamp: Date.now(),
      }
      this.queueEvent(event)
    })
  }

  setupRealtimeConnection() {
    if (!this.supabase) return

    console.log('Setting up realtime connection for session:', this.sessionId)

    // Join presence channel for this session
    const channel = this.supabase.channel(`cobrowse:${this.sessionId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced')
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Agent joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Agent left:', leftPresences)
      })
      .on('broadcast', { event: 'agent-control' }, (payload) => {
        this.handleAgentControl(payload)
      })
      .subscribe((status) => {
        this.isConnected = status === 'SUBSCRIBED'
        console.log('Realtime status:', status)
        if (this.isConnected) {
          console.log('✅ Successfully connected to realtime')
        }
      })

    // Track visitor presence
    channel.track({
      visitor_id: this.visitorId,
      session_id: this.sessionId,
      url: window.location.href,
      timestamp: Date.now(),
    })
  }

  handleAgentControl(payload) {
    if (!this.config.enableControl) return

    const { type, data } = payload
    switch (type) {
      case 'click':
        this.simulateClick(data)
        break
      case 'scroll':
        this.simulateScroll(data)
        break
      case 'input':
        this.simulateInput(data)
        break
      case 'navigation':
        this.simulateNavigation(data)
        break
    }
  }

  simulateClick(data) {
    const element = document.querySelector(data.selector)
    if (element) {
      element.dispatchEvent(new MouseEvent('click', {
        clientX: data.x,
        clientY: data.y,
        bubbles: true,
      }))
    }
  }

  simulateScroll(data) {
    window.scrollTo(data.scrollX, data.scrollY)
  }

  simulateInput(data) {
    const element = document.querySelector(data.selector)
    if (element) {
      element.value = data.value
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  simulateNavigation(data) {
    window.location.href = data.url
  }

  queueEvent(event) {
    // Check rate limiting
    if (!this.checkRateLimit()) {
      console.warn('Rate limit exceeded, dropping event')
      return
    }

    // Anonymize data if enabled
    if (this.config.anonymizeData) {
      event = this.anonymizeEvent(event)
    }

    this.eventQueue.push(event)
    this.processEventQueue()
  }

  anonymizeEvent(event) {
    const anonymized = { ...event }

    // Remove sensitive data from input events
    if (event.type === 'input' && event.data) {
      const sensitiveFields = ['password', 'credit', 'ssn', 'social']
      const isSensitive = sensitiveFields.some(field =>
        event.target?.toLowerCase().includes(field) ||
        event.data.name?.toLowerCase().includes(field)
      )

      if (isSensitive) {
        anonymized.data = { ...event.data, value: '[REDACTED]' }
      }
    }

    return anonymized
  }

  async processEventQueue() {
    if (!this.isConnected || this.eventQueue.length === 0) return

    const event = this.eventQueue.shift()
    this.sequence++

    try {
      // Send via dashboard channel for better reliability
      const channel = this.supabase.channel('cobrowse-dashboard')
      await channel.send({
        type: 'broadcast',
        event: 'visitor-action',
        payload: {
          ...event,
          sequence: this.sequence,
          session_id: this.sessionId,
          visitor_id: this.visitorId,
        },
      })
    } catch (error) {
      console.error('Failed to send event:', error)
      // Re-queue failed events
      this.eventQueue.unshift(event)
    }
  }

  async takeInitialSnapshot() {
    const snapshot = {
      session_id: this.sessionId,
      timestamp: Date.now(),
      html: document.documentElement.outerHTML,
      css: this.extractCSS(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
    }

    this.lastSnapshot = snapshot.html

    console.log('Taking initial snapshot...')
    console.log('HTML length:', snapshot.html.length)
    console.log('CSS files:', snapshot.css.length)

    // Send session-started event to dashboard channel first
    console.log('Sending session-started to dashboard channel...')
    const dashboardChannel = this.supabase.channel('cobrowse-dashboard')
    try {
      await dashboardChannel.send({
        type: 'broadcast',
        event: 'session-started',
        payload: {
          session_id: this.sessionId,
          visitor_id: this.visitorId,
          url: window.location.href,
          title: document.title,
          timestamp: Date.now()
        },
      })
      console.log('✅ Session-started event sent to dashboard successfully')
    } catch (error) {
      console.error('❌ Failed to send session-started to dashboard:', error)
    }

    // Send snapshot to dashboard channel
    try {
      await dashboardChannel.send({
        type: 'broadcast',
        event: 'snapshot',
        payload: snapshot,
      })
      console.log('✅ Snapshot sent to dashboard channel successfully')
    } catch (error) {
      console.error('❌ Failed to send snapshot to dashboard:', error)
    }
  }

  extractCSS() {
    const stylesheets = []

    // Extract inline styles
    document.querySelectorAll('style').forEach((style) => {
      stylesheets.push(style.textContent || '')
    })

    // Extract external stylesheet URLs
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute('href')
      if (href) stylesheets.push(href)
    })

    return stylesheets
  }

  requestUserConsent() {
    // Create consent dialog
    const consentDialog = document.createElement('div')
    consentDialog.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 999999; display: flex;
      align-items: center; justify-content: center; font-family: Arial, sans-serif;
    `

    consentDialog.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
        <h3>Co-browsing Session</h3>
        <p>This website uses co-browsing technology to provide real-time support.
        An agent may view and interact with this page to help you.</p>
        <p><strong>Your privacy is protected:</strong></p>
        <ul style="text-align: left; margin: 20px 0;">
          <li>No personal data is stored</li>
          <li>Session ends when you close this page</li>
          <li>You can stop sharing at any time</li>
        </ul>
        <div style="margin-top: 20px;">
          <button id="consent-accept" style="background: #007bff; color: white; border: none; padding: 10px 20px; margin: 0 10px; border-radius: 5px; cursor: pointer;">Accept</button>
          <button id="consent-decline" style="background: #6c757d; color: white; border: none; padding: 10px 20px; margin: 0 10px; border-radius: 5px; cursor: pointer;">Decline</button>
        </div>
      </div>
    `

    document.body.appendChild(consentDialog)

    // Handle consent
    document.getElementById('consent-accept')?.addEventListener('click', () => {
      this.userConsent = true
      document.body.removeChild(consentDialog)
      this.init()
    })

    document.getElementById('consent-decline')?.addEventListener('click', () => {
      document.body.removeChild(consentDialog)
      console.log('Co-browsing declined by user')
    })
  }

  setupSessionTimeout() {
    const timeoutMs = (this.config.maxSessionDuration || 60) * 60 * 1000
    setTimeout(() => {
      console.log('Session timeout reached')
      this.end()
    }, timeoutMs)
  }

  checkRateLimit() {
    if (!this.config.rateLimit) return true

    const now = Date.now()
    const timeWindow = 1000 // 1 second

    if (now - this.lastEventTime > timeWindow) {
      this.eventCount = 0
      this.lastEventTime = now
    }

    this.eventCount++
    return this.eventCount <= (this.config.rateLimit || 10)
  }

  // Public API
  pause() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  resume() {
    if (this.observer) {
      this.setupDOMObserver()
    }
  }

  end() {
    this.pause()
    if (this.supabase) {
      const channel = this.supabase.channel(`cobrowse:${this.sessionId}`)

      // Send session-ended event before unsubscribing
      channel.send({
        type: 'broadcast',
        event: 'session-ended',
        payload: {
          session_id: this.sessionId,
          visitor_id: this.visitorId,
          timestamp: Date.now()
        },
      }).then(() => {
        channel.unsubscribe()
      })

      // Also send to dashboard channel
      const dashboardChannel = this.supabase.channel('cobrowse-dashboard')
      dashboardChannel.send({
        type: 'broadcast',
        event: 'session-ended',
        payload: {
          session_id: this.sessionId,
          visitor_id: this.visitorId,
          timestamp: Date.now()
        },
      })
    }
  }

  getSessionId() {
    return this.sessionId
  }

  getVisitorId() {
    return this.visitorId
  }
}

// Global initialization function
window.TourCobrowse = TourCobrowse
window.initTourCobrowse = (config) => {
  return new TourCobrowse(config)
}

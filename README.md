# Tour Co-browse

A real-time co-browsing solution for Tour.video / LeaseMagnets that enables agents to see and optionally control a visitor's page in real-time without traditional screen sharing.

## 🚀 Features

- **Real-time DOM synchronization** - See exactly what visitors see
- **Live event tracking** - Clicks, scrolls, form inputs, navigation
- **Agent control** - Remote clicks, form fills, scrolling
- **Session management** - Start, pause, and end co-browsing sessions
- **Supabase Realtime** - Fast, reliable communication
- **Modern UI** - Clean, responsive dashboard built with Next.js and Tailwind CSS

## 🏗️ Architecture

```
Widget (tour-cobrowse.ts) ←→ Supabase Realtime ←→ Dashboard (Next.js)
     ↓                           ↓                    ↓
DOM Observer              Presence/Broadcast    Real-time Viewer
Event Capture             Session Management    Agent Controls
```

### Key Components

1. **Widget Module** (`public/tour-cobrowse.ts`)
   - Single TypeScript file for easy integration
   - DOM observation and event capture
   - Real-time communication via Supabase
   - Agent control capabilities

2. **Dashboard** (`app/dashboard/`)
   - Session management interface
   - Real-time visitor page viewer
   - Agent control panel
   - Event logging and filtering

3. **Demo Page** (`app/demo/`)
   - Interactive testing environment
   - Various form elements and interactions
   - Widget integration example

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- Supabase account
- Modern browser with ES6+ support

### 1. Clone and Install

```bash
git clone <repository-url>
cd cobrowse
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Realtime in your project settings
3. Get your project URL and anon key from Settings > API

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Database Schema

The application uses Supabase Realtime for communication, so no additional database tables are required for basic functionality. The widget communicates directly through broadcast channels.

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage Guide

### For Website Owners (Widget Integration)

1. **Include the widget script** in your website:

```html
<script src="https://your-domain.com/tour-cobrowse.ts" type="module"></script>
```

2. **Initialize co-browsing** when needed:

```javascript
const cobrowse = window.initTourCobrowse({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key',
  sessionId: 'optional-session-id',
  visitorId: 'optional-visitor-id',
  enableControl: true // Allow agents to control the page
});
```

3. **Control the session**:

```javascript
// Pause tracking
cobrowse.pause();

// Resume tracking
cobrowse.resume();

// End session
cobrowse.end();

// Get session info
const sessionId = cobrowse.getSessionId();
const visitorId = cobrowse.getVisitorId();
```

### For Agents (Dashboard Usage)

1. **Access the dashboard** at `/dashboard`
2. **View active sessions** in the sidebar
3. **Join a session** by clicking on it
4. **Monitor real-time events** in the event log
5. **Control the visitor's page** using the control panel:
   - Scroll to top/bottom
   - Click elements using CSS selectors
   - Fill form inputs
   - Navigate to different URLs

## 🔧 Technical Details

### Widget Features

- **MutationObserver** for DOM change detection
- **Event listeners** for clicks, scrolls, inputs, navigation
- **Throttled scroll events** to prevent spam
- **CSS selector generation** for element targeting
- **HTML snapshot capture** for initial page state
- **Event queuing** for reliable transmission

### Dashboard Features

- **Real-time session monitoring**
- **Iframe-based page viewer**
- **Agent control interface**
- **Event filtering and logging**
- **Session status management**

### Communication Protocol

The widget and dashboard communicate through Supabase Realtime channels:

- **Presence channels** for session management
- **Broadcast channels** for event transmission
- **Event sequencing** for consistency
- **Automatic reconnection** on network issues

## 🧪 Testing

1. **Start the development server**: `npm run dev`
2. **Open the demo page**: Navigate to `/demo`
3. **Open the dashboard**: Navigate to `/dashboard` in another tab
4. **Interact with demo elements** and watch real-time updates
5. **Test agent controls** from the dashboard

## 🔒 Security Considerations

### **Privacy & Compliance**
- **User consent mechanism** - Built-in consent dialog for GDPR compliance
- **Data anonymization** - Automatic redaction of sensitive form fields
- **Session timeouts** - Configurable maximum session duration
- **No data persistence** - Events are not stored, only transmitted in real-time

### **Technical Security**
- **Rate limiting** - Configurable event rate limiting to prevent abuse
- **CORS configuration** - May be needed for cross-origin widget loading
- **Supabase RLS policies** - Should be configured for production
- **Agent authentication** - Should be implemented for production use
- **Secure communication** - All data transmitted via Supabase's secure channels

### **Production Recommendations**
- **HTTPS only** - Ensure all communications use HTTPS
- **Environment variables** - Never expose API keys in client-side code
- **Regular updates** - Keep dependencies updated for security patches
- **Monitoring** - Implement logging and monitoring for suspicious activity

## 🚀 Production Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 API Reference

### Widget Configuration

```typescript
interface CobrowseConfig {
  supabaseUrl: string      // Your Supabase project URL
  supabaseKey: string      // Your Supabase anon key
  sessionId?: string       // Optional custom session ID
  visitorId?: string       // Optional custom visitor ID
  enableControl?: boolean  // Allow agent control (default: false)
}
```

### Widget Methods

```typescript
class TourCobrowse {
  pause(): void           // Pause event tracking
  resume(): void          // Resume event tracking
  end(): void             // End session and cleanup
  getSessionId(): string  // Get current session ID
  getVisitorId(): string  // Get current visitor ID
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the demo page for examples
- Review the browser console for debugging information
- Ensure Supabase Realtime is enabled in your project
- Verify environment variables are correctly set

## 🔮 Future Enhancements

- [ ] Canvas element support
- [ ] Video/audio synchronization
- [ ] Multi-agent support
- [ ] Session recording and playback
- [ ] Advanced element targeting
- [ ] Mobile device support
- [ ] Performance optimizations
- [ ] Analytics and reporting

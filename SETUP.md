# Setup Guide for Co-browse Application

## Prerequisites

1. **Supabase Account**: You need a Supabase account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16 or higher
3. **npm or yarn**: For package management

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be created (this may take a few minutes)
3. Go to Settings > API in your project dashboard
4. Copy your Project URL and anon key

## Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase project URL and anon key.

## Step 3: Enable Realtime

1. In your Supabase dashboard, go to Database > Realtime
2. Enable Realtime for your project
3. Make sure the "Enable realtime" toggle is turned on

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run the Application

```bash
npm run dev
```

The application will be available at:
- Main app: http://localhost:3000
- Demo page: http://localhost:3000/demo
- Dashboard: http://localhost:3000/dashboard

## Step 6: Test the Application

1. Open the demo page in one tab: http://localhost:3000/demo
2. Open the dashboard in another tab: http://localhost:3000/dashboard
3. Interact with elements on the demo page
4. Watch for real-time events in the dashboard

## Troubleshooting

### No sessions appearing in dashboard
- Check that your Supabase credentials are correct in `.env.local`
- Ensure Realtime is enabled in your Supabase project
- Check the browser console for any error messages
- Verify that the demo page shows "Connected" status

### Connection errors
- Make sure your Supabase project is active and not paused
- Check that your anon key has the correct permissions
- Verify that Realtime is enabled in your project settings

### Widget not loading
- Check that the `/tour-cobrowse.js` file exists in the `public` folder
- Look for any JavaScript errors in the browser console
- Ensure the demo page is being served correctly

## Common Issues

1. **"Failed to connect to realtime service"**: Check your Supabase credentials and ensure Realtime is enabled
2. **"Widget script not available"**: The cobrowse widget script failed to load
3. **"No active sessions found"**: The demo page hasn't sent a session-started event yet

## Support

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Try refreshing both the demo page and dashboard

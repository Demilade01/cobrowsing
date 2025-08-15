#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Tour Co-browse Setup\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    console.log('Please provide your Supabase configuration:\n');

    const supabaseUrl = await question('Supabase Project URL (e.g., https://your-project.supabase.co): ');
    const supabaseKey = await question('Supabase Anon Key: ');

    if (!supabaseUrl || !supabaseKey) {
      console.log('\n❌ Both URL and key are required. Setup cancelled.');
      rl.close();
      return;
    }

    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# Optional: Custom configuration
# NEXT_PUBLIC_APP_NAME=Tour Co-browse
# NEXT_PUBLIC_APP_VERSION=1.0.0
`;

    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Configuration saved to .env.local');
    console.log('\nNext steps:');
    console.log('1. Make sure Realtime is enabled in your Supabase project');
    console.log('2. Run: npm run dev');
    console.log('3. Open: http://localhost:3000');
    console.log('4. Test the demo at: http://localhost:3000/demo');
    console.log('5. Access dashboard at: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();

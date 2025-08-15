import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tour Co-browse
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time co-browsing solution for Tour.video / LeaseMagnets
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 Co-browsing Features
          </h2>
          <ul className="text-blue-800 space-y-2">
            <li>• <strong>Real-time DOM synchronization</strong> - See exactly what visitors see</li>
            <li>• <strong>Live event tracking</strong> - Clicks, scrolls, form inputs, navigation</li>
            <li>• <strong>Agent control</strong> - Remote clicks, form fills, scrolling</li>
            <li>• <strong>Session management</strong> - Start, pause, and end co-browsing sessions</li>
            <li>• <strong>Supabase Realtime</strong> - Fast, reliable communication</li>
          </ul>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Open Dashboard
          </Link>

          <Link
            href="/demo"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Try Demo
          </Link>

          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/public/tour-cobrowse.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            View Widget Code
          </a>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            📋 Implementation Guide
          </h2>
          <ol className="font-mono list-inside list-decimal text-sm/6 text-gray-700 space-y-2">
            <li className="mb-2">
              Set up Supabase project with Realtime enabled
            </li>
            <li className="mb-2">
              Add environment variables: <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </li>
            <li className="mb-2">
              Include the widget script in your website
            </li>
            <li className="mb-2">
              Initialize co-browsing with: <code className="bg-gray-200 px-1 rounded">initTourCobrowse(config)</code>
            </li>
            <li className="mb-2">
              Use the dashboard to monitor and control sessions
            </li>
          </ol>
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://supabase.com/docs/guides/realtime"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Supabase Realtime
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Next.js Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          GitHub
        </a>
      </footer>
    </div>
  );
}

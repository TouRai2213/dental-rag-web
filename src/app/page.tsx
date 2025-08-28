import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Dental RAG Web Interface</h1>
          <p className="text-xl text-muted-foreground">
            AI-powered dental analysis and literature search platform
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/chat/new"
            className="p-6 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Chat Interface</h2>
            <p className="text-muted-foreground">
              Start a new conversation with AI for dental analysis and consultation.
            </p>
          </Link>

          <Link
            href="/documents"
            className="p-6 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Documents</h2>
            <p className="text-muted-foreground">
              Manage and search through your dental literature database.
            </p>
          </Link>

          <Link
            href="/auth/login"
            className="p-6 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Login</h2>
            <p className="text-muted-foreground">
              Access your account and conversation history.
            </p>
          </Link>

          <Link
            href="/admin"
            className="p-6 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Admin Dashboard</h2>
            <p className="text-muted-foreground">
              System administration and analytics (admin only).
            </p>
          </Link>
        </main>

        <footer className="text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
          </p>
          <p className="mt-2">
            🏗️ This is the project foundation. Features will be implemented in subsequent tasks.
          </p>
        </footer>
      </div>
    </div>
  );
}

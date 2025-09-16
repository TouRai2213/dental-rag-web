"use client"

import { useAuth } from "@/providers/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { UserMenu } from "@/components/user-menu"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info and logout */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dental RAG System</h1>
          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  )
}
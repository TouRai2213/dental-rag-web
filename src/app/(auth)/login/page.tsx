"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { LoadingSpinner } from "@/components/loading-spinner"

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/chat"
  const message = searchParams.get("message")

  return (
    <AuthCard
      title="Dental RAG System"
      subtitle="Sign in to your account"
    >
      {message && (
        <div className="text-green-600 text-sm text-center bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          {message}
        </div>
      )}
      <LoginForm callbackUrl={callbackUrl} />
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

interface ClientSessionProviderProps {
  children: ReactNode
  session?: any
}

export function ClientSessionProvider({ children, session }: ClientSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}
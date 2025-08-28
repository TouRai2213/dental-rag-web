"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileX, Users, MessageCircle, Calendar } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileX,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  )
}

// Pre-configured empty states for dental application
export function EmptyPatients({ onAddPatient }: { onAddPatient?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No patients found"
      description="Get started by adding your first patient to the system."
      actionLabel={onAddPatient ? "Add Patient" : undefined}
      onAction={onAddPatient}
    />
  )
}

export function EmptyReports({ onCreateReport }: { onCreateReport?: () => void }) {
  return (
    <EmptyState
      icon={FileX}
      title="No reports available"
      description="Start analyzing dental X-rays to generate your first cephalometric report."
      actionLabel={onCreateReport ? "Create Report" : undefined}
      onAction={onCreateReport}
    />
  )
}

export function EmptyConversations({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      icon={MessageCircle}
      title="No conversations yet"
      description="Start a new conversation to ask questions about dental analysis and reports."
      actionLabel={onStartChat ? "Start Chat" : undefined}
      onAction={onStartChat}
    />
  )
}

export function EmptyAppointments({ onSchedule }: { onSchedule?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No appointments scheduled"
      description="Schedule your first appointment to get started with patient management."
      actionLabel={onSchedule ? "Schedule Appointment" : undefined}
      onAction={onSchedule}
    />
  )
}
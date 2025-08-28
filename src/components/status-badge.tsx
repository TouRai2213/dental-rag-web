"use client"

import { Badge } from "@/components/ui/badge"
import { getStatusColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}

export function StatusBadge({ status, variant = "outline", className }: StatusBadgeProps) {
  const statusColorClass = getStatusColor(status)
  
  return (
    <Badge 
      variant={variant} 
      className={cn(
        "capitalize",
        variant === "outline" && statusColorClass,
        className
      )}
    >
      {status}
    </Badge>
  )
}

// Specific status badges for dental application
export function AppointmentStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
    'scheduled': { variant: 'outline', className: 'border-blue-200 bg-blue-50 text-blue-700' },
    'completed': { variant: 'outline', className: 'border-green-200 bg-green-50 text-green-700' },
    'cancelled': { variant: 'outline', className: 'border-red-200 bg-red-50 text-red-700' },
    'no-show': { variant: 'outline', className: 'border-orange-200 bg-orange-50 text-orange-700' },
    'rescheduled': { variant: 'outline', className: 'border-purple-200 bg-purple-50 text-purple-700' }
  }
  
  const config = statusConfig[status.toLowerCase()] || { variant: 'outline' as const, className: 'border-gray-200 bg-gray-50 text-gray-700' }
  
  return (
    <Badge variant={config.variant} className={cn("capitalize", config.className)}>
      {status}
    </Badge>
  )
}

export function ReportStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
    'draft': { variant: 'outline', className: 'border-gray-200 bg-gray-50 text-gray-700' },
    'pending': { variant: 'outline', className: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
    'completed': { variant: 'outline', className: 'border-green-200 bg-green-50 text-green-700' },
    'reviewed': { variant: 'outline', className: 'border-blue-200 bg-blue-50 text-blue-700' }
  }
  
  const config = statusConfig[status.toLowerCase()] || { variant: 'outline' as const, className: 'border-gray-200 bg-gray-50 text-gray-700' }
  
  return (
    <Badge variant={config.variant} className={cn("capitalize", config.className)}>
      {status}
    </Badge>
  )
}
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
  title: string
  subtitle?: string
  footer?: React.ReactNode
}

export function AuthCard({ 
  children, 
  className, 
  title, 
  subtitle,
  footer 
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className={cn("w-full max-w-md p-6 space-y-6 shadow-lg", className)}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </Card>
    </div>
  )
}
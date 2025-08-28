import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/chat">
              Return to Chat
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">
              Sign In as Different User
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
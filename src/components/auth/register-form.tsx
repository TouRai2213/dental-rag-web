"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { registerSchema, type RegisterFormData } from "@/lib/validation"
import Link from "next/link"

export function RegisterForm() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (_data: RegisterFormData) => {
    setError("")
    setSuccess(false)

    try {
      // TODO: Replace with actual registration API call
      // For now, simulate registration process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real implementation, you would:
      // 1. Call your registration API endpoint
      // 2. Handle user creation in your database
      // 3. Optionally send verification email
      // 4. Sign the user in automatically or redirect to login
      
      setSuccess(true)
      
      // Simulate successful registration and redirect after a moment
      setTimeout(() => {
        router.push("/login?message=Registration successful. Please sign in.")
      }, 2000)
      
    } catch {
      setError("Registration failed. Please try again.")
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="font-medium">Registration Successful!</h3>
          <p className="text-sm mt-1">Redirecting to login page...</p>
        </div>
        <LoadingSpinner className="mx-auto" />
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            {...register("name")}
            disabled={isSubmitting}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="text-sm text-red-600" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            disabled={isSubmitting}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
            disabled={isSubmitting}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && (
            <p className="text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            disabled={isSubmitting}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-3" role="alert">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="font-medium text-blue-800">Note:</p>
        <p className="text-blue-700">
          Registration is currently simulated for demo purposes. 
          In production, this would create a real user account.
        </p>
      </div>
    </>
  )
}
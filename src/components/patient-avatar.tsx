"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface PatientAvatarProps {
  name: string
  imageUrl?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PatientAvatar({ 
  name, 
  imageUrl, 
  size = "md",
  className 
}: PatientAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={imageUrl} alt={name} />
      <AvatarFallback className={`bg-dental-primary text-white ${textSizeClasses[size]}`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
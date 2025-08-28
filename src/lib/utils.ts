import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Core utility for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date for dental reports
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format time for timestamps
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format date and time combined
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate initials from a full name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Format patient ID (e.g., PAT001, PAT002)
export function formatPatientId(id: number): string {
  return `PAT${id.toString().padStart(3, '0')}`
}

// Generate random ID for temporary elements
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase())
}

// Dental-specific status color mapping
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'completed': 'text-green-600 bg-green-50',
    'pending': 'text-yellow-600 bg-yellow-50',
    'cancelled': 'text-red-600 bg-red-50',
    'scheduled': 'text-blue-600 bg-blue-50',
    'in-progress': 'text-purple-600 bg-purple-50',
    'draft': 'text-gray-600 bg-gray-50'
  }
  
  return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-50'
}

// Format medical record number
export function formatMRN(mrn: string | number): string {
  const mrnStr = mrn.toString()
  // Format as XXX-XXX-XXXX for readability
  if (mrnStr.length >= 10) {
    return `${mrnStr.slice(0, 3)}-${mrnStr.slice(3, 6)}-${mrnStr.slice(6)}`
  }
  return mrnStr
}

// Calculate age from birth date
export function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Sleep utility for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

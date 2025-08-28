# Code Style Guide

This document defines the coding standards and best practices for the Dental RAG Web Interface project.

## General Principles

1. **Consistency**: Follow established patterns throughout the codebase
2. **Readability**: Write code that is easy to read and understand
3. **Maintainability**: Structure code to be easily maintained and extended
4. **Performance**: Write efficient code without premature optimization
5. **Type Safety**: Leverage TypeScript for better code reliability

## TypeScript Standards

### Type Definitions

```typescript
// ✅ Use interfaces for object shapes
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// ✅ Use type aliases for unions and primitives
type Status = 'idle' | 'loading' | 'success' | 'error'
type UserId = string

// ✅ Use proper generic constraints
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

// ❌ Avoid any types
const processData = (data: any) => { ... }

// ✅ Use unknown for truly unknown data
const processData = (data: unknown) => {
  if (typeof data === 'string') {
    // TypeScript now knows data is string
    return data.toUpperCase()
  }
}
```

### Function Signatures

```typescript
// ✅ Explicit return types for public APIs
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ Use async/await with proper error handling
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.get(`/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}

// ✅ Use destructuring for cleaner parameter lists
interface CreateUserParams {
  name: string
  email: string
  role?: UserRole
}

const createUser = async ({ name, email, role = 'user' }: CreateUserParams) => {
  // implementation
}
```

## React Component Standards

### Component Structure

```typescript
// ✅ Proper component structure with TypeScript
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
  className?: string
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  className,
}) => {
  // Hooks at the top
  const [isLoading, setIsLoading] = useState(false)
  const { theme } = useTheme()

  // Event handlers
  const handleEdit = useCallback(() => {
    onEdit?.(user)
  }, [onEdit, user])

  const handleDelete = useCallback(async () => {
    setIsLoading(true)
    try {
      await deleteUser(user.id)
      onDelete?.(user.id)
    } finally {
      setIsLoading(false)
    }
  }, [user.id, onDelete])

  // Render
  return (
    <div className={cn('p-4 border rounded-lg', className)}>
      <h3 className="font-semibold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
      
      <div className="mt-4 flex gap-2">
        <Button onClick={handleEdit} variant="outline">
          Edit
        </Button>
        <Button 
          onClick={handleDelete} 
          variant="destructive"
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  )
}
```

### Hooks Usage

```typescript
// ✅ Custom hooks with proper TypeScript
interface UseApiDataReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const useApiData = <T>(url: string): UseApiDataReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get<T>(url)
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

## Styling Standards

### Tailwind CSS Usage

```typescript
// ✅ Use cn utility for conditional classes
import { cn } from '@/lib/utils'

const Button = ({ variant, size, className, ...props }) => {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        
        // Variant styles
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        
        // Size styles
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        },
        
        className
      )}
      {...props}
    />
  )
}

// ❌ Avoid inline styles
<div style={{ marginTop: '20px', color: 'red' }}>

// ✅ Use Tailwind classes
<div className="mt-5 text-red-500">
```

### Component Variants

```typescript
// ✅ Use class-variance-authority for component variants
import { cva, type VariantProps } from 'class-variance-authority'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
)
```

## File Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   ├── globals.css
│   └── layout.tsx
├── components/             # Reusable components
│   ├── ui/                # shadcn/ui base components
│   ├── forms/             # Form-specific components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── api.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── validations.ts
├── types/                 # TypeScript type definitions
│   ├── api.ts
│   ├── auth.ts
│   └── database.ts
└── stores/               # State management
    ├── auth-store.ts
    └── user-store.ts
```

### Naming Conventions

```
// Files and directories
kebab-case/
├── user-profile.tsx
├── api-client.ts
└── form-validation.ts

// Components
const UserProfile = () => { ... }
const APIClient = () => { ... }

// Hooks
const useUserData = () => { ... }
const useAPIClient = () => { ... }

// Types and Interfaces
interface UserProfile { ... }
type APIResponse<T> = { ... }

// Constants
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_ATTEMPTS = 3

// Enums
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
```

## API and Data Handling

### API Client Structure

```typescript
// ✅ Structured API client
class ApiClient {
  private baseURL: string
  private headers: Record<string, string>

  constructor(baseURL: string, headers: Record<string, string> = {}) {
    this.baseURL = baseURL
    this.headers = {
      'Content-Type': 'application/json',
      ...headers,
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async post<T, D>(endpoint: string, data: D): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}
```

### Error Handling

```typescript
// ✅ Consistent error handling
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

// ✅ Use Result pattern for operations that can fail
type Result<T, E = Error> = {
  success: true
  data: T
} | {
  success: false
  error: E
}

const fetchUserSafely = async (id: string): Promise<Result<User>> => {
  try {
    const user = await api.getUser(id)
    return { success: true, data: user }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    }
  }
}
```

## Performance Best Practices

### React Performance

```typescript
// ✅ Memoize expensive computations
const ExpensiveComponent = ({ data }: { data: ComplexData[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item),
    }))
  }, [data])

  return <div>{/* render processedData */}</div>
}

// ✅ Avoid unnecessary re-renders
const UserList = ({ users, onUserSelect }: UserListProps) => {
  const handleUserClick = useCallback((user: User) => {
    onUserSelect(user)
  }, [onUserSelect])

  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onClick={handleUserClick} 
        />
      ))}
    </div>
  )
}

// ✅ Use React.memo for pure components
const UserCard = React.memo<UserCardProps>(({ user, onClick }) => {
  return (
    <div onClick={() => onClick(user)}>
      {user.name}
    </div>
  )
})
```

## Testing Standards

### Component Testing

```typescript
// ✅ Comprehensive component tests
import { render, screen, fireEvent } from '@testing-library/react'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  }

  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />)
    
    fireEvent.click(screen.getByText('Edit'))
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser)
  })

  it('shows loading state during deletion', async () => {
    const mockOnDelete = jest.fn()
    render(<UserCard user={mockUser} onDelete={mockOnDelete} />)
    
    fireEvent.click(screen.getByText('Delete'))
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument()
  })
})
```

## Documentation Standards

### Code Comments

```typescript
/**
 * Calculates the total price of items in a cart including taxes and discounts.
 * 
 * @param items - Array of cart items
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code to apply
 * @returns The total price including taxes and discounts
 * 
 * @example
 * ```typescript
 * const total = calculateCartTotal(
 *   [{ price: 100, quantity: 2 }],
 *   0.08,
 *   'SAVE10'
 * )
 * // Returns: 194.4 (200 base + 16 tax - 21.6 discount)
 * ```
 */
const calculateCartTotal = (
  items: CartItem[],
  taxRate: number,
  discountCode?: string
): number => {
  // Implementation with clear inline comments
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Apply discount before tax calculation
  const discountAmount = discountCode ? calculateDiscount(subtotal, discountCode) : 0
  const discountedTotal = subtotal - discountAmount
  
  // Calculate tax on discounted amount
  const tax = discountedTotal * taxRate
  
  return discountedTotal + tax
}
```

This style guide ensures consistency across the codebase and helps maintain high code quality.
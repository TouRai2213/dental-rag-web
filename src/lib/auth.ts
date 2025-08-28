import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"

// Define the user type
interface User {
  id: string
  email: string
  name: string
  role?: string
}

declare module "next-auth" {
  interface Session {
    user: User & {
      role?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}

// Temporary mock user database - replace with real database in production
const mockUsers = [
  {
    id: "1",
    email: "admin@dental-rag.com",
    password: "admin123", // In production, this should be hashed
    name: "Admin User",
    role: "admin"
  },
  {
    id: "2", 
    email: "doctor@dental-rag.com",
    password: "doctor123", // In production, this should be hashed
    name: "Dr. Smith",
    role: "doctor"
  }
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "Enter your email"
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "Enter your password"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user in mock database
        const user = mockUsers.find(
          u => u.email === credentials.email && u.password === credentials.password
        )

        if (!user) {
          return null
        }

        // Return user object (password excluded)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token when user signs in
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Add role to session from JWT token
      if (token.role) {
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
})
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  // Define protected routes
  const protectedRoutes = ['/documents', '/admin']
  const adminRoutes = ['/admin']
  
  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )
  
  // Check if current route requires admin access
  const isAdminRoute = adminRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )
  
  // Redirect to login if not authenticated and trying to access protected route
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect to login if trying to access admin route without admin role
  if (isAdminRoute && isLoggedIn && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', nextUrl.origin))
  }
  
  // Redirect authenticated users away from auth pages
  if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', nextUrl.origin))
  }
  
  return NextResponse.next()
})

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.[^/]*$).*)'
  ]
}
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // If user is signed in and the current path is /login, redirect to appropriate dashboard
      if (req.nextUrl.pathname === '/login') {
        const role = session.user.user_metadata.role
        const redirectUrl = role === 'ADMIN' ? '/admin' : '/staff/reservation'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }

      // User is authenticated, allow access
      return res
    }

    // If user is not signed in and the current path is protected, redirect to /login
    if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/staff')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return res
  } catch (error) {
    console.error('❌ Middleware - Error:', error)
    return res
  }
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/staff/:path*'
  ]
} 
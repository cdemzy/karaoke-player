import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('karaoke_auth')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthApi = request.nextUrl.pathname === '/api/auth';

  if (isAuthApi) return NextResponse.next();

  if (auth === process.env.APP_PASSWORD) {
    if (isLoginPage) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (isLoginPage) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

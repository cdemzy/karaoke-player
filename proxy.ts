import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const auth = request.cookies.get('karaoke_auth')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isJoinPage = request.nextUrl.pathname === '/join';
  const isAuthApi = request.nextUrl.pathname === '/api/auth';
  const isSessionPage = request.nextUrl.pathname.startsWith('/session/');
  const isSessionRead = request.method === 'GET' && request.nextUrl.pathname.startsWith('/api/session/');
  const isGuestQueueMutation = ['POST', 'DELETE'].includes(request.method)
    && request.nextUrl.pathname.startsWith('/api/session/')
    && request.nextUrl.pathname.endsWith('/queue');
  const isGuestPlaybackMutation = request.method === 'POST'
    && request.nextUrl.pathname.startsWith('/api/session/')
    && request.nextUrl.pathname.endsWith('/now-playing');
  const isSearchApi = request.nextUrl.pathname === '/api/search';
  const isRealtimeApi = request.nextUrl.pathname === '/api/realtime';

  if (isAuthApi || isJoinPage || isSessionPage || isSessionRead || isGuestQueueMutation || isGuestPlaybackMutation || isSearchApi || isRealtimeApi) return NextResponse.next();

  if (process.env.APP_PASSWORD && auth === process.env.APP_PASSWORD) {
    if (isLoginPage) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (isLoginPage) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

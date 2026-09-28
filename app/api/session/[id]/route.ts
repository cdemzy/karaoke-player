import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isSessionId, parseSession, sessionKey } from '@/lib/session'

export const dynamic = 'force-dynamic'

interface RouteContext {
	params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
	const { id } = await params
	if (!isSessionId(id)) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

	const sessionValue = await redis.get<unknown>(sessionKey(id))
	if (!sessionValue) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

	const session = parseSession(sessionValue)
	return NextResponse.json(
		{ nowPlaying: session.nowPlaying, queue: session.queue },
		{ headers: { 'Cache-Control': 'no-store, max-age=0' } },
	)
}

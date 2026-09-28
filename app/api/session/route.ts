import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { SESSION_TTL_SECONDS, sessionKey, type SessionData } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST() {
	const sessionId = crypto.randomUUID()
	const session: SessionData = {
		createdAt: Date.now(),
		nowPlaying: null,
		queue: [],
	}

	await redis.set(sessionKey(sessionId), JSON.stringify(session), { ex: SESSION_TTL_SECONDS })
	return NextResponse.json({ sessionId }, { status: 201 })
}

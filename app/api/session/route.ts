import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { createJoinCode, SESSION_TTL_SECONDS, sessionKey, type SessionData } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST() {
	const session: SessionData = {
		createdAt: Date.now(),
		nowPlaying: null,
		queue: [],
	}

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const sessionId = createJoinCode()
		const wasCreated = await redis.set(sessionKey(sessionId), JSON.stringify(session), {
			ex: SESSION_TTL_SECONDS,
			nx: true,
		})
		if (wasCreated) return NextResponse.json({ sessionId }, { status: 201 })
	}

	return NextResponse.json({ error: 'session_creation_failed' }, { status: 503 })
}

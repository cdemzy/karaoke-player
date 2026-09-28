import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { realtime } from '@/lib/realtime'
import { isRequesterName, isSessionId, isVideo, parseSession, SESSION_TTL_SECONDS, sessionChannel, sessionKey } from '@/lib/session'

export const dynamic = 'force-dynamic'

interface RouteContext {
	params: Promise<{ id: string }>
}

const setNowPlayingScript = `
local sessionJson = redis.call('GET', KEYS[1])
if not sessionJson then return nil end
local session = cjson.decode(sessionJson)
if ARGV[1] == '' then
  session.nowPlaying = table.remove(session.queue, 1)
else
  session.nowPlaying = { id = ARGV[2], video = cjson.decode(ARGV[1]), requestedBy = ARGV[3] }
end
redis.call('SET', KEYS[1], cjson.encode(session), 'EX', ARGV[4])
return cjson.encode(session)
`

export async function POST(request: Request, { params }: RouteContext) {
	const { id } = await params
	if (!isSessionId(id)) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

	const body = await request.json().catch(() => null) as { video?: unknown; requestedBy?: unknown } | null
	const requesterName = isRequesterName(body?.requestedBy) ? body.requestedBy.trim() : ''
	if (body?.video !== undefined && !isVideo(body.video)) return NextResponse.json({ error: 'invalid_video' }, { status: 400 })
	if (body?.video !== undefined && !requesterName) return NextResponse.json({ error: 'invalid_requester_name' }, { status: 400 })

	const sessionValue = await redis.eval<[string, string, string, string], unknown>(
		setNowPlayingScript,
		[sessionKey(id)],
		[body?.video ? JSON.stringify(body.video) : '', crypto.randomUUID(), requesterName, String(SESSION_TTL_SECONDS)],
	)
	if (!sessionValue) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

	const session = parseSession(sessionValue)
	await realtime.channel(sessionChannel(id)).emit('session.updated', {
		session: {
			nowPlaying: session.nowPlaying,
			queue: session.queue,
		},
	})
	return NextResponse.json({ nowPlaying: session.nowPlaying, queue: session.queue }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

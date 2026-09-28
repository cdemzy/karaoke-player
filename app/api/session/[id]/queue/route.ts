import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { realtime } from '@/lib/realtime'
import { isRequesterName, isSessionId, isVideo, parseSession, SESSION_TTL_SECONDS, sessionChannel, sessionKey } from '@/lib/session'

export const dynamic = 'force-dynamic'

interface RouteContext {
	params: Promise<{ id: string }>
}

const addToQueueScript = `
local sessionJson = redis.call('GET', KEYS[1])
if not sessionJson then return nil end
local session = cjson.decode(sessionJson)
local video = cjson.decode(ARGV[1])
table.insert(session.queue, { id = ARGV[2], video = video, requestedBy = ARGV[3] })
redis.call('SET', KEYS[1], cjson.encode(session), 'EX', ARGV[4])
return cjson.encode(session)
`

const removeFromQueueScript = `
local sessionJson = redis.call('GET', KEYS[1])
if not sessionJson then return nil end
local session = cjson.decode(sessionJson)
local nextQueue = {}
for _, item in ipairs(session.queue) do
  if item.id ~= ARGV[1] then table.insert(nextQueue, item) end
end
session.queue = nextQueue
redis.call('SET', KEYS[1], cjson.encode(session), 'EX', ARGV[2])
return cjson.encode(session)
`

async function sessionResponse(sessionId: string, sessionValue: unknown) {
	if (!sessionValue) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
	const session = parseSession(sessionValue)
	await realtime.channel(sessionChannel(sessionId)).emit('session.updated', {
		session: {
			nowPlaying: session.nowPlaying,
			queue: session.queue,
		},
	})
	return NextResponse.json({ nowPlaying: session.nowPlaying, queue: session.queue }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

export async function POST(request: Request, { params }: RouteContext) {
	const { id } = await params
	if (!isSessionId(id)) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

	const body = await request.json().catch(() => null) as { video?: unknown; requestedBy?: unknown } | null
	if (!isVideo(body?.video)) return NextResponse.json({ error: 'invalid_video' }, { status: 400 })
	if (!isRequesterName(body?.requestedBy)) return NextResponse.json({ error: 'invalid_requester_name' }, { status: 400 })

	const sessionValue = await redis.eval<[string, string, string, string], unknown>(
		addToQueueScript,
		[sessionKey(id)],
		[JSON.stringify(body.video), crypto.randomUUID(), body.requestedBy.trim(), String(SESSION_TTL_SECONDS)],
	)
	return sessionResponse(id, sessionValue)
}

export async function DELETE(request: Request, { params }: RouteContext) {
	const { id } = await params
	if (!isSessionId(id)) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

	const body = await request.json().catch(() => null) as { queueItemId?: unknown } | null
	if (typeof body?.queueItemId !== 'string' || !body.queueItemId) return NextResponse.json({ error: 'invalid_queue_item' }, { status: 400 })

	const sessionValue = await redis.eval<[string, string], unknown>(
		removeFromQueueScript,
		[sessionKey(id)],
		[body.queueItemId, String(SESSION_TTL_SECONDS)],
	)
	return sessionResponse(id, sessionValue)
}

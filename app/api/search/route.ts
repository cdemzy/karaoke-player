import { NextResponse } from 'next/server';

type VideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
};

const NAMED_HTML_ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&apos;': "'",
	'&gt;': '>',
	'&lt;': '<',
	'&quot;': '"',
}

function decodeHtmlEntities(value: string): string {
	return value.replace(/&(?:#(x[\da-f]+|\d+)|amp|apos|gt|lt|quot);/gi, (entity, numericValue) => {
		if (!numericValue) return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? entity

		const codePoint = Number.parseInt(numericValue, numericValue[0].toLowerCase() === 'x' ? 16 : 10)
		const isUnicodeScalar = codePoint >= 0 && codePoint <= 0x10FFFF && (codePoint < 0xD800 || codePoint > 0xDFFF)
		return isUnicodeScalar ? String.fromCodePoint(codePoint) : entity
	})
}

function getApiKeys(): string[] {
  return [
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY_2,
    process.env.YOUTUBE_API_KEY_3,
    process.env.YOUTUBE_API_KEY_4,
  ].filter(Boolean) as string[];
}

function isQuotaExceeded(data: { error?: { errors?: { reason: string }[] } }): boolean {
  return data.error?.errors?.some(e => e.reason === 'quotaExceeded') ?? false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const keys = getApiKeys();

  if (!q || keys.length === 0) return NextResponse.json({ items: [] });

  for (const key of keys) {
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${q} karaoke`,
      type: 'video',
      maxResults: '12',
      key,
    });

    const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const searchData = await searchRes.json();

    if (isQuotaExceeded(searchData)) continue;

    const items: VideoItem[] = searchData.items ?? [];
    if (items.length === 0) return NextResponse.json({ items: [] });

    const ids = items.map(item => item.id.videoId).join(',');
    const statusRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${ids}&key=${key}`);
    const statusData = await statusRes.json();

    if (isQuotaExceeded(statusData)) continue;

    const embeddableIds = new Set(
      (statusData.items ?? [])
        .filter((v: { status: { embeddable: boolean } }) => v.status.embeddable)
        .map((v: { id: string }) => v.id)
    );

    const videos = items
      .filter(item => embeddableIds.has(item.id.videoId))
      .slice(0, 6)
      .map(item => ({
        id: item.id.videoId,
        title: decodeHtmlEntities(item.snippet.title),
        channel: decodeHtmlEntities(item.snippet.channelTitle),
        thumbnail: item.snippet.thumbnails.medium.url,
      }));

    return NextResponse.json({ items: videos });
  }

  return NextResponse.json({ items: [], error: 'quota_exceeded' });
}

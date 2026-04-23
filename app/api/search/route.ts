import { NextResponse } from 'next/server';

type VideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
};

function getApiKeys(): string[] {
  return [
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY_2,
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
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
      }));

    return NextResponse.json({ items: videos });
  }

  return NextResponse.json({ items: [], error: 'quota_exceeded' });
}

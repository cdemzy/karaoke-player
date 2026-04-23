import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!q || !apiKey) return NextResponse.json({ items: [] });

  const searchParams2 = new URLSearchParams({
    part: 'snippet',
    q: `${q} karaoke`,
    type: 'video',
    maxResults: '12',
    key: apiKey,
  });

  const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams2}`);
  const searchData = await searchRes.json();
  const items: { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: { medium: { url: string } } } }[] = searchData.items ?? [];

  const ids = items.map(item => item.id.videoId).join(',');
  const statusRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${ids}&key=${apiKey}`);
  const statusData = await statusRes.json();
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

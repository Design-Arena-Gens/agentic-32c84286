import { NextResponse } from 'next/server';
import { getDuePosts, getVideo, updateStatus } from '@/lib/db';
import { publishVideoToInstagram } from '@/lib/instagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const now = new Date();
  const duePosts = await getDuePosts(now);
  const results: Array<{ id: string; status: 'sent' | 'failed'; error?: string }> = [];

  for (const post of duePosts) {
    try {
      const video = await getVideo(post.id);
      if (!video) {
        await updateStatus({ id: post.id, status: 'failed', error: 'Video missing' });
        results.push({ id: post.id, status: 'failed', error: 'Video missing' });
        continue;
      }

      await publishVideoToInstagram({ caption: post.caption, video });
      await updateStatus({ id: post.id, status: 'sent', error: null });
      results.push({ id: post.id, status: 'sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await updateStatus({ id: post.id, status: 'failed', error: message });
      results.push({ id: post.id, status: 'failed', error: message });
    }
  }

  return NextResponse.json({ processedAt: now.toISOString(), results });
}

import { NextResponse } from 'next/server';
import { getScheduledPostById, getVideo, updateStatus } from '@/lib/db';
import { publishVideoToInstagram } from '@/lib/instagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await updateStatus({ id: params.id, status: 'processing' });
    const [record, video] = await Promise.all([
      getScheduledPostById(params.id),
      getVideo(params.id)
    ]);

    if (!record || !video) {
      await updateStatus({ id: params.id, status: 'failed', error: 'Video not found' });
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const caption = typeof body.caption === 'string' && body.caption.length > 0 ? body.caption : record.caption;

    await publishVideoToInstagram({
      caption,
      video
    });

    await updateStatus({ id: params.id, status: 'sent', error: null });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    await updateStatus({
      id: params.id,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to publish video' },
      { status: 500 }
    );
  }
}

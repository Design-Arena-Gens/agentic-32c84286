import { NextResponse } from 'next/server';
import { z } from 'zod';
import { insertScheduledPost, listScheduledPosts } from '@/lib/db';

const scheduleSchema = z.object({
  title: z.string().min(3),
  caption: z.string().min(1),
  publishAt: z.string().datetime()
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await listScheduledPosts();
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = scheduleSchema.parse({
      title: formData.get('title'),
      caption: formData.get('caption'),
      publishAt: formData.get('publishAt')
    });

    const file = formData.get('video');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Video content is empty' },
        { status: 400 }
      );
    }

    const scheduled = await insertScheduledPost({
      title: payload.title,
      caption: payload.caption,
      publishAt: new Date(payload.publishAt),
      video: buffer
    });

    return NextResponse.json({ data: scheduled }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

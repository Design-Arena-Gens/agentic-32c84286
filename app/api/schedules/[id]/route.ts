import { NextResponse } from 'next/server';
import { deleteScheduledPost } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await deleteScheduledPost(params.id);
  return NextResponse.json({ success: true });
}

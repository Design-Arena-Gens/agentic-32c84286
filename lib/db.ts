import { sql } from '@vercel/postgres';

export type ScheduledPost = {
  id: string;
  title: string;
  caption: string;
  publish_at: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  last_error: string | null;
  created_at: string;
};

let initialized = false;

export async function initDb() {
  if (initialized) return;
  await sql`
    create extension if not exists pgcrypto;

    create table if not exists video_queue (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      caption text not null,
      publish_at timestamptz not null,
      status text not null default 'pending',
      video bytea not null,
      last_error text,
      created_at timestamptz not null default now()
    );

    create index if not exists video_queue_publish_at_idx on video_queue (publish_at);
    create index if not exists video_queue_status_idx on video_queue (status);
  `;
  initialized = true;
}

export async function insertScheduledPost(params: {
  title: string;
  caption: string;
  publishAt: Date;
  video: Buffer;
}) {
  await initDb();
  const { title, caption, publishAt, video } = params;
  const videoHex = `\\x${video.toString('hex')}`;
  const result = await sql<ScheduledPost>`
    insert into video_queue (title, caption, publish_at, video)
    values (${title}, ${caption}, ${publishAt.toISOString()}, ${videoHex})
    returning id, title, caption, publish_at, status, last_error, created_at
  `;
  return result.rows[0];
}

export async function listScheduledPosts() {
  await initDb();
  const result = await sql<ScheduledPost>`
    select id, title, caption, publish_at, status, last_error, created_at
    from video_queue
    order by publish_at asc
  `;
  return result.rows;
}

export async function getDuePosts(now: Date) {
  await initDb();
  const result = await sql<ScheduledPost>`
    with due as (
      select id
      from video_queue
      where status = 'pending' and publish_at <= ${now.toISOString()}
      for update skip locked
    )
    update video_queue as v
    set status = 'processing'
    from due
    where v.id = due.id
    returning v.id, v.title, v.caption, v.publish_at, v.status, v.last_error, v.created_at
  `;
  return result.rows;
}

export async function getVideo(id: string) {
  await initDb();
  const result = await sql<{ video: Buffer | string }>`
    select video
    from video_queue
    where id = ${id}
    limit 1
  `;
  if (!result.rowCount) {
    return null;
  }
  const payload = result.rows[0].video;
  if (payload instanceof Buffer) {
    return payload;
  }
  if (typeof payload === 'string') {
    const trimmed = payload.startsWith('\\x') ? payload.slice(2) : payload;
    return Buffer.from(trimmed, 'hex');
  }
  return null;
}

export async function getScheduledPostById(id: string) {
  await initDb();
  const result = await sql<ScheduledPost>`
    select id, title, caption, publish_at, status, last_error, created_at
    from video_queue
    where id = ${id}
    limit 1
  `;
  return result.rows[0] ?? null;
}

export async function updateStatus(params: {
  id: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string | null;
}) {
  await initDb();
  const { id, status, error = null } = params;
  await sql`
    update video_queue
    set status = ${status}, last_error = ${error}
    where id = ${id}
  `;
}

export async function deleteScheduledPost(id: string) {
  await initDb();
  await sql`
    delete from video_queue where id = ${id}
  `;
}

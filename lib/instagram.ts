import axios from 'axios';
import FormData from 'form-data';
import { Blob } from 'buffer';

const GRAPH_API = 'https://graph.facebook.com/v18.0';
const MAX_STATUS_POLLS = 30;
const POLL_DELAY_MS = 4000;

export class InstagramConfigError extends Error {}
export class InstagramPublishError extends Error {}

export async function publishVideoToInstagram(params: {
  caption: string;
  video: Buffer;
}) {
  const { caption, video } = params;
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!userId || !token) {
    throw new InstagramConfigError('Missing instagram credentials');
  }

  const start = await axios.post(
    `${GRAPH_API}/${userId}/media`,
    new URLSearchParams({
      upload_phase: 'start',
      media_type: 'VIDEO',
      access_token: token,
      file_size: video.length.toString()
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  const sessionId = start.data.upload_session_id as string;
  const videoId = start.data.video_id as string;
  let startOffset = Number(start.data.start_offset ?? 0);
  let endOffset = Number(start.data.end_offset ?? video.length);

  while (startOffset < video.length) {
    const boundedEnd = Math.min(endOffset, video.length);
    if (boundedEnd <= startOffset) {
      break;
    }

    const chunk = video.subarray(startOffset, boundedEnd);
    const form = new FormData();
    form.append('upload_phase', 'transfer');
    form.append('access_token', token);
    form.append('upload_session_id', sessionId);
    form.append('start_offset', String(startOffset));
    form.append('video_file_chunk', new Blob([chunk]));

    const transfer = await axios.post(`${GRAPH_API}/${userId}/media`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    startOffset = Number(transfer.data.start_offset ?? video.length);
    endOffset = Number(transfer.data.end_offset ?? video.length);
  }

  const finishForm = new URLSearchParams({
    upload_phase: 'finish',
    access_token: token,
    upload_session_id: sessionId,
    caption
  });

  await axios.post(`${GRAPH_API}/${userId}/media`, finishForm, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  let status = 'IN_PROGRESS';
  let attempts = 0;

  while (status === 'IN_PROGRESS' && attempts < MAX_STATUS_POLLS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
    attempts += 1;

    const statusRes = await axios.get(
      `${GRAPH_API}/${videoId}`,
      {
        params: {
          fields: 'status_code',
          access_token: token
        }
      }
    );

    status = statusRes.data.status_code as string;
  }

  if (status !== 'FINISHED') {
    throw new InstagramPublishError(`Video processing failed with status ${status}`);
  }

  await axios.post(
    `${GRAPH_API}/${userId}/media_publish`,
    new URLSearchParams({
      creation_id: videoId,
      access_token: token
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
}

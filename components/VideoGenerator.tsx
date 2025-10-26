'use client';

import { useState, useRef } from 'react';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import toast from 'react-hot-toast';
import { Slide } from '@/store/useVideoBuilder';

const RESOLUTION = { width: 1080, height: 1920 };

type GeneratedVideo = {
  file: File;
  url: string;
  size: number;
};

type Props = {
  slides: Slide[];
  title: string;
  onVideoReady: (video: GeneratedVideo | null) => void;
};

export function VideoGenerator({ slides, title, onVideoReady }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState<number>(0);

  const loadFfmpeg = async () => {
    if (!ffmpegRef.current) {
      const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({
        log: false,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js'
      });
      ffmpeg.setProgress(({ ratio }) => setProgress(Math.round(ratio * 100)));
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
    }
    return ffmpegRef.current;
  };

  const renderSlideToPng = async (slide: Slide, index: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = RESOLUTION.width;
    canvas.height = RESOLUTION.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get canvas context');
    }

    ctx.fillStyle = slide.background ?? '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 90px "Inter"';
    ctx.textAlign = 'center';
    wrapText(ctx, slide.headline, canvas.width / 2, canvas.height * 0.25, canvas.width * 0.8, 100);

    ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
    ctx.font = '500 48px "Inter"';
    wrapText(ctx, slide.body, canvas.width / 2, canvas.height * 0.5, canvas.width * 0.85, 70);

    ctx.fillStyle = 'rgba(94, 234, 212, 0.85)';
    ctx.font = '600 42px "Inter"';
    ctx.fillText('@yourhandle', canvas.width / 2, canvas.height * 0.9);

    const dataUrl = canvas.toDataURL('image/png');
    const binary = atob(dataUrl.split(',')[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i);
    }

    return { filename: `slide-${index}.png`, data: array };
  };

  const generate = async () => {
    try {
      if (!slides.length) {
        toast.error('Add at least one slide');
        return;
      }

      setIsGenerating(true);
      setProgress(0);

      const ffmpeg = await loadFfmpeg();
      try {
        ffmpeg.FS('unlink', 'output.mp4');
      } catch (error) {
        // ignore missing
      }

      const renderedSlides = await Promise.all(slides.map(renderSlideToPng));
      renderedSlides.forEach(({ filename, data }) => {
        try {
          ffmpeg.FS('unlink', filename);
        } catch (e) {
          // ignore
        }
        ffmpeg.FS('writeFile', filename, data);
      });

      const concatLines: string[] = [];
      slides.forEach((slide, index) => {
        const name = `slide-${index}.png`;
        concatLines.push(`file '${name}'`);
        concatLines.push(`duration ${Math.max(slide.duration, 1)}`);
        if (index === slides.length - 1) {
          concatLines.push(`file '${name}'`);
        }
      });
      const concatFile = concatLines.join('\n');
      ffmpeg.FS('writeFile', 'concat.txt', new TextEncoder().encode(concatFile));

      await ffmpeg.run(
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'concat.txt',
        '-vsync',
        'vfr',
        '-pix_fmt',
        'yuv420p',
        'output.mp4'
      );

      const data = ffmpeg.FS('readFile', 'output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const file = new File([blob], `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp4`, {
        type: 'video/mp4'
      });
      const url = URL.createObjectURL(blob);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(url);
      setVideoSize(blob.size);
      onVideoReady({ file, url, size: blob.size });
      toast.success('Video generated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate video');
      onVideoReady(null);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const clearVideo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setVideoSize(0);
    onVideoReady(null);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Video Automation</h2>
          <p className="text-sm text-slate-400">Render slides into a vertical video ready for Instagram Reels.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={isGenerating}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900"
          >
            {isGenerating ? `Rendering ${progress}%` : 'Generate Video'}
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={clearVideo}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-red-500 hover:text-red-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      {previewUrl ? (
        <div className="mt-6 grid gap-4 md:grid-cols-[360px_1fr]">
          <video
            controls
            className="mx-auto h-[480px] w-[270px] rounded-2xl border border-slate-800 object-cover"
            src={previewUrl}
          />
          <div className="space-y-3">
            <p className="text-sm text-slate-300">Size: {(videoSize / (1024 * 1024)).toFixed(2)} MB</p>
            <a
              href={previewUrl}
              download
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              Download MP4
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-slate-500">
          <p className="text-sm">Generate to preview the automation.</p>
        </div>
      )}
    </section>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n += 1) {
    const testLine = `${line}${words[n]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = `${words[n]} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

'use client';

import { SlideCard } from '@/components/SlideCard';
import { VideoGenerator } from '@/components/VideoGenerator';
import { ScheduleForm } from '@/components/ScheduleForm';
import { ScheduleList } from '@/components/ScheduleList';
import { useVideoBuilder } from '@/store/useVideoBuilder';
import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Home() {
  const { title, slides, setTitle, addSlide, reset } = useVideoBuilder();
  const [video, setVideo] = useState<{ file: File; url: string; size: number } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const defaultCaption = useMemo(() => {
    const headlines = slides.map((slide) => slide.headline).join(' | ');
    return `${title}\n\n${headlines}`.slice(0, 2200);
  }, [slides, title]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
          <span>Instagram Automation</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Automate Reels from Slide Flows</h1>
        <p className="max-w-3xl text-lg text-slate-300">
          Design a stack of branded slides, render them into vertical videos, and automatically publish to your Instagram account at just the right time.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-1">Auto video rendering</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Instagram Graph API publishing</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Schedule & queue management</span>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Creative Flow</h2>
            <p className="text-sm text-slate-400">Craft your scenes. We will animate and stitch them into a reel.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              <PlusIcon className="h-4 w-4" /> Add Slide
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setVideo(null);
                toast.success('Workflow reset');
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:border-red-500 hover:text-red-400"
            >
              Reset Flow
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-5">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Automation Title
            <input
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-lg font-semibold text-slate-100 outline-none focus:border-emerald-400"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            {slides.map((slide) => (
              <SlideCard key={slide.id} slide={slide} />
            ))}
          </div>
        </div>
      </section>

      <VideoGenerator
        slides={slides}
        title={title}
        onVideoReady={(generated) => {
          setVideo(generated ? { file: generated.file, url: generated.url, size: generated.size } : null);
        }}
      />

      <ScheduleForm
        videoFile={video?.file ?? null}
        defaultTitle={title}
        defaultCaption={defaultCaption}
        onScheduled={() => {
          setRefreshToken((token) => token + 1);
        }}
      />

      <ScheduleList refreshToken={refreshToken} />
    </div>
  );
}

'use client';

import { useVideoBuilder, type Slide } from '@/store/useVideoBuilder';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';

export function SlideCard({ slide }: { slide: Slide }) {
  const updateSlide = useVideoBuilder((state) => state.updateSlide);
  const removeSlide = useVideoBuilder((state) => state.removeSlide);

  const handleChange = useCallback(
    (field: keyof Slide) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value =
          field === 'duration'
            ? Number(event.target.value)
            : (event.target.value as Slide[typeof field]);
        updateSlide(slide.id, { [field]: value } as Partial<Slide>);
      },
    [slide.id, updateSlide]
  );

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between gap-4">
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-lg font-semibold text-slate-100 outline-none focus:border-emerald-400"
          value={slide.headline}
          onChange={handleChange('headline')}
        />
        <button
          onClick={() => removeSlide(slide.id)}
          className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:border-red-500 hover:text-red-500"
          type="button"
          aria-label="Remove slide"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
      <textarea
        className="mt-3 w-full min-h-[120px] rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400"
        value={slide.body}
        onChange={handleChange('body')}
      />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="flex flex-col text-xs uppercase tracking-wide text-slate-400">
          Background
          <input
            type="color"
            className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950/80"
            value={slide.background}
            onChange={handleChange('background')}
          />
        </label>
        <label className="flex flex-col text-xs uppercase tracking-wide text-slate-400">
          Duration (s)
          <input
            type="number"
            min={1}
            max={15}
            value={slide.duration}
            onChange={handleChange('duration')}
            className="mt-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
          />
        </label>
      </div>
    </div>
  );
}

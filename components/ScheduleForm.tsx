'use client';

import { useForm } from 'react-hook-form';
import { addMinutes, formatISO } from 'date-fns';
import toast from 'react-hot-toast';

export type ScheduleFormValues = {
  title: string;
  caption: string;
  publishAt: string;
};

type Props = {
  videoFile: File | null;
  defaultTitle: string;
  defaultCaption: string;
  onScheduled: () => void;
};

export function ScheduleForm({ videoFile, defaultTitle, defaultCaption, onScheduled }: Props) {
  const nowPlusFifteen = formatISO(addMinutes(new Date(), 15), { representation: 'complete' }).slice(0, 16);
  const { register, handleSubmit, reset, watch } = useForm<ScheduleFormValues>({
    defaultValues: {
      title: defaultTitle,
      caption: defaultCaption,
      publishAt: nowPlusFifteen
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!videoFile) {
      toast.error('Generate a video before scheduling');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('caption', values.caption);
      const publishDate = new Date(`${values.publishAt}`);
      if (Number.isNaN(publishDate.getTime())) {
        throw new Error('Invalid publish date');
      }
      formData.append('publishAt', publishDate.toISOString());
      formData.append('video', videoFile);

      const response = await fetch('/api/schedules', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to schedule');
      }

      toast.success('Video scheduled');
      onScheduled();
      reset({
        title: values.title,
        caption: values.caption,
        publishAt: values.publishAt
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule');
    }
  });

  const publishAtValue = watch('publishAt');

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/40">
      <h2 className="text-2xl font-semibold">Schedule Instagram Post</h2>
      <p className="mt-1 text-sm text-slate-400">We will upload the generated video and publish it at the scheduled time.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Title
          <input
            className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400"
            {...register('title', { required: true })}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Publish At
          <input
            type="datetime-local"
            min={nowPlusFifteen}
            className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400"
            {...register('publishAt', { required: true })}
          />
        </label>
        <label className="col-span-full flex flex-col gap-2 text-sm text-slate-300">
          Caption
          <textarea
            rows={5}
            className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400"
            {...register('caption', { required: true })}
          />
        </label>
        <div className="col-span-full flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
          <span>{videoFile ? `Ready to upload (${(videoFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Video not generated yet'}</span>
          <button
            type="submit"
            disabled={!videoFile}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Schedule Upload
          </button>
        </div>
        <p className="col-span-full text-xs text-slate-500">Local time selected: {publishAtValue}</p>
      </form>
    </section>
  );
}

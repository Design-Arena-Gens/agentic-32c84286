'use client';

import useSWR from 'swr';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useState } from 'react';

const fetcher = async (input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error('Failed to load schedules');
  }
  return response.json();
};

type ScheduleItem = {
  id: string;
  title: string;
  caption: string;
  publish_at: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  last_error: string | null;
};

type Props = {
  refreshToken: number;
};

export function ScheduleList({ refreshToken }: Props) {
  const { data, mutate, isLoading } = useSWR<{ data: ScheduleItem[] }>(
    ['/api/schedules', refreshToken],
    ([url]) => fetcher(url)
  );
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handlePublishNow = async (id: string) => {
    try {
      setIsProcessing(id);
      const response = await fetch(`/api/schedules/${id}/publish`, {
        method: 'POST'
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to publish');
      }
      toast.success('Published to Instagram');
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this scheduled upload?')) return;
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }
      toast.success('Schedule removed');
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Automation Queue</h2>
        <button
          type="button"
          onClick={() => mutate()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
        >
          Refresh
        </button>
      </div>
      {isLoading && <p className="mt-4 text-sm text-slate-400">Loading schedules…</p>}
      <div className="mt-6 space-y-4">
        {data?.data?.length ? (
          data.data.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.caption.slice(0, 120)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handlePublishNow(item.id)}
                    disabled={item.status === 'sent' || isProcessing === item.id}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {isProcessing === item.id ? 'Publishing…' : 'Publish Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-red-500 hover:text-red-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>Scheduled: {format(new Date(item.publish_at), 'MMM d, yyyy HH:mm')}</span>
                <span
                  className={
                    item.status === 'sent'
                      ? 'text-emerald-400'
                      : item.status === 'failed'
                      ? 'text-red-400'
                      : item.status === 'processing'
                      ? 'text-amber-300'
                      : 'text-sky-300'
                  }
                >
                  Status: {item.status}
                </span>
                {item.last_error && <span className="text-red-400">Error: {item.last_error}</span>}
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">No scheduled videos yet.</p>
        )}
      </div>
    </section>
  );
}

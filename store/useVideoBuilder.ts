import { create } from 'zustand';
import { nanoid } from 'nanoid';

type Slide = {
  id: string;
  headline: string;
  body: string;
  background: string;
  duration: number;
};

type VideoBuilderState = {
  title: string;
  slides: Slide[];
  setTitle: (title: string) => void;
  addSlide: () => void;
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  removeSlide: (id: string) => void;
  reset: () => void;
};

const defaultSlide = (): Slide => ({
  id: nanoid(),
  headline: 'New Slide',
  body: 'Add your message here',
  background: '#111827',
  duration: 4
});

export const useVideoBuilder = create<VideoBuilderState>((set) => ({
  title: 'Untitled Automation',
  slides: [defaultSlide()],
  setTitle: (title) => set({ title }),
  addSlide: () => set((state) => ({ slides: [...state.slides, defaultSlide()] })),
  updateSlide: (id, patch) =>
    set((state) => ({
      slides: state.slides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))
    })),
  removeSlide: (id) =>
    set((state) => ({
      slides: state.slides.length > 1 ? state.slides.filter((slide) => slide.id !== id) : state.slides
    })),
  reset: () => set({ title: 'Untitled Automation', slides: [defaultSlide()] })
}));

export type { Slide };

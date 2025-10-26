declare module '@ffmpeg/ffmpeg' {
  export interface FFmpegProgress {
    ratio: number;
  }

  export interface FFmpeg {
    load: () => Promise<void>;
    run: (...args: string[]) => Promise<void>;
    FS: (method: string, ...args: any[]) => any;
    setProgress: (handler: (progress: FFmpegProgress) => void) => void;
  }

  export interface CreateFFmpegConfig {
    log?: boolean;
    corePath?: string;
  }

  export function createFFmpeg(config?: CreateFFmpegConfig): FFmpeg;
}

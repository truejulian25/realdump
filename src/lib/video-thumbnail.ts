"use client";

import { useEffect, useState } from "react";

interface ThumbSource {
  mux_playback_id: string | null;
  thumbnail_url: string | null;
  video_url?: string | null;
}

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

let active = 0;
const MAX_CONCURRENT = 4;
const queue: Array<() => void> = [];

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const next = queue.shift();
    if (next) next();
  }
}

function runWithConcurrency<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active += 1;
      task().then(
        (value) => {
          active -= 1;
          resolve(value);
          pump();
        },
        (error) => {
          active -= 1;
          reject(error);
          pump();
        }
      );
    };
    if (active < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

function captureFrame(url: string): Promise<string | null> {
  if (cache.has(url)) return Promise.resolve(cache.get(url) as string);
  const existing = pending.get(url);
  if (existing) return existing;

  const promise = runWithConcurrency<string | null>(
    () =>
      new Promise<string | null>((resolve) => {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = url;

        let settled = false;

        const cleanup = () => {
          try {
            video.pause();
            video.removeAttribute("src");
            video.load();
          } catch {
            // ignore
          }
        };

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(null);
        }, 10000);

        video.onloadedmetadata = () => {
          try {
            const target = Math.min(1, (video.duration || 2) / 2);
            video.currentTime = target;
          } catch {
            // ignore
          }
        };

        video.onseeked = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          try {
            const vw = video.videoWidth || 320;
            const vh = video.videoHeight || Math.round(vw * (16 / 9));
            const width = Math.min(320, vw);
            const height = Math.round((vh / vw) * width);
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              cleanup();
              resolve(null);
              return;
            }
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            cache.set(url, dataUrl);
            cleanup();
            resolve(dataUrl);
          } catch {
            cleanup();
            resolve(null);
          }
        };

        video.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          cleanup();
          resolve(null);
        };
      })
  );

  pending.set(url, promise);
  return promise;
}

export function getVideoThumbUrl(video: ThumbSource): string | null {
  if (video.mux_playback_id) {
    return `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=300`;
  }
  if (video.thumbnail_url) return video.thumbnail_url;
  return null;
}

export function useVideoThumbnail(video: ThumbSource): string | undefined {
  const staticThumb = getVideoThumbUrl(video);
  const [generated, setGenerated] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (staticThumb || !video.video_url) {
      setGenerated(undefined);
      return;
    }
    let cancelled = false;
    captureFrame(video.video_url).then((url) => {
      if (!cancelled && url) setGenerated(url);
    });
    return () => {
      cancelled = true;
    };
  }, [staticThumb, video.video_url]);

  return staticThumb ?? generated;
}

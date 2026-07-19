"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  containerRef: React.RefObject<HTMLElement | null>;
  variant: "feed" | "overlay";
}

export default function VideoControls({ containerRef, variant }: Props) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showFullControls, setShowFullControls] = useState(false);
  const controlsTimer = useRef<number | undefined>(undefined);
  const [draggingVolume, setDraggingVolume] = useState(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const [draggingSeek, setDraggingSeek] = useState(false);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const getVideo = useCallback(() => {
    return containerRef.current?.querySelector<HTMLMediaElement>("mux-player, video");
  }, [containerRef]);

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const video = getVideo();
      if (!video) {
        if (mounted) requestAnimationFrame(sync);
        return;
      }

      const onTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (video.duration) {
          setDuration(video.duration);
          setProgress(video.currentTime / video.duration);
        }
      };
      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const onVolumeChange = () => {
        setMuted(video.muted);
        setVolume(video.volume);
      };
      const onLoadedMetadata = () => {
        if (video.duration) {
          setDuration(video.duration);
          setProgress(video.currentTime / video.duration);
        }
      };

      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("volumechange", onVolumeChange);
      video.addEventListener("loadedmetadata", onLoadedMetadata);

      setPlaying(!video.paused);
      setMuted(video.muted);
      setVolume(video.volume);
      setCurrentTime(video.currentTime);
      if (video.duration) {
        setDuration(video.duration);
        setProgress(video.currentTime / video.duration);
      }

      return () => {
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("volumechange", onVolumeChange);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
      };
    };

    const cleanup = sync();
    return () => {
      mounted = false;
      if (typeof cleanup === "function") cleanup();
    };
  }, [getVideo]);

  const reveal = useCallback(() => {
    setShowFullControls(true);
    window.clearTimeout(controlsTimer.current);
    controlsTimer.current = window.setTimeout(() => {
      if (playing) setShowFullControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    return () => window.clearTimeout(controlsTimer.current);
  }, []);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = getVideo();
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, [getVideo]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = getVideo();
    if (!video) return;
    const dur = video.duration || duration;
    if (!dur || !isFinite(dur)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    video.currentTime = (x / rect.width) * dur;
  }, [getVideo, duration]);

  const handleSeekDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingSeek(true);
    const video = getVideo();
    if (!video) return;
    const dur = video.duration || duration;
    if (!dur || !isFinite(dur)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    video.currentTime = (x / rect.width) * dur;
  }, [getVideo, duration]);

  const handleSeekTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingSeek(true);
    const video = getVideo();
    if (!video) return;
    const dur = video.duration || duration;
    if (!dur || !isFinite(dur)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    video.currentTime = (x / rect.width) * dur;
  }, [getVideo, duration]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = getVideo();
    if (!video) return;
    video.muted = !video.muted;
  }, [getVideo]);

  const handleVolumeChange = useCallback((value: number) => {
    const video = getVideo();
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, value));
    video.volume = clamped;
    if (clamped > 0 && video.muted) video.muted = false;
  }, [getVideo]);

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    handleVolumeChange(x / rect.width);
  }, [handleVolumeChange]);

  const handleVolumeDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingVolume(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    handleVolumeChange(x / rect.width);
  }, [handleVolumeChange]);

  useEffect(() => {
    if (!draggingVolume) return;
    const slider = volumeSliderRef.current;
    if (!slider) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = slider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      handleVolumeChange(x / rect.width);
    };
    const handleMouseUp = () => setDraggingVolume(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingVolume, handleVolumeChange]);

  useEffect(() => {
    if (!draggingSeek) return;
    const bar = seekBarRef.current;
    if (!bar) return;
    const handleMouseMove = (e: MouseEvent) => {
      const video = getVideo();
      if (!video) return;
      const dur = video.duration || duration;
      if (!dur || !isFinite(dur)) return;
      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      video.currentTime = (x / rect.width) * dur;
    };
    const handleMouseUp = () => setDraggingSeek(false);
    const handleTouchMove = (e: TouchEvent) => {
      const video = getVideo();
      if (!video) return;
      const dur = video.duration || duration;
      if (!dur || !isFinite(dur)) return;
      const rect = bar.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      video.currentTime = (x / rect.width) * dur;
    };
    const handleTouchEnd = () => setDraggingSeek(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [draggingSeek, getVideo, duration]);

  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, [containerRef]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (variant === "feed") {
    return (
      <div
        className="absolute inset-0 z-10"
        onMouseMove={reveal}
        onMouseLeave={() => playing && setShowFullControls(false)}
        onTouchStart={reveal}
      >
        {!playing && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20"
            onClick={togglePlay}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 transition-opacity duration-200 ${
            showFullControls ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={seekBarRef}
            className="mb-2 h-1 w-full cursor-pointer rounded-full bg-zinc-600 touch-none"
            onClick={handleSeek}
            onMouseDown={handleSeekDragStart}
            onTouchStart={handleSeekTouchStart}
          >
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay}>
                {playing ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <div className="flex items-center gap-1.5">
                <button onClick={toggleMute}>
                  {muted || volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
                <div
                  ref={volumeSliderRef}
                  className="h-1 w-16 cursor-pointer rounded-full bg-zinc-600"
                  onClick={handleVolumeClick}
                  onMouseDown={handleVolumeDragStart}
                >
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${muted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button onClick={toggleFullscreen}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
      <div
        ref={seekBarRef}
        className="relative flex-1 cursor-pointer py-3 -my-3 touch-none"
        onClick={handleSeek}
        onMouseDown={handleSeekDragStart}
        onTouchStart={handleSeekTouchStart}
      >
        <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
          <div className="h-px w-full rounded-full bg-zinc-600">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
      <span className="text-xs text-white/70 tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

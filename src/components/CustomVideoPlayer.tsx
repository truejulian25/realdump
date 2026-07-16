"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  src: string;
  autoPlay?: boolean;
  fill?: boolean;
  hideControls?: boolean;
}

export default function CustomVideoPlayer({ src, autoPlay = true, fill = false, hideControls = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [draggingVolume, setDraggingVolume] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<{ w: number; h: number } | null>(null);

  const controlsTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!autoPlay) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setPlaying(true)).catch(() => {});
  }, [autoPlay]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setAspectRatio({ w: video.videoWidth, h: video.videoHeight });
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    window.clearTimeout(controlsTimer.current);
    controlsTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const handleVolumeChange = useCallback(
    (value: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(0, Math.min(1, value));
      video.volume = clamped;
      setVolume(clamped);
      if (clamped > 0 && video.muted) {
        video.muted = false;
        setMuted(false);
      }
    },
    []
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      handleVolumeChange(x / rect.width);
    },
    [handleVolumeChange]
  );

  const handleVolumeDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingVolume(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      handleVolumeChange(x / rect.width);
    },
    [handleVolumeChange]
  );

  useEffect(() => {
    if (!draggingVolume) return;
    const handleMouseMove = (e: MouseEvent) => {
      const slider = document.getElementById("volume-slider");
      if (!slider) return;
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

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      video.currentTime = percent * video.duration;
    },
    []
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`group relative w-full cursor-pointer overflow-hidden ${fill ? "h-full bg-black" : "rounded-lg bg-black"}`}
      style={fill ? undefined : { aspectRatio: aspectRatio ? `${aspectRatio.w}/${aspectRatio.h}` : "9/16" }}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => playing && setShowControls(false)}
      onTouchStart={showControlsTemporarily}
      onClick={togglePlay}
    >
      {/* Skeleton overlay while loading metadata */}
      {!fill && !aspectRatio && (
        <div className="absolute inset-0 z-10 bg-zinc-900 animate-pulse" />
      )}

      <video
        ref={videoRef}
        className={`h-full w-full ${fill ? "object-cover" : "object-contain"}`}
        src={src}
        loop
        playsInline
        muted={muted}
        autoPlay
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Play/Pause overlay */}
      {!hideControls && aspectRatio && !playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {/* Bottom controls */}
      {!hideControls && !fill && aspectRatio && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 transition-opacity ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            className="mb-2 h-1 w-full cursor-pointer rounded-full bg-zinc-600"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress}%` }}
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
                  id="volume-slider"
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

            <span className="text-xs text-white">
              {videoRef.current
                ? `${formatTime(videoRef.current.currentTime)} / ${formatTime(videoRef.current.duration || 0)}`
                : "0:00 / 0:00"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

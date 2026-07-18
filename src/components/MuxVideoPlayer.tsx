"use client";

import dynamic from "next/dynamic";
import CustomVideoPlayer from "./CustomVideoPlayer";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[9/16] w-full items-center justify-center rounded-lg bg-black">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
    </div>
  ),
});

interface Props {
  playbackId?: string | null;
  src?: string | null;
  autoPlay?: boolean;
  fill?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
}

export default function MuxVideoPlayer({
  playbackId,
  src,
  autoPlay = true,
  fill = false,
  muted = false,
  loop = true,
  className,
}: Props) {
  if (playbackId) {
    return (
      <MuxPlayer
        playbackId={playbackId}
        autoPlay={autoPlay ? "any" : false}
        muted={muted}
        loop={loop}
        streamType="on-demand"
        className={`${className ?? ""} hide-controls`}
        style={
          fill
            ? { width: "100%", height: "100%", objectFit: "cover" }
            : { width: "100%" }
        }
      />
    );
  }

  if (src) {
    return <CustomVideoPlayer src={src} autoPlay={autoPlay} fill={fill} />;
  }

  return null;
}

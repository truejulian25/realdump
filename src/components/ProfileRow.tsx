"use client";

import { useState } from "react";

interface Props {
  username: string;
  avatarUrl?: string | null;
}

export default function ProfileRow({ username, avatarUrl }: Props) {
  const [following, setFollowing] = useState(false);

  const avatarSrc = avatarUrl ?? `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff`;

  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-zinc-600 bg-zinc-800">
        <img
          src={avatarSrc}
          alt={username}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white">{username}</p>
        <button
          onClick={() => setFollowing((s) => !s)}
          className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
            following
              ? "border-zinc-600 text-zinc-400"
              : "border-blue-500 text-blue-500"
          }`}
        >
          {following ? "Siguiendo" : "Seguir"}
        </button>
      </div>
    </div>
  );
}

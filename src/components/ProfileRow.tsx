"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowToggle } from "@/hooks/useFollow";

interface Props {
  username: string;
  avatarUrl?: string | null;
  header?: boolean;
  userId?: string;
}

export default function ProfileRow({ username, avatarUrl, header, userId }: Props) {
  const { user } = useAuth();
  const { isFollowing, toggling, toggle } = useFollowToggle(userId);
  const isSelf = user?.id === userId;

  const avatarSrc = avatarUrl ?? `https://ui-avatars.com/api/?name=${username}&background=6366f1&color=fff`;

  const profileLink = userId ? `/user/${userId}` : undefined;

  const avatar = (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-600 bg-zinc-800">
      <img
        src={avatarSrc}
        alt={username}
        className="h-full w-full object-cover"
      />
    </div>
  );

  const name = <p className="text-sm font-semibold text-white">{username}</p>;

  const profileContent = profileLink ? (
    <Link href={profileLink} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      {avatar}
      {name}
    </Link>
  ) : (
    <div className="flex items-center gap-2">
      {avatar}
      {name}
    </div>
  );

  if (header) {
    return (
      <div className="flex items-center justify-between px-3 py-2.5">
        {profileContent}
        {!isSelf && (
          <button
            onClick={toggle}
            disabled={toggling}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              isFollowing
                ? "border-zinc-600 text-zinc-400"
                : "border-blue-500 text-blue-500"
            }`}
          >
            {isFollowing ? "Siguiendo" : "Seguir"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-1">
      {profileLink ? (
        <Link href={profileLink} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {avatar}
        </Link>
      ) : (
        avatar
      )}

      <div className="flex items-center gap-2">
        {profileLink ? (
          <Link href={profileLink} className="hover:opacity-80 transition-opacity">
            {name}
          </Link>
        ) : (
          name
        )}
        {!isSelf && (
          <button
            onClick={toggle}
            disabled={toggling}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              isFollowing
                ? "border-zinc-600 text-zinc-400"
                : "border-blue-500 text-blue-500"
            }`}
          >
            {isFollowing ? "Siguiendo" : "Seguir"}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import ProfileVideoCard from "@/components/ProfileVideoCard";


export default function ProfilePage() {
  const [following, setFollowing] = useState(false);

  return (
    <div className="flex min-h-screen flex-col pt-14 pb-20">
      <div className="flex flex-col items-center gap-0 border-b border-zinc-800 bg-zinc-900 px-4 py-1">
        {/* Avatar */}
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          <img
            src="https://ui-avatars.com/api/?name=Joan+Robayo&background=6366f1&color=fff&size=96"
            alt="Perfil"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Nombre grande */}
        <h1 className="text-lg font-black text-white">Joan Robayo</h1>

        {/* Username */}
        <p className="text-sm text-zinc-500">@joan</p>

        {/* Descripción + lápiz de editar */}
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-500">Tatuador profesional | Diseño personalizado</p>
          <button className="text-zinc-400 transition-colors hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Botón de seguir */}
        <button
          onClick={() => setFollowing((s) => !s)}
          className={`w-48 rounded-lg border py-1.5 text-sm font-semibold transition-colors ${
            following
              ? "border-zinc-600 text-zinc-400 hover:bg-zinc-800/50"
              : "border-blue-500 text-blue-500 hover:bg-blue-500/10"
          }`}
        >
          {following ? "Siguiendo" : "Seguir"}
        </button>

        {/* Stats */}
        <div className="flex items-center gap-8 text-center">
          <div>
            <p className="text-lg font-bold text-white">3</p>
            <p className="text-sm text-zinc-500">Videos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">0</p>
            <p className="text-sm text-zinc-500">Seguidores</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">0</p>
            <p className="text-sm text-zinc-500">Siguiendo</p>
          </div>
        </div>
      </div>

      {/* Grid de videos */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {["/videos/video1.mp4", "/videos/video2.mp4", "/videos/video3.mp4"].map((src, i) => (
          <ProfileVideoCard key={i} src={src} />
        ))}
      </div>
    </div>
  );
}

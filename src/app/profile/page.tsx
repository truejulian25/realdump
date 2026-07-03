export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col pt-14 pb-20">
      <div className="flex flex-col items-center gap-4 border-b border-zinc-800 px-4 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-400"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white">@joan</h2>

        <div className="flex items-center gap-8 text-center">
          <div>
            <p className="text-lg font-bold text-white">3</p>
            <p className="text-xs text-zinc-500">Videos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">0</p>
            <p className="text-xs text-zinc-500">Seguidores</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">0</p>
            <p className="text-xs text-zinc-500">Siguiendo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {[1, 2, 3].map((id) => (
          <div
            key={id}
            className="aspect-[9/16] bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-14 pb-20">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-900 transition-colors hover:border-blue-500">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-sm">Seleccionar video</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <input
            type="text"
            placeholder="Nombre de usuario"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />

          <textarea
            placeholder="Descripción"
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />

          <input
            type="text"
            placeholder="Hashtags (separados por espacio)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
        </div>

        <button className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          Subir video
        </button>
      </div>
    </div>
  );
}

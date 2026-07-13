export default function FeedSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md border-x border-zinc-800">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex w-full flex-col pb-5 px-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse" />
            <div className="h-3 w-24 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="aspect-[9/16] w-full rounded-lg bg-zinc-800 animate-pulse" />
          <div className="mt-3 flex gap-3">
            <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="mt-2 h-3 w-3/4 rounded bg-zinc-800 animate-pulse" />
          <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function ProfileGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square bg-zinc-800 animate-pulse" />
      ))}
    </div>
  );
}

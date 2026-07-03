import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-center border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex w-full max-w-sm items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-white">
          realdump
        </h1>
        <Link
          href="/liked"
          className="text-zinc-400 transition-colors hover:text-red-400"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

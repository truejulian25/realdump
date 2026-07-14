"use client";

import { useState } from "react";
import Link from "next/link";
import { legalSections } from "@/lib/legal-content";

function SectionContent({ content }: { content: string }) {
  const paragraphs = content.split("\n\n");
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => {
        const trimmed = p.trim();
        if (!trimmed) return null;
        return (
          <p key={i} className="text-xs text-zinc-400 leading-relaxed">
            {trimmed.split("\n").map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function TermsPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollAndOpen = (id: string) => {
    if (!openSections.has(id)) {
      setOpenSections((prev) => new Set(prev).add(id));
    }
    setTimeout(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black pt-14 pb-20">
      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <Link
          href="/profile"
          className="mb-4 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver al perfil
        </Link>

        <h1 className="mb-2 text-xl font-bold text-white">Centro Legal</h1>
        <p className="mb-6 text-xs text-zinc-500">
          Última actualización: Julio 2026
        </p>

        {/* índice */}
        <nav className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Índice</h2>
          <ol className="space-y-1.5">
            {legalSections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollAndOpen(s.id)}
                  className="text-left text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* secciones */}
        <div className="space-y-3">
          {legalSections.map((s) => {
            const isOpen = openSections.has(s.id);
            return (
              <section
                key={s.id}
                id={`section-${s.id}`}
                className="overflow-hidden rounded-lg border border-zinc-800"
              >
                <button
                  onClick={() => toggle(s.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-900"
                >
                  <span className="text-sm font-medium text-zinc-200">
                    {s.title}
                  </span>
                  <svg
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-800 px-4 py-4">
                    <SectionContent content={s.content} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

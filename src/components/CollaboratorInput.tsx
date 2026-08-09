"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Collaborator {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  selected: Collaborator[];
  onChange: (next: Collaborator[]) => void;
  excludeId?: string;
  disabled?: boolean;
}

function avatarSrc(c: Collaborator) {
  return (
    c.avatar_url ||
    `https://ui-avatars.com/api/?name=${c.display_name ?? c.username ?? "user"}&background=6366f1&color=fff&size=48`
  );
}

export default function CollaboratorInput({
  selected,
  onChange,
  excludeId,
  disabled,
}: Props) {
  const supabase = createClient();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Collaborator[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("role", "creator")
        .is("deactivated_at", null)
        .is("deleted_at", null)
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(8);

      if (!data) {
        setResults([]);
        setSearching(false);
        return;
      }

      const selectedIds = new Set(selected.map((s) => s.id));
      setResults(
        (data as Collaborator[]).filter(
          (c) => !selectedIds.has(c.id) && c.id !== excludeId,
        ),
      );
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selected, excludeId, supabase]);

  const addCollaborator = (c: Collaborator) => {
    if (selected.some((s) => s.id === c.id) || c.id === excludeId) return;
    onChange([...selected, c]);
    setQuery("");
    setResults([]);
  };

  const removeCollaborator = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="relative">
      <div className="flex items-center border-b border-zinc-800 focus-within:border-blue-500">
        <span className="text-sm text-zinc-500 select-none">@</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="usuario"
          disabled={disabled}
          className="w-full flex-1 bg-transparent px-1 py-2 text-sm text-white placeholder-zinc-600 outline-none caret-blue-500 disabled:opacity-50"
        />
        {searching && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        )}
      </div>

      {query.trim() && !searching && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">{t("videoTags.noResults")}</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addCollaborator(c)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-zinc-800"
              >
                <img
                  src={avatarSrc(c)}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">
                    {c.display_name ?? c.username}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    @{c.username}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-1 pr-2 text-xs text-white"
            >
              <img
                src={avatarSrc(c)}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
              <span className="max-w-[8rem] truncate">
                @{c.username ?? c.display_name}
              </span>
              <button
                type="button"
                onClick={() => removeCollaborator(c.id)}
                disabled={disabled}
                aria-label={t("videoTags.remove")}
                className="ml-0.5 text-zinc-500 transition-colors hover:text-white"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
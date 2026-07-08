import { useEffect, useMemo, useState } from "react";
import { Clock, Download, FileText, Search } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Doc } from "@/lib/types";
import { formatDate, formatSize } from "@/lib/format";
import { useSettings } from "@/context/SettingsContext";
import { EmptyState, inputClass, LoadingBlock } from "@/components/ui";

export function ParticipantLibrary() {
  const { settings } = useSettings();
  const [documents, setDocuments] = useState<Doc[] | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("tous");

  useEffect(() => {
    api
      .get<{ documents: Doc[] }>("/documents")
      .then((r) => setDocuments(r.documents))
      .catch((err) => toast.error(err.message));
  }, []);

  const categories = useMemo(() => {
    if (!documents) return ["tous"];
    const names = new Set(
      documents.map((d) => d.categoryName).filter((n): n is string => Boolean(n))
    );
    return ["tous", ...Array.from(names).sort()];
  }, [documents]);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return documents
      .filter((d) => categoryFilter === "tous" || d.categoryName === categoryFilter)
      .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
  }, [documents, categoryFilter, search]);

  if (!documents) return <LoadingBlock label="Chargement de la bibliothèque…" />;

  return (
    <div className="space-y-5">
      <div className="bg-brand-deep rounded-xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
              Bibliothèque documentaire
            </p>
            <h2 className="text-xl font-bold font-title">{settings.org_full_name}</h2>
            <p className="text-white/60 text-sm mt-1">
              Documents officiels CEEAC · Accès accrédité
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent">{documents.length}</p>
            <p className="text-white/50 text-xs">documents disponibles</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un document…"
          className={`${inputClass} pl-9 py-2`}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              categoryFilter === cat
                ? "bg-brand text-white"
                : "bg-white border border-line text-slate2 hover:bg-mist"
            )}
          >
            {cat === "tous" ? "Toutes catégories" : cat}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl border border-line-soft p-4 hover:shadow-md hover:border-brand/20 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink leading-snug mb-1.5">{doc.title}</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {doc.categoryName && (
                    <span className="text-xs bg-brand-soft text-brand-dark px-2 py-0.5 rounded">
                      {doc.categoryName}
                    </span>
                  )}
                  {(doc.sessionReference || doc.sessionTitle) && (
                    <span className="text-xs text-slate2/70 font-mono">
                      {doc.sessionReference || doc.sessionTitle}
                    </span>
                  )}
                  <span className="text-xs text-slate2/70 flex items-center gap-1">
                    <Clock size={10} /> {formatDate(doc.createdAt)}
                  </span>
                  <span className="text-xs text-slate2/70">{formatSize(doc.fileSize)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-mono text-slate2/70">{doc.downloads}</p>
                  <p className="text-[10px] text-slate2/70">téléch.</p>
                </div>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-dark transition-colors"
                >
                  <Download size={12} />
                  Télécharger
                </a>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <EmptyState
            icon={<FileText size={32} />}
            message={
              documents.length === 0
                ? "Aucun document n'a encore été publié"
                : "Aucun document ne correspond à votre recherche"
            }
          />
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit3, FileText, Trash2, Upload } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, CtsSession, Doc, DocStatus } from "@/lib/types";
import { formatDate, formatSize } from "@/lib/format";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  inputClass,
  LoadingBlock,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "@/components/ui";

interface FormState {
  title: string;
  categoryId: string;
  sessionId: string;
  status: DocStatus;
}

const EMPTY_FORM: FormState = {
  title: "",
  categoryId: "",
  sessionId: "",
  status: "publié",
};

export function AdminDocuments() {
  const [documents, setDocuments] = useState<Doc[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<CtsSession[]>([]);
  const [filter, setFilter] = useState<"tous" | DocStatus>("tous");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = () =>
    Promise.all([
      api.get<{ documents: Doc[] }>("/documents"),
      api.get<{ categories: Category[] }>("/categories"),
      api.get<{ sessions: CtsSession[] }>("/sessions"),
    ])
      .then(([d, c, s]) => {
        setDocuments(d.documents);
        setCategories(c.categories);
        setSessions(s.sessions);
      })
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return filter === "tous" ? documents : documents.filter((d) => d.status === filter);
  }, [documents, filter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (doc: Doc) => {
    setForm({
      title: doc.title,
      categoryId: doc.categoryId ?? "",
      sessionId: doc.sessionId ?? "",
      status: doc.status,
    });
    setEditing(doc);
    setModal("edit");
  };

  const submit = async (status: DocStatus) => {
    setBusy(true);
    try {
      if (modal === "create") {
        if (!file) {
          toast.error("Sélectionnez un fichier à publier");
          return;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", form.title);
        fd.append("categoryId", form.categoryId);
        fd.append("sessionId", form.sessionId);
        fd.append("status", status);
        await api.postForm("/documents", fd);
        toast.success(status === "publié" ? "Document publié" : "Brouillon enregistré");
      } else if (editing) {
        await api.put(`/documents/${editing.id}`, {
          title: form.title,
          categoryId: form.categoryId || null,
          sessionId: form.sessionId || null,
          status,
        });
        toast.success("Document mis à jour");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Opération impossible");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/documents/${deleting.id}`);
      toast.success("Document supprimé");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    if (!form.title) {
      setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, "") }));
    }
  };

  if (!documents) return <LoadingBlock label="Chargement des documents…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-ink text-xl font-bold font-title">Gestion documentaire</h2>
          <p className="text-slate2 text-sm mt-0.5">
            Documents officiels publiés et brouillons en attente
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Upload size={15} />
          Publier un document
        </PrimaryButton>
      </div>

      <div className="flex items-center gap-2">
        {(
          [
            { key: "tous", label: "Tous les documents" },
            { key: "publié", label: "Publiés" },
            { key: "brouillon", label: "Brouillons" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              filter === key
                ? "bg-brand text-white"
                : "bg-white border border-line text-slate2 hover:bg-mist"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-line-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-mist border-b border-line-soft">
              <tr>
                {["Document", "Catégorie", "Session", "Date", "Taille", "Tél.", "Statut", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate2 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-mist/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 max-w-xs">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-ink leading-snug line-clamp-2">{doc.title}</p>
                        <p className="text-[11px] text-slate2/60 truncate">{doc.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {doc.categoryName ? (
                      <span className="text-xs bg-brand-soft text-brand-dark px-2 py-1 rounded whitespace-nowrap">
                        {doc.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate2/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 font-mono whitespace-nowrap">
                    {doc.sessionReference || doc.sessionTitle || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 whitespace-nowrap">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 whitespace-nowrap">
                    {formatSize(doc.fileSize)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate2">{doc.downloads}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="p-1.5 rounded hover:bg-line-soft text-slate2/60 hover:text-brand transition-colors"
                        title="Télécharger"
                        aria-label="Télécharger"
                      >
                        <Download size={13} />
                      </a>
                      <button
                        onClick={() => openEdit(doc)}
                        className="p-1.5 rounded hover:bg-line-soft text-slate2/60 hover:text-brand transition-colors"
                        title="Modifier"
                        aria-label="Modifier"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleting(doc)}
                        className="p-1.5 rounded hover:bg-danger-soft text-slate2/60 hover:text-danger transition-colors"
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={<FileText size={32} />} message="Aucun document dans cette vue" />
          )}
        </div>
      </div>

      {/* ─── Modale publication / édition ──────────────────────────── */}
      {modal && (
        <Modal
          title={modal === "create" ? "Publier un document" : "Modifier le document"}
          subtitle={
            modal === "create"
              ? "Le document publié sera accessible à tous les participants accrédités"
              : editing?.fileName
          }
          onClose={() => setModal(null)}
        >
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit(form.status);
            }}
          >
            <Field label="Titre du document" required>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titre officiel du document"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Catégorie">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Aucune</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Session liée">
                <select
                  value={form.sessionId}
                  onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Aucune</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title.length > 40 ? `${s.title.slice(0, 40)}…` : s.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {modal === "create" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInput.current?.click()}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                  dragOver
                    ? "border-brand bg-brand-soft"
                    : "border-line hover:border-brand/40 hover:bg-mist/50"
                )}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
                <Upload size={20} className="text-slate2/60 mx-auto mb-2" />
                {file ? (
                  <>
                    <p className="text-sm text-ink font-medium">{file.name}</p>
                    <p className="text-xs text-slate2/70 mt-1">{formatSize(file.size)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate2 font-medium">
                      Glisser-déposer le fichier ici ou cliquer pour parcourir
                    </p>
                    <p className="text-xs text-slate2/70 mt-1">
                      PDF, Word, Excel, PowerPoint — max. 50 Mo
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <SecondaryButton
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => submit("brouillon")}
              >
                Enregistrer en brouillon
              </SecondaryButton>
              <PrimaryButton
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => submit("publié")}
              >
                {busy ? "Envoi en cours…" : "Publier"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer le document"
          message={`« ${deleting.title} » et son fichier seront définitivement supprimés. Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

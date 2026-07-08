import { useEffect, useState } from "react";
import { Calendar, Clock, Edit3, FileText, MapPin, Plus, Trash2, Users } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CtsSession, SessionStatus } from "@/lib/types";
import { formatDateRange } from "@/lib/format";
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
  location: string;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  reference: string;
  description: string;
  expectedParticipants: number;
}

const EMPTY_FORM: FormState = {
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "à-venir",
  reference: "",
  description: "",
  expectedParticipants: 0,
};

export function AdminSessions() {
  const [sessions, setSessions] = useState<CtsSession[] | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<CtsSession | null>(null);
  const [deleting, setDeleting] = useState<CtsSession | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get<{ sessions: CtsSession[] }>("/sessions")
      .then((r) => setSessions(r.sessions))
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (s: CtsSession) => {
    setForm({
      title: s.title,
      location: s.location,
      startDate: s.startDate.slice(0, 10),
      endDate: s.endDate ? s.endDate.slice(0, 10) : "",
      status: s.status,
      reference: s.reference,
      description: s.description,
      expectedParticipants: s.expectedParticipants,
    });
    setEditing(s);
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      endDate: form.endDate || null,
      expectedParticipants: Number(form.expectedParticipants) || 0,
    };
    try {
      if (modal === "create") {
        await api.post("/sessions", payload);
        toast.success("Session créée");
      } else if (editing) {
        await api.put(`/sessions/${editing.id}`, payload);
        toast.success("Session mise à jour");
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
      await api.delete(`/sessions/${deleting.id}`);
      toast.success("Session supprimée");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  if (!sessions) return <LoadingBlock label="Chargement des sessions…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-ink text-xl font-bold font-title">Sessions CTS-APPS</h2>
          <p className="text-slate2 text-sm mt-0.5">
            Calendrier des sessions ordinaires et extraordinaires
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus size={15} />
          Nouvelle session
        </PrimaryButton>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-line-soft">
          <EmptyState
            icon={<Calendar size={32} />}
            message="Aucune session — créez la première session CTS"
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-line-soft p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 flex-wrap">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    session.status === "à-venir"
                      ? "bg-violet-100"
                      : session.status === "en-cours"
                        ? "bg-accent-soft"
                        : "bg-slate-100"
                  )}
                >
                  <Calendar
                    size={20}
                    className={
                      session.status === "à-venir"
                        ? "text-violet-600"
                        : session.status === "en-cours"
                          ? "text-accent-dark"
                          : "text-slate-400"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-ink text-sm font-title">
                        {session.title}
                        {session.reference && (
                          <span className="ml-2 text-[11px] font-mono text-slate2/60 font-normal">
                            {session.reference}
                          </span>
                        )}
                      </h3>
                      <p className="text-slate2/70 text-xs mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {formatDateRange(session.startDate, session.endDate)}
                        </span>
                        {session.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {session.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  {session.description && (
                    <p className="text-xs text-slate2 mt-2 line-clamp-2">{session.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate2">
                      <Users size={12} className="text-slate2/60" />
                      {session.expectedParticipants} participants attendus
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate2">
                      <FileText size={12} className="text-slate2/60" />
                      {session.documentCount} document(s)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(session)}
                    className="flex items-center gap-1.5 border border-line text-slate2 px-3 py-1.5 rounded-lg text-xs hover:bg-mist transition-colors"
                  >
                    <Edit3 size={12} />
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleting(session)}
                    className="p-1.5 rounded-lg text-slate2/60 hover:bg-danger-soft hover:text-danger transition-colors"
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Nouvelle session CTS" : "Modifier la session"}
          onClose={() => setModal(null)}
          wide
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Titre de la session" required>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="3ème Session Ordinaire CTS-APPS 2025"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Référence">
                <input
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="CTS-APPS/2025/03"
                  className={inputClass}
                />
              </Field>
              <Field label="Lieu">
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Brazzaville, Congo"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de début" required>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Date de fin">
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SessionStatus })}
                  className={inputClass}
                >
                  <option value="à-venir">À venir</option>
                  <option value="en-cours">En cours</option>
                  <option value="terminé">Terminé</option>
                </select>
              </Field>
              <Field label="Participants attendus">
                <input
                  type="number"
                  min={0}
                  value={form.expectedParticipants}
                  onChange={(e) =>
                    setForm({ ...form, expectedParticipants: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ordre du jour, contexte, objectifs…"
                className={inputClass}
              />
            </Field>

            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" className="flex-1" onClick={() => setModal(null)}>
                Annuler
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1" disabled={busy}>
                {busy ? "Enregistrement…" : modal === "create" ? "Créer la session" : "Enregistrer"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer la session"
          message={`« ${deleting.title} » sera supprimée. Les documents liés seront conservés mais détachés de la session.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

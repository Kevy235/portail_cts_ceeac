import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Edit3,
  KeyRound,
  Mail,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { COUNTRIES, COUNTRY_FLAGS, type User, type UserStatus } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";
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
  name: string;
  email: string;
  country: string;
  functionTitle: string;
  institution: string;
  status: UserStatus;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  country: "",
  functionTitle: "",
  institution: "",
  status: "en-attente",
};

export function AdminParticipants() {
  const [participants, setParticipants] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

  const load = () =>
    api
      .get<{ participants: User[] }>("/participants")
      .then((r) => setParticipants(r.participants))
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!participants) return [];
    const q = search.toLowerCase();
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (p: User) => {
    setForm({
      name: p.name,
      email: p.email,
      country: p.country,
      functionTitle: p.functionTitle,
      institution: p.institution,
      status: p.status,
    });
    setEditing(p);
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (modal === "create") {
        const { temporaryPassword } = await api.post<{
          participant: User;
          temporaryPassword: string;
        }>("/participants", form);
        setTempPassword({ email: form.email, password: temporaryPassword });
        toast.success("Compte participant créé");
      } else if (editing) {
        await api.put(`/participants/${editing.id}`, form);
        toast.success("Participant mis à jour");
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
      await api.delete(`/participants/${deleting.id}`);
      toast.success(`${deleting.name} supprimé`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (p: User) => {
    try {
      const { temporaryPassword } = await api.post<{ temporaryPassword: string }>(
        `/participants/${p.id}/reset-password`
      );
      setTempPassword({ email: p.email, password: temporaryPassword });
      toast.success("Mot de passe réinitialisé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Réinitialisation impossible");
    }
  };

  if (!participants) return <LoadingBlock label="Chargement des participants…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-ink text-xl font-bold font-title">Gestion des participants</h2>
          <p className="text-slate2 text-sm mt-0.5">
            Experts accrédités au Comité Technique Spécialisé
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <UserPlus size={15} />
          Créer un compte
        </PrimaryButton>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, pays ou e-mail…"
          className={`${inputClass} pl-9 py-2`}
        />
      </div>

      <div className="bg-white rounded-xl border border-line-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-mist border-b border-line-soft">
              <tr>
                {["Expert", "Pays", "Fonction", "Statut", "Créé le", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate2 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-mist/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">
                        {initials(p.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-[11px] text-slate2/70">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm text-ink whitespace-nowrap">
                      <span>{COUNTRY_FLAGS[p.country] ?? "🌍"}</span>
                      {p.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate2">{p.functionTitle}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 font-mono whitespace-nowrap">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleResetPassword(p)}
                        className="p-1.5 rounded hover:bg-line-soft text-slate2/60 hover:text-brand transition-colors"
                        title="Réinitialiser le mot de passe"
                        aria-label="Réinitialiser le mot de passe"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded hover:bg-line-soft text-slate2/60 hover:text-brand transition-colors"
                        title="Modifier"
                        aria-label="Modifier"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="p-1.5 rounded hover:bg-danger-soft text-slate2/60 hover:text-danger transition-colors"
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Users size={32} />}
              message={
                search
                  ? "Aucun participant ne correspond à la recherche"
                  : "Aucun participant — créez le premier compte"
              }
            />
          )}
        </div>
        <div className="px-4 py-3 border-t border-line-soft">
          <p className="text-xs text-slate2/70">{filtered.length} participant(s) affiché(s)</p>
        </div>
      </div>

      {/* ─── Modale création / édition ────────────────────────────── */}
      {modal && (
        <Modal
          title={modal === "create" ? "Créer un compte participant" : "Modifier le participant"}
          subtitle={
            modal === "create"
              ? "Un mot de passe provisoire sera généré et affiché une seule fois"
              : editing?.email
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Nom complet" required>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Dr. Prénom Nom"
                className={inputClass}
              />
            </Field>
            <Field label="Adresse e-mail institutionnelle" required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="prenom.nom@institution.pays"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pays" required>
                <select
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Sélectionner…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fonction" required>
                <input
                  required
                  value={form.functionTitle}
                  onChange={(e) => setForm({ ...form, functionTitle: e.target.value })}
                  placeholder="Expert Principal"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Institution">
                <input
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="Ministère des Affaires Étrangères"
                  className={inputClass}
                />
              </Field>
              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                  className={inputClass}
                >
                  <option value="en-attente">En attente</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </Field>
            </div>

            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" className="flex-1" onClick={() => setModal(null)}>
                Annuler
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1" disabled={busy}>
                <Mail size={14} />
                {busy
                  ? "Enregistrement…"
                  : modal === "create"
                    ? "Créer le compte"
                    : "Enregistrer"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Mot de passe provisoire ───────────────────────────────── */}
      {tempPassword && (
        <Modal
          title="Identifiants provisoires"
          subtitle="Affichés une seule fois — transmettez-les par un canal sûr"
          onClose={() => setTempPassword(null)}
        >
          <div className="p-6 space-y-4">
            <div className="bg-mist rounded-lg p-4 space-y-2">
              <p className="text-xs text-slate2">
                E-mail : <span className="font-mono text-ink">{tempPassword.email}</span>
              </p>
              <p className="text-xs text-slate2">
                Mot de passe provisoire :{" "}
                <span className="font-mono text-ink font-bold">{tempPassword.password}</span>
              </p>
            </div>
            <p className="text-xs text-slate2">
              Le participant devra définir un nouveau mot de passe lors de sa première connexion.
            </p>
            <PrimaryButton
              className="w-full"
              onClick={() => {
                navigator.clipboard
                  .writeText(
                    `Plateforme CTS-APPS — identifiants provisoires\nE-mail : ${tempPassword.email}\nMot de passe : ${tempPassword.password}`
                  )
                  .then(() => toast.success("Identifiants copiés"));
              }}
            >
              <Copy size={14} />
              Copier les identifiants
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer le participant"
          message={`Le compte de ${deleting.name} (${deleting.email}) sera définitivement supprimé. Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

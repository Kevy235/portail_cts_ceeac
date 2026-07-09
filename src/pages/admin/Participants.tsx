import { useMemo, useState } from "react";
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
import { useApiResource } from "@/lib/useApiResource";
import { formatDate, initials } from "@/lib/format";
import { useI18n } from "@/i18n";
import {
  ConfirmDialog,
  copyToClipboard,
  EmptyState,
  ErrorBlock,
  Field,
  inputClass,
  LoadingBlock,
  Modal,
  PageHeader,
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
  const { t } = useI18n();
  const resource = useApiResource<{ participants: User[] }>("/participants");
  const participants = resource.data?.participants ?? null;
  const load = resource.reload;

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

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
    if (busy) return;
    setBusy(true);
    try {
      if (modal === "create") {
        const { temporaryPassword } = await api.post<{
          participant: User;
          temporaryPassword: string;
        }>("/participants", form);
        setTempPassword({ email: form.email, password: temporaryPassword });
        toast.success(t("part.created"));
      } else if (editing) {
        await api.put(`/participants/${editing.id}`, form);
        toast.success(t("part.updated"));
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("part.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await api.delete(`/participants/${deleting.id}`);
      toast.success(t("part.deleted", { name: deleting.name }));
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("part.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  // Réinitialisation : action destructive → confirmation + verrou anti double-clic.
  const handleResetPassword = async () => {
    if (!resetting || busy) return;
    setBusy(true);
    try {
      const { temporaryPassword } = await api.post<{ temporaryPassword: string }>(
        `/participants/${resetting.id}/reset-password`
      );
      setTempPassword({ email: resetting.email, password: temporaryPassword });
      setResetting(null);
      toast.success(t("part.pwdReset"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("part.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (resource.error && !participants)
    return <ErrorBlock message={resource.error} onRetry={load} />;
  if (!participants) return <LoadingBlock />;

  const columns = [
    t("part.colExpert"),
    t("part.colCountry"),
    t("part.colFunction"),
    t("part.colStatus"),
    t("part.colCreated"),
    t("part.colActions"),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("part.title")}
        subtitle={t("part.subtitle")}
        action={
          <PrimaryButton onClick={openCreate}>
            <UserPlus size={15} />
            {t("part.create")}
          </PrimaryButton>
        }
      />

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2/50" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("part.searchPh")}
          aria-label={t("part.searchPh")}
          className={`${inputClass} pl-9 py-2`}
        />
      </div>

      <div className="bg-white rounded-xl border border-line-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-mist border-b border-line-soft">
              <tr>
                {columns.map((h) => (
                  <th
                    key={h}
                    scope="col"
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
                        <p className="text-xs text-slate2/80">{p.email}</p>
                        {p.originSessionTitle && (
                          <p className="text-[11px] text-accent-dark mt-0.5">
                            {t("part.viaSession", { title: p.originSessionTitle })}
                          </p>
                        )}
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
                        onClick={() => setResetting(p)}
                        className="p-1.5 rounded hover:bg-line-soft text-slate2/60 hover:text-brand transition-colors"
                        title={t("part.resetPwd")}
                        aria-label={t("part.resetPwd")}
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded hover:bg-line-soft text-slate2/60 hover:text-brand transition-colors"
                        title={t("common.edit")}
                        aria-label={t("common.edit")}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="p-1.5 rounded hover:bg-danger-soft text-slate2/60 hover:text-danger transition-colors"
                        title={t("common.delete")}
                        aria-label={t("common.delete")}
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
              message={search ? t("part.emptySearch") : t("part.empty")}
            />
          )}
        </div>
        <div className="px-4 py-3 border-t border-line-soft">
          <p className="text-xs text-slate2/70">{t("part.shown", { n: filtered.length })}</p>
        </div>
      </div>

      {/* ─── Modale création / édition ────────────────────────────── */}
      {modal && (
        <Modal
          title={modal === "create" ? t("part.createTitle") : t("part.editTitle")}
          subtitle={modal === "create" ? t("part.createSubtitle") : editing?.email}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label={t("part.fullName")} required>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("part.fullNamePh")}
                className={inputClass}
              />
            </Field>
            <Field label={t("part.email")} required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("part.emailPh")}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("part.country")} required>
                <select
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{t("common.select")}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("part.function")} required>
                <input
                  required
                  value={form.functionTitle}
                  onChange={(e) => setForm({ ...form, functionTitle: e.target.value })}
                  placeholder={t("part.functionPh")}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("part.institution")}>
                <input
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder={t("part.institutionPh")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("part.status")}>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                  className={inputClass}
                >
                  <option value="en-attente">{t("status.en-attente")}</option>
                  <option value="actif">{t("status.actif")}</option>
                  <option value="inactif">{t("status.inactif")}</option>
                </select>
              </Field>
            </div>

            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" className="flex-1" onClick={() => setModal(null)}>
                {t("common.cancel")}
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1" disabled={busy}>
                <Mail size={14} />
                {busy
                  ? t("common.saving")
                  : modal === "create"
                    ? t("part.createBtn")
                    : t("common.save")}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Mot de passe provisoire ───────────────────────────────── */}
      {tempPassword && (
        <Modal
          title={t("part.tempTitle")}
          subtitle={t("part.tempSubtitle")}
          onClose={() => setTempPassword(null)}
        >
          <div className="p-6 space-y-4">
            <div className="bg-mist rounded-lg p-4 space-y-2">
              <p className="text-xs text-slate2">
                {t("part.tempEmail")}{" "}
                <span className="font-mono text-ink">{tempPassword.email}</span>
              </p>
              <p className="text-xs text-slate2">
                {t("part.tempPassword")}{" "}
                <span className="font-mono text-ink font-bold">{tempPassword.password}</span>
              </p>
            </div>
            <p className="text-xs text-slate2">{t("part.tempNote")}</p>
            <PrimaryButton
              className="w-full"
              onClick={async () => {
                const ok = await copyToClipboard(
                  t("part.copyText", {
                    email: tempPassword.email,
                    password: tempPassword.password,
                  })
                );
                if (ok) toast.success(t("part.copied"));
                else toast.error(t("common.copyFailed"));
              }}
            >
              <Copy size={14} />
              {t("part.copyBtn")}
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={t("part.deleteTitle")}
          message={t("part.deleteMsg", { name: deleting.name, email: deleting.email })}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title={t("part.resetTitle")}
          message={t("part.resetMsg", { name: resetting.name })}
          confirmLabel={t("part.resetConfirm")}
          onConfirm={handleResetPassword}
          onCancel={() => setResetting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

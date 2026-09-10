import { useMemo, useState } from "react";
import { Copy, Edit3, KeyRound, Mail, Search, Shield, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User, UserStatus } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { formatDate, initials } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
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
  functionTitle: string;
  institution: string;
  status: UserStatus;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  functionTitle: "",
  institution: "",
  status: "actif",
};

export function AdminAdmins() {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const { settings } = useSettings();
  const resource = useApiResource<{ admins: User[] }>("/admins");
  const admins = resource.data?.admins ?? null;
  const load = resource.reload;

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null
  );

  const filtered = useMemo(() => {
    if (!admins) return [];
    const q = search.toLowerCase();
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.functionTitle.toLowerCase().includes(q) ||
        a.institution.toLowerCase().includes(q)
    );
  }, [admins, search]);

  const activeCount = (admins ?? []).filter((a) => a.status !== "inactif").length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (a: User) => {
    setForm({
      name: a.name,
      email: a.email,
      functionTitle: a.functionTitle,
      institution: a.institution,
      status: a.status,
    });
    setEditing(a);
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (modal === "create") {
        const { temporaryPassword } = await api.post<{
          admin: User;
          temporaryPassword: string;
        }>("/admins", form);
        setTempPassword({ email: form.email, password: temporaryPassword });
        toast.success(t("adm.created"));
      } else if (editing) {
        await api.put(`/admins/${editing.id}`, form);
        toast.success(t("adm.updated"));
        if (editing.id === user?.id) await refresh();
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("adm.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await api.delete(`/admins/${deleting.id}`);
      toast.success(t("adm.deleted", { name: deleting.name }));
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("adm.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetting || busy) return;
    setBusy(true);
    try {
      const { temporaryPassword } = await api.post<{ temporaryPassword: string }>(
        `/admins/${resetting.id}/reset-password`
      );
      setTempPassword({ email: resetting.email, password: temporaryPassword });
      setResetting(null);
      toast.success(t("adm.pwdReset"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("adm.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (resource.error && !admins) return <ErrorBlock message={resource.error} onRetry={load} />;
  if (!admins) return <LoadingBlock />;

  const columns = [
    t("adm.colName"),
    t("adm.colFunction"),
    t("adm.colStatus"),
    t("adm.colLastLogin"),
    t("adm.colActions"),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("adm.title")}
        subtitle={t("adm.subtitle")}
        action={
          <PrimaryButton onClick={openCreate}>
            <UserPlus size={15} />
            {t("adm.create")}
          </PrimaryButton>
        }
      />

      <div className="relative w-full sm:w-72">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("adm.searchPh")}
          aria-label={t("adm.searchPh")}
          className={`${inputClass} pl-9 py-2`}
        />
      </div>

      <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-b from-mist to-brand-soft/40 border-b-2 border-line">
              <tr>
                {columns.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-brand-deep uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((a) => {
                const isSelf = a.id === user?.id;
                const lastActive = !isSelf && a.status !== "inactif" && activeCount <= 1;
                return (
                  <tr key={a.id} className="hover:bg-mist/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                          {initials(a.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink flex items-center gap-2 flex-wrap">
                            {a.name}
                            {isSelf && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-brand bg-brand-soft px-1.5 py-0.5 rounded">
                                {t("adm.you")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate2/80">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ink">{a.functionTitle || "—"}</p>
                      {a.institution && (
                        <p className="text-xs text-slate2/70 mt-0.5">{a.institution}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate2/70 font-mono whitespace-nowrap">
                      {a.lastLoginAt ? formatDate(a.lastLoginAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setResetting(a)}
                          disabled={isSelf}
                          className="p-1.5 rounded-lg text-gold hover:bg-gold-soft hover:brightness-90 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                          title={isSelf ? t("adm.resetSelf") : t("adm.resetPwd")}
                          aria-label={t("adm.resetPwd")}
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors"
                          title={t("common.edit")}
                          aria-label={t("common.edit")}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(a)}
                          disabled={isSelf || lastActive}
                          className="p-1.5 rounded-lg text-danger/80 hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-danger/80"
                          title={
                            isSelf
                              ? t("adm.deleteSelf")
                              : lastActive
                                ? t("adm.lastAdmin")
                                : t("common.delete")
                          }
                          aria-label={t("common.delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Shield size={32} />}
              message={search ? t("adm.emptySearch") : t("adm.empty")}
            />
          )}
        </div>
        <div className="px-4 py-3 border-t border-line-soft">
          <p className="text-xs text-slate2/70">{t("adm.shown", { n: filtered.length })}</p>
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === "create" ? t("adm.createTitle") : t("adm.editTitle")}
          subtitle={modal === "create" ? t("adm.createSubtitle") : editing?.email}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label={t("adm.fullName")} required>
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("adm.fullNamePh")}
                className={inputClass}
              />
            </Field>
            <Field label={t("adm.email")} required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("adm.emailPh")}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("adm.function")} hint={t("common.optional")}>
                <input
                  value={form.functionTitle}
                  onChange={(e) => setForm({ ...form, functionTitle: e.target.value })}
                  placeholder={t("adm.functionPh")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("adm.institution")} hint={t("common.optional")}>
                <input
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder={t("adm.institutionPh")}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={t("adm.status")}>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                disabled={editing?.id === user?.id}
                className={inputClass}
              >
                <option value="actif">{t("status.actif")}</option>
                <option value="en-attente">{t("status.en-attente")}</option>
                <option value="inactif">{t("status.inactif")}</option>
              </select>
            </Field>
            {editing?.id === user?.id && (
              <p className="text-xs text-slate2/70">{t("adm.statusSelfHint")}</p>
            )}

            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" className="flex-1" onClick={() => setModal(null)}>
                {t("common.cancel")}
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1" disabled={busy}>
                <Mail size={14} />
                {busy
                  ? t("common.saving")
                  : modal === "create"
                    ? t("adm.createBtn")
                    : t("common.save")}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

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
            <p className="text-xs text-slate2">{t("adm.tempNote")}</p>
            <PrimaryButton
              className="w-full"
              onClick={async () => {
                const ok = await copyToClipboard(
                  t("part.copyText", {
                    platform: settings.platform_name,
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
          title={t("adm.deleteTitle")}
          message={t("adm.deleteMsg", { name: deleting.name, email: deleting.email })}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title={t("adm.resetTitle")}
          message={t("adm.resetMsg", { name: resetting.name })}
          confirmLabel={t("part.resetConfirm")}
          onConfirm={handleResetPassword}
          onCancel={() => setResetting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

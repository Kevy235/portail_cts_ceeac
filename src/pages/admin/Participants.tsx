import { useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  CalendarCheck,
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
import {
  COUNTRIES,
  type CtsSession,
  type ParticipantKind,
  type User,
  type UserStatus,
} from "@/lib/types";
import { CountryFlag } from "@/components/CountryFlag";
import { useApiResource } from "@/lib/useApiResource";
import { formatDate, initials } from "@/lib/format";
import { useI18n } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
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
  kind: ParticipantKind;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  country: "",
  functionTitle: "",
  institution: "",
  status: "en-attente",
  kind: "member_state",
};

function MeetingAccessFields({
  sessions,
  selectedIds,
  allSelected,
  onToggleAll,
  onChangeIds,
}: {
  sessions: CtsSession[];
  selectedIds: string[];
  allSelected: boolean;
  onToggleAll: (value: boolean) => void;
  onChangeIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">{t("part.meetingsLabel")}</p>
      <p className="text-xs text-slate2">{t("part.meetingsHelp")}</p>
      <label className="flex items-start gap-2.5 text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 accent-brand"
          checked={allSelected}
          onChange={(e) => onToggleAll(e.target.checked)}
        />
        <span>
          <span className="font-medium">{t("part.accessAll")}</span>
          <span className="block text-[11px] text-slate2/80">{t("part.accessAllHint")}</span>
        </span>
      </label>
      {sessions.length === 0 ? (
        <p className="text-sm text-slate2/80">{t("part.accessEmptyList")}</p>
      ) : (
        <div
          className={clsx(
            "max-h-56 overflow-y-auto divide-y divide-line-soft border border-line-soft rounded-lg",
            allSelected && "opacity-50 pointer-events-none"
          )}
        >
          {sessions.map((session) => (
            <label
              key={session.id}
              className="flex items-start gap-3 px-3 py-2.5 hover:bg-mist/60 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-brand"
                checked={allSelected || selectedIds.includes(session.id)}
                onChange={(e) =>
                  onChangeIds((ids) =>
                    e.target.checked ? [...ids, session.id] : ids.filter((id) => id !== session.id)
                  )
                }
              />
              <span className="min-w-0">
                <span className="block text-sm text-ink">{session.title}</span>
                <span className="block text-[11px] text-slate2/70 font-mono">
                  {session.reference}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminParticipants() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const resource = useApiResource<{ participants: User[] }>("/participants");
  const sessionsResource = useApiResource<{ sessions: CtsSession[] }>("/sessions");
  const allSessions = sessionsResource.data?.sessions ?? [];
  const participants = resource.data?.participants ?? null;
  const load = resource.reload;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"tous" | UserStatus>("tous");
  const [kindFilter, setKindFilter] = useState<"tous" | ParticipantKind>("tous");
  const [countryFilter, setCountryFilter] = useState("tous");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  // Gestion des accès par réunion : le participant ne voit que les documents
  // des réunions cochées.
  const [access, setAccess] = useState<User | null>(null);
  const [accessIds, setAccessIds] = useState<string[]>([]);
  const [accessAll, setAccessAll] = useState(false);
  const [formIds, setFormIds] = useState<string[]>([]);
  const [formAll, setFormAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

  const filtered = useMemo(() => {
    if (!participants) return [];
    const q = search.toLowerCase();
    return participants.filter(
      (p) =>
        (statusFilter === "tous" || p.status === statusFilter) &&
        (kindFilter === "tous" || (p.kind ?? "member_state") === kindFilter) &&
        (countryFilter === "tous" || p.country === countryFilter) &&
        (p.name.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.functionTitle.toLowerCase().includes(q) ||
          p.institution.toLowerCase().includes(q))
    );
  }, [participants, search, statusFilter, kindFilter, countryFilter]);

  // Pays réellement présents dans la liste (filtre pertinent).
  const presentCountries = useMemo(() => {
    const set = new Set((participants ?? []).map((p) => p.country).filter(Boolean));
    return COUNTRIES.filter((c) => set.has(c));
  }, [participants]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormIds([]);
    setFormAll(false);
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
      kind: p.kind ?? "member_state",
    });
    setFormIds((p.sessionAccess ?? []).map((a) => a.id));
    setFormAll(Boolean(p.allSessions));
    setEditing(p);
    setModal("edit");
  };

  const setKind = (kind: ParticipantKind) => {
    setForm((f) => ({
      ...f,
      kind,
      institution:
        kind === "commission" && !f.institution.trim()
          ? t("part.commissionInstitution")
          : f.institution,
    }));
    if (kind === "member_state") setFormAll(false);
  };

  const openAccess = (p: User) => {
    setAccessIds((p.sessionAccess ?? []).map((a) => a.id));
    setAccessAll(Boolean(p.allSessions));
    setAccess(p);
  };

  const handleSaveAccess = async () => {
    if (!access || busy) return;
    setBusy(true);
    try {
      await api.put(`/participants/${access.id}/access`, {
        sessionIds: accessAll ? [] : accessIds,
        allSessions: accessAll,
      });
      toast.success(t("part.accessSaved"));
      setAccess(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("part.opFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.kind === "commission" && !formAll && formIds.length === 0) {
      toast.error(t("part.meetingsRequired"));
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      ...(form.kind === "commission"
        ? { allSessions: formAll, sessionIds: formAll ? [] : formIds }
        : {}),
    };
    try {
      if (modal === "create") {
        const { temporaryPassword } = await api.post<{
          participant: User;
          temporaryPassword: string;
        }>("/participants", payload);
        setTempPassword({ email: form.email, password: temporaryPassword });
        toast.success(t("part.created"));
      } else if (editing) {
        await api.put(`/participants/${editing.id}`, payload);
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

      {/* ─── Recherche + filtres (statut, pays) ─────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("part.searchPh")}
            aria-label={t("part.searchPh")}
            className={`${inputClass} pl-9 py-2`}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { key: "tous", label: t("part.allKinds") },
              { key: "member_state", label: t("part.kind.member") },
              { key: "commission", label: t("part.kind.commission") },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setKindFilter(key)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                kindFilter === key
                  ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                  : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { key: "tous", label: t("part.allStatuses") },
              { key: "actif", label: t("status.actif") },
              { key: "en-attente", label: t("status.en-attente") },
              { key: "inactif", label: t("status.inactif") },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                statusFilter === key
                  ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                  : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          {countryFilter !== "tous" && (
            <CountryFlag
              country={countryFilter}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          )}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label={t("part.allCountries")}
            className={`${inputClass} py-2 w-auto ${countryFilter !== "tous" ? "pl-9" : ""}`}
          >
            <option value="tous">{t("part.allCountries")}</option>
            {presentCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-mist/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                        {initials(p.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink flex items-center gap-2 flex-wrap">
                          {p.name}
                          <span
                            className={clsx(
                              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
                              (p.kind ?? "member_state") === "commission"
                                ? "text-accent-dark bg-accent-soft"
                                : "text-brand bg-brand-soft"
                            )}
                          >
                            {(p.kind ?? "member_state") === "commission"
                              ? t("part.kind.commissionShort")
                              : t("part.kind.memberShort")}
                          </span>
                        </p>
                        <p className="text-xs text-slate2/80">{p.email}</p>
                        {p.originSessionTitle && (
                          <p className="text-[11px] text-accent-dark mt-0.5">
                            {t("part.viaSession", { title: p.originSessionTitle })}
                          </p>
                        )}
                        <p className="text-[11px] text-slate2/80 mt-0.5 flex items-center gap-1">
                          <CalendarCheck size={10} className="text-brand" aria-hidden />
                          {p.allSessions
                            ? t("part.accessAll")
                            : p.sessionAccess && p.sessionAccess.length > 0
                              ? t("part.accessCount", { n: p.sessionAccess.length })
                              : t("part.accessNone")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.country ? (
                      <span className="flex items-center gap-2 text-sm text-ink whitespace-nowrap">
                        <CountryFlag country={p.country} />
                        {p.country}
                      </span>
                    ) : (
                      <span className="text-sm text-slate2/70">
                        {(p.kind ?? "member_state") === "commission"
                          ? t("part.kind.commissionShort")
                          : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-ink">{p.functionTitle || "—"}</p>
                    {p.institution && (
                      <p className="text-xs text-slate2/70 mt-0.5">{p.institution}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 font-mono whitespace-nowrap">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAccess(p)}
                        className="p-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors"
                        title={t("part.accessBtn")}
                        aria-label={t("part.accessBtn")}
                      >
                        <CalendarCheck size={14} />
                      </button>
                      <button
                        onClick={() => setResetting(p)}
                        className="p-1.5 rounded-lg text-gold hover:bg-gold-soft hover:brightness-90 transition-all"
                        title={t("part.resetPwd")}
                        aria-label={t("part.resetPwd")}
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors"
                        title={t("common.edit")}
                        aria-label={t("common.edit")}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="p-1.5 rounded-lg text-danger/80 hover:text-danger hover:bg-danger-soft transition-colors"
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
          wide
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <fieldset>
              <legend className="block text-sm font-semibold text-ink mb-2">
                {t("part.kind.label")}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { key: "member_state" as const, title: t("part.kind.member"), hint: t("part.kind.memberHint") },
                    { key: "commission" as const, title: t("part.kind.commission"), hint: t("part.kind.commissionHint") },
                  ]
                ).map(({ key, title, hint }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKind(key)}
                    aria-pressed={form.kind === key}
                    className={clsx(
                      "text-left rounded-lg border px-3 py-2.5 transition-all",
                      form.kind === key
                        ? "border-brand bg-brand-soft/70 shadow-sm"
                        : "border-line-soft bg-white hover:border-brand/40"
                    )}
                  >
                    <span className="block text-sm font-semibold text-ink">{title}</span>
                    <span className="block text-[11px] text-slate2/80 mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("part.country")}
                required={form.kind === "member_state"}
                hint={form.kind === "commission" ? t("common.optional") : undefined}
              >
                <div className="relative">
                  {form.country && (
                    <CountryFlag
                      country={form.country}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  )}
                  <select
                    required={form.kind === "member_state"}
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className={`${inputClass} ${form.country ? "pl-9" : ""}`}
                  >
                    <option value="">{t("common.select")}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label={t("part.function")} hint={t("common.optional")}>
                <input
                  value={form.functionTitle}
                  onChange={(e) => setForm({ ...form, functionTitle: e.target.value })}
                  placeholder={t("part.functionPh")}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {form.kind === "commission" && (
              <MeetingAccessFields
                sessions={allSessions}
                selectedIds={formIds}
                allSelected={formAll}
                onToggleAll={setFormAll}
                onChangeIds={setFormIds}
              />
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

      {/* ─── Accès aux réunions ────────────────────────────────────── */}
      {access && (
        <Modal
          title={t("part.accessTitle")}
          subtitle={`${access.name} — ${access.email}`}
          onClose={() => setAccess(null)}
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate2">{t("part.accessSubtitle")}</p>
            {(access.kind ?? "member_state") === "commission" ? (
              <MeetingAccessFields
                sessions={allSessions}
                selectedIds={accessIds}
                allSelected={accessAll}
                onToggleAll={setAccessAll}
                onChangeIds={setAccessIds}
              />
            ) : allSessions.length === 0 ? (
              <p className="text-sm text-slate2/80">{t("part.accessEmptyList")}</p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-line-soft border border-line-soft rounded-lg">
                {allSessions.map((session) => (
                  <label
                    key={session.id}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-mist/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-brand"
                      checked={accessIds.includes(session.id)}
                      onChange={(e) =>
                        setAccessIds((ids) =>
                          e.target.checked
                            ? [...ids, session.id]
                            : ids.filter((id) => id !== session.id)
                        )
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">{session.title}</span>
                      <span className="block text-[11px] text-slate2/70 font-mono">
                        {session.reference}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" className="flex-1" onClick={() => setAccess(null)}>
                {t("common.cancel")}
              </SecondaryButton>
              <PrimaryButton type="button" className="flex-1" disabled={busy} onClick={handleSaveAccess}>
                <CalendarCheck size={14} />
                {busy ? t("common.saving") : t("common.save")}
              </PrimaryButton>
            </div>
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

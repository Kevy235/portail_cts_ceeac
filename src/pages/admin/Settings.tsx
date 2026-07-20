import { useEffect, useRef, useState } from "react";
import { BookOpen, FileDown, KeyRound, Landmark, LogIn, Mail, Plus, Save, Tag, Trash2, UserCog } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, GuideFile, User } from "@/lib/types";
import { formatSize } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import {
  ConfirmDialog,
  ErrorBlock,
  Field,
  FlagIcon,
  inputClass,
  LoadingBlock,
  PageHeader,
  PasswordInput,
  PrimaryButton,
} from "@/components/ui";

interface SettingField {
  key: string;
  labelKey: keyof Dict;
  textarea?: boolean;
}

/* Champs regroupés par zone du portail : chaque groupe correspond à un endroit
   visible de l'interface, pour que l'admin sache ce qu'il modifie. */
const GROUPS: {
  key: string;
  labelKey: keyof Dict;
  noteKey?: keyof Dict;
  icon: React.ReactNode;
  tile: string;
  fields: SettingField[];
}[] = [
  {
    key: "identity",
    labelKey: "set.groupIdentity",
    icon: <Landmark size={15} className="text-white" />,
    tile: "bg-gradient-to-br from-brand to-brand-deep",
    fields: [
      { key: "platform_name", labelKey: "set.platform_name" },
      { key: "platform_subtitle", labelKey: "set.platform_subtitle" },
      { key: "org_full_name", labelKey: "set.org_full_name", textarea: true },
    ],
  },
  {
    key: "login",
    labelKey: "set.groupLogin",
    icon: <LogIn size={15} className="text-white" />,
    tile: "bg-gradient-to-br from-accent to-accent-dark",
    fields: [
      { key: "org_description", labelKey: "set.org_description", textarea: true },
      { key: "login_notice", labelKey: "set.login_notice" },
    ],
  },
  {
    key: "participant",
    labelKey: "set.groupParticipant",
    noteKey: "set.participantNote",
    icon: <BookOpen size={15} className="text-white" />,
    tile: "bg-gradient-to-br from-violet-500 to-violet-700",
    fields: [
      { key: "nav_library", labelKey: "set.nav_library" },
      { key: "nav_psessions", labelKey: "set.nav_psessions" },
      { key: "nav_profile", labelKey: "set.nav_profile" },
      { key: "library_title", labelKey: "set.library_title" },
      { key: "library_notice", labelKey: "set.library_notice" },
    ],
  },
  {
    key: "footer",
    labelKey: "set.groupFooter",
    icon: <Mail size={15} className="text-white" />,
    tile: "bg-gradient-to-br from-gold to-amber-600",
    fields: [
      { key: "contact_email", labelKey: "set.contact_email" },
      { key: "footer_text", labelKey: "set.footer_text" },
    ],
  },
];

type AllSettings = Record<Lang, Record<string, string>>;

export function AdminSettings() {
  const { refresh } = useSettings();
  const { user, setUser } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState<AllSettings | null>(null);
  const [editLang, setEditLang] = useState<Lang>("fr");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [catBusy, setCatBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Guide utilisateur téléchargeable (un fichier par langue) ────────
  const [guides, setGuides] = useState<GuideFile[]>([]);
  const [guidePercent, setGuidePercent] = useState<number | null>(null);
  const [guideUploadingLang, setGuideUploadingLang] = useState<Lang | null>(null);
  const [deletingGuide, setDeletingGuide] = useState<Lang | null>(null);
  const [guideBusy, setGuideBusy] = useState(false);
  const guideInputs = useRef<Partial<Record<Lang, HTMLInputElement | null>>>({});

  // ─── Mon compte (nom d'utilisateur, e-mail, mot de passe) ───────────
  const [accountName, setAccountName] = useState(user?.name ?? "");
  const [accountEmail, setAccountEmail] = useState(user?.email ?? "");
  const [accountBusy, setAccountBusy] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const load = () => {
    setLoadError(null);
    return Promise.all([
      api.get<{ settings: AllSettings }>("/settings/admin"),
      api.get<{ categories: Category[] }>("/categories"),
      api.get<{ guides: GuideFile[] }>("/guide"),
    ])
      .then(([s, c, g]) => {
        setForm(s.settings);
        setCategories(c.categories);
        setGuides(g.guides);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : String(err))
      );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || busy) return;
    setBusy(true);
    try {
      await api.put("/settings/admin", { settings: form });
      await refresh();
      toast.success(t("set.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("set.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name || catBusy) return;
    setCatBusy(true);
    try {
      const { category } = await api.post<{ category: Category }>("/categories", { name });
      setCategories((prev) => [...prev, category]);
      setNewCategory("");
      toast.success(t("set.catAdded", { name: category.name }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("set.catAddFailed"));
    } finally {
      setCatBusy(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountBusy) return;
    setAccountBusy(true);
    try {
      const { user: updated } = await api.put<{ user: User }>("/auth/me", {
        name: accountName,
        email: accountEmail,
      });
      setUser(updated);
      toast.success(t("account.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setAccountBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdBusy) return;
    if (pwdNew !== pwdConfirm) {
      toast.error(t("pwd.mismatch"));
      return;
    }
    setPwdBusy(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      toast.success(t("pwd.updated"));
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("pwd.updateFailed"));
    } finally {
      setPwdBusy(false);
    }
  };

  // Ajout ou remplacement du guide d'une langue (avec progression d'envoi)
  const uploadGuide = async (lang: Lang, file: File | undefined) => {
    if (!file || guideBusy) return;
    setGuideBusy(true);
    setGuideUploadingLang(lang);
    setGuidePercent(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { guides: updated } = await api.putFormWithProgress<{ guides: GuideFile[] }>(
        `/guide/${lang}`,
        fd,
        setGuidePercent
      );
      setGuides(updated);
      toast.success(t("set.guideUpdated", { lang: LANG_LABELS[lang] }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setGuideBusy(false);
      setGuideUploadingLang(null);
      setGuidePercent(null);
    }
  };

  const handleDeleteGuide = async () => {
    if (!deletingGuide || guideBusy) return;
    setGuideBusy(true);
    try {
      const { guides: updated } = await api.delete<{ guides: GuideFile[] }>(
        `/guide/${deletingGuide}`
      );
      setGuides(updated);
      toast.success(t("set.guideDeleted"));
      setDeletingGuide(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setGuideBusy(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory || catBusy) return;
    setCatBusy(true);
    try {
      await api.delete(`/categories/${deletingCategory.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      toast.success(t("set.catDeleted"));
      setDeletingCategory(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setCatBusy(false);
    }
  };

  if (loadError && !form) return <ErrorBlock message={loadError} onRetry={load} />;
  if (!form) return <LoadingBlock />;

  const values = form[editLang] ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title={t("set.title")} subtitle={t("set.subtitle")} />

      <div className="grid gap-6 items-start xl:grid-cols-5">
      <form onSubmit={handleSave} className="xl:col-span-3 bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden">
        {/* Onglets de langue (avec drapeaux) */}
        <div className="flex border-b border-line-soft bg-mist/60">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setEditLang(l)}
              aria-pressed={editLang === l}
              className={clsx(
                "flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium transition-colors border-b-[3px] -mb-px",
                editLang === l
                  ? "border-brand text-brand-dark bg-white font-bold"
                  : "border-transparent text-slate2 hover:text-ink hover:bg-white/60"
              )}
            >
              <FlagIcon lang={l} />
              <span className="uppercase font-bold">{l}</span>
              <span className="hidden sm:inline font-normal">{LANG_LABELS[l]}</span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate2 bg-brand-soft/60 border border-brand/15 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <FlagIcon lang={editLang} />
            {t("set.langNote", { lang: LANG_LABELS[editLang] })}
          </p>

          {GROUPS.map(({ key: groupKey, labelKey, noteKey, icon, tile, fields }) => (
            <fieldset
              key={`${editLang}-${groupKey}`}
              className="rounded-xl border border-line-soft bg-mist/40 p-4 space-y-4"
            >
              <legend className="flex items-center gap-2.5 px-1 -ml-1">
                <span
                  className={`w-7 h-7 rounded-lg ${tile} shadow-sm flex items-center justify-center`}
                  aria-hidden
                >
                  {icon}
                </span>
                <span className="text-sm font-bold text-ink">{t(labelKey)}</span>
              </legend>
              {noteKey && <p className="text-[11px] text-slate2/80 -mt-1">{t(noteKey)}</p>}
              {fields.map(({ key, labelKey: fieldLabelKey, textarea }) => (
                <Field key={`${editLang}-${key}`} label={t(fieldLabelKey)}>
                  {textarea ? (
                    <textarea
                      rows={2}
                      value={values[key] ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [editLang]: { ...values, [key]: e.target.value },
                        })
                      }
                      className={inputClass}
                    />
                  ) : (
                    <input
                      value={values[key] ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [editLang]: { ...values, [key]: e.target.value },
                        })
                      }
                      className={inputClass}
                    />
                  )}
                </Field>
              ))}
            </fieldset>
          ))}

          <div className="pt-1">
            <PrimaryButton type="submit" disabled={busy} className="w-full sm:w-auto">
              <Save size={14} />
              {busy ? t("common.saving") : t("set.saveBtn")}
            </PrimaryButton>
          </div>
        </div>
      </form>

      <div className="xl:col-span-2 space-y-6">
        {/* ─── Mon compte administrateur ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-line-soft shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-deep shadow-sm flex items-center justify-center"
              aria-hidden
            >
              <UserCog size={15} className="text-white" />
            </span>
            <h3 className="text-sm font-bold text-ink">{t("account.title")}</h3>
          </div>
          <p className="text-xs text-slate2 mb-4">{t("account.hint")}</p>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <Field label={t("account.nameLbl")} required>
              <input
                required
                minLength={2}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                autoComplete="name"
                className={inputClass}
              />
            </Field>
            <Field label={t("prof.email")} required>
              <input
                required
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                autoComplete="email"
                className={inputClass}
              />
            </Field>
            <PrimaryButton type="submit" disabled={accountBusy}>
              <Save size={14} />
              {accountBusy ? t("common.saving") : t("common.save")}
            </PrimaryButton>
          </form>

          <div className="border-t border-line-soft mt-5 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={15} className="text-brand" aria-hidden />
              <h4 className="text-sm font-semibold text-ink">{t("prof.changePwd")}</h4>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Field label={t("pwd.current")} required>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("pwd.new")} required>
                  <PasswordInput
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                  />
                </Field>
                <Field label={t("pwd.confirm")} required>
                  <PasswordInput
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={pwdConfirm}
                    onChange={(e) => setPwdConfirm(e.target.value)}
                  />
                </Field>
              </div>
              <PrimaryButton type="submit" disabled={pwdBusy}>
                {pwdBusy ? t("common.saving") : t("prof.update")}
              </PrimaryButton>
            </form>
          </div>
        </div>

        {/* ─── Catégories de documents ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-line-soft shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={15} className="text-brand" />
          <h3 className="text-sm font-semibold text-ink">{t("set.catTitle")}</h3>
        </div>
        <p className="text-xs text-slate2 mb-4">{t("set.catNote")}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 bg-brand-soft text-brand-dark text-xs px-2.5 py-1.5 rounded-lg"
            >
              {c.name}
              <button
                onClick={() => setDeletingCategory(c)}
                className="text-brand-dark/50 hover:text-danger transition-colors"
                title={`${t("common.delete")} ${c.name}`}
                aria-label={`${t("common.delete")} ${c.name}`}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 max-w-sm">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder={t("set.catPh")}
            className={`${inputClass} py-2`}
          />
          <button
            onClick={handleAddCategory}
            disabled={catBusy}
            className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            <Plus size={13} />
            {t("common.add")}
          </button>
        </div>
        </div>

        {/* ─── Guide utilisateur téléchargeable ───────────────────────── */}
        <div className="bg-white rounded-xl border border-line-soft shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileDown size={15} className="text-brand" aria-hidden />
            <h3 className="text-sm font-semibold text-ink">{t("set.guideTitle")}</h3>
          </div>
          <p className="text-xs text-slate2 mb-4">{t("set.guideNote")}</p>

          <div className="space-y-2">
            {LANGS.map((lang) => {
              const existing = guides.find((g) => g.lang === lang);
              const uploading = guideUploadingLang === lang;
              return (
                <div
                  key={lang}
                  className="flex items-center gap-3 border border-line-soft rounded-lg px-3 py-2.5"
                >
                  <FlagIcon lang={lang} />
                  <span className="text-xs font-bold uppercase w-6 flex-shrink-0">{lang}</span>
                  <div className="flex-1 min-w-0">
                    {uploading && guidePercent !== null ? (
                      <div aria-live="polite">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate2">{t("docs.uploading")}</span>
                          <span className="text-[11px] font-mono font-semibold text-brand tabular-nums">
                            {guidePercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-mist rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full transition-[width] duration-200 ease-out"
                            style={{ width: `${guidePercent}%` }}
                          />
                        </div>
                      </div>
                    ) : existing ? (
                      <p className="text-xs text-ink truncate">
                        {existing.fileName}{" "}
                        <span className="text-slate2/60">({formatSize(existing.fileSize)})</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate2/50">{t("docs.noFile")}</p>
                    )}
                  </div>
                  <input
                    ref={(el) => {
                      guideInputs.current[lang] = el;
                    }}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      uploadGuide(lang, f);
                    }}
                  />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={guideBusy}
                      onClick={() => guideInputs.current[lang]?.click()}
                      className="text-xs text-brand hover:underline px-2 py-1 disabled:opacity-50"
                    >
                      {existing ? t("docs.replaceFile") : t("docs.chooseFile")}
                    </button>
                    {existing && (
                      <button
                        type="button"
                        disabled={guideBusy}
                        onClick={() => setDeletingGuide(lang)}
                        className="p-1 text-slate2/50 hover:text-danger transition-colors disabled:opacity-50"
                        title={t("docs.deleteFile")}
                        aria-label={t("docs.deleteFile")}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {deletingCategory && (
        <ConfirmDialog
          title={t("set.catDeleteTitle")}
          message={t("set.catDeleteMsg", { name: deletingCategory.name })}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
          busy={catBusy}
        />
      )}

      {deletingGuide && (
        <ConfirmDialog
          title={t("set.guideDeleteTitle")}
          message={t("set.guideDeleteMsg", { lang: LANG_LABELS[deletingGuide] })}
          onConfirm={handleDeleteGuide}
          onCancel={() => setDeletingGuide(null)}
          busy={guideBusy}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Save, Tag, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { useSettings } from "@/context/SettingsContext";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import {
  ConfirmDialog,
  ErrorBlock,
  Field,
  inputClass,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
} from "@/components/ui";

const FIELDS: { key: string; labelKey: keyof Dict; textarea?: boolean }[] = [
  { key: "platform_name", labelKey: "set.platform_name" },
  { key: "platform_subtitle", labelKey: "set.platform_subtitle" },
  { key: "org_full_name", labelKey: "set.org_full_name", textarea: true },
  { key: "org_description", labelKey: "set.org_description", textarea: true },
  { key: "login_notice", labelKey: "set.login_notice" },
  { key: "contact_email", labelKey: "set.contact_email" },
  { key: "footer_text", labelKey: "set.footer_text" },
];

type AllSettings = Record<Lang, Record<string, string>>;

export function AdminSettings() {
  const { refresh } = useSettings();
  const { t } = useI18n();
  const [form, setForm] = useState<AllSettings | null>(null);
  const [editLang, setEditLang] = useState<Lang>("fr");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [catBusy, setCatBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoadError(null);
    return Promise.all([
      api.get<{ settings: AllSettings }>("/settings/admin"),
      api.get<{ categories: Category[] }>("/categories"),
    ])
      .then(([s, c]) => {
        setForm(s.settings);
        setCategories(c.categories);
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
      <form onSubmit={handleSave} className="xl:col-span-3 bg-white rounded-xl border border-line-soft overflow-hidden">
        {/* Onglets de langue */}
        <div className="flex border-b border-line-soft bg-mist/60">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setEditLang(l)}
              className={clsx(
                "px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px",
                editLang === l
                  ? "border-brand text-brand bg-white"
                  : "border-transparent text-slate2 hover:text-ink"
              )}
            >
              <span className="uppercase font-bold mr-1.5">{l}</span>
              <span className="hidden sm:inline">{LANG_LABELS[l]}</span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          <p className="text-[11px] text-slate2/70 bg-mist rounded-lg px-3 py-2">
            {t("set.langNote", { lang: LANG_LABELS[editLang] })}
          </p>
          {FIELDS.map(({ key, labelKey, textarea }) => (
            <Field key={`${editLang}-${key}`} label={t(labelKey)}>
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
          <div className="pt-1">
            <PrimaryButton type="submit" disabled={busy}>
              <Save size={14} />
              {busy ? t("common.saving") : t("set.saveBtn")}
            </PrimaryButton>
          </div>
        </div>
      </form>

      <div className="xl:col-span-2 bg-white rounded-xl border border-line-soft p-6">
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
    </div>
  );
}

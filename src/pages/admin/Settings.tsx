import { useEffect, useState } from "react";
import { Plus, Save, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, Settings } from "@/lib/types";
import { useSettings } from "@/context/SettingsContext";
import {
  ConfirmDialog,
  Field,
  inputClass,
  LoadingBlock,
  PrimaryButton,
} from "@/components/ui";

const FIELDS: { key: string; label: string; textarea?: boolean }[] = [
  { key: "platform_name", label: "Nom de la plateforme (en-tête)" },
  { key: "platform_subtitle", label: "Sous-titre de la plateforme" },
  { key: "org_full_name", label: "Nom complet de l'organisation", textarea: true },
  { key: "org_description", label: "Description (page de connexion)", textarea: true },
  { key: "login_notice", label: "Message de la page de connexion" },
  { key: "contact_email", label: "E-mail de contact du Secrétariat" },
  { key: "footer_text", label: "Texte de pied de page" },
];

export function AdminSettings() {
  const { refresh } = useSettings();
  const [form, setForm] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ settings: Settings }>("/settings/admin"),
      api.get<{ categories: Category[] }>("/categories"),
    ])
      .then(([s, c]) => {
        setForm(s.settings);
        setCategories(c.categories);
      })
      .catch((err) => toast.error(err.message));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      await api.put("/settings/admin", { settings: form });
      await refresh();
      toast.success("Contenus du portail mis à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const { category } = await api.post<{ category: Category }>("/categories", { name });
      setCategories((prev) => [...prev, category]);
      setNewCategory("");
      toast.success(`Catégorie « ${category.name} » ajoutée`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ajout impossible");
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await api.delete(`/categories/${deletingCategory.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      toast.success("Catégorie supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeletingCategory(null);
    }
  };

  if (!form) return <LoadingBlock label="Chargement des paramètres…" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-ink text-xl font-bold font-title">Contenus du portail</h2>
        <p className="text-slate2 text-sm mt-0.5">
          Textes affichés sur la page de connexion, l'en-tête et le pied de page
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-line-soft p-6 space-y-4">
        {FIELDS.map(({ key, label, textarea }) => (
          <Field key={key} label={label}>
            {textarea ? (
              <textarea
                rows={2}
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputClass}
              />
            ) : (
              <input
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
        ))}
        <div className="pt-1">
          <PrimaryButton type="submit" disabled={busy}>
            <Save size={14} />
            {busy ? "Enregistrement…" : "Enregistrer les contenus"}
          </PrimaryButton>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-line-soft p-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={15} className="text-brand" />
          <h3 className="text-sm font-semibold text-ink">Catégories de documents</h3>
        </div>
        <p className="text-xs text-slate2 mb-4">
          Les catégories organisent la bibliothèque documentaire. La suppression d'une catégorie ne
          supprime pas les documents associés.
        </p>

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
                title={`Supprimer ${c.name}`}
                aria-label={`Supprimer ${c.name}`}
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
            placeholder="Nouvelle catégorie…"
            className={`${inputClass} py-2`}
          />
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-dark transition-colors"
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>
      </div>

      {deletingCategory && (
        <ConfirmDialog
          title="Supprimer la catégorie"
          message={`La catégorie « ${deletingCategory.name} » sera supprimée. Les documents associés resteront disponibles sans catégorie.`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}

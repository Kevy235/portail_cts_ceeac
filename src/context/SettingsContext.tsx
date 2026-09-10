import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { useI18n } from "@/i18n";

const DEFAULTS: Settings = {
  platform_name: "PDRS-CEEAC",
  platform_subtitle: "Portail Documentaire des Réunions Statutaires de la CEEAC",
  org_full_name: "Communauté Économique des États de l'Afrique Centrale",
  org_description:
    "Accès sécurisé aux documents officiels des réunions statutaires de la CEEAC",
  contact_email: "dapps@ceeac-eccas.org",
  footer_text: "© 2026 PDRS-CEEAC · Communauté Économique des États de l'Afrique Centrale",
  login_notice: "Accès réservé aux experts accrédités et aux administrateurs",
};

interface SettingsContextValue {
  settings: Settings;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  const refresh = useCallback(async () => {
    try {
      const { settings } = await api.get<{ settings: Settings }>(
        `/settings?lang=${lang}`
      );
      setSettings({ ...DEFAULTS, ...settings });
    } catch {
      /* les valeurs par défaut restent affichées */
    }
  }, [lang]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const name = settings.platform_name?.trim();
    const sub = settings.platform_subtitle?.trim();
    document.title = name && sub ? `${name} — ${sub}` : name || sub || "PDRS-CEEAC";
  }, [settings.platform_name, settings.platform_subtitle]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

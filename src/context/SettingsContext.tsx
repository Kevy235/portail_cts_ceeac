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
  platform_name: "CEEAC · Réunions statutaires",
  platform_subtitle: "Portail documentaire",
  org_full_name: "Communauté Économique des États de l'Afrique Centrale",
  org_description:
    "Plateforme d'accès aux documents des réunions statutaires de la CEEAC",
  contact_email: "dapps@ceeac-eccas.org",
  footer_text: "© 2026 CEEAC-ECCAS · Réunions statutaires",
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

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

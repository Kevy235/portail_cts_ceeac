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
  platform_name: "CEEAC · CTS-DSS",
  platform_subtitle: "Plateforme CTS-DSS",
  org_full_name:
    "Comité Technique Spécialisé Défense, Sûreté et Sécurité",
  org_description:
    "Plateforme d'accès aux documents et ressources du CTS-DSS — CEEAC",
  contact_email: "dapps@ceeac-eccas.org",
  footer_text:
    "© 2025 CEEAC-ECCAS · Comité Technique Spécialisé Défense, Sûreté et Sécurité",
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

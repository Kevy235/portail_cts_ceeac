import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fr, type Dict } from "./fr";
import { en } from "./en";
import { pt } from "./pt";
import { es } from "./es";
import { setFormatLocale } from "@/lib/format";

export const LANGS = ["fr", "en", "pt", "es"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  pt: "Português",
  es: "Español",
};

const DICTS: Record<Lang, Dict> = { fr, en, pt, es };

const STORAGE_KEY = "cts_lang";

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

function initialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isLang(stored)) return stored;
  const nav = navigator.language.slice(0, 2);
  return isLang(nav) ? nav : "fr";
}

export type TFunc = (key: keyof Dict, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = initialLang();
    setFormatLocale(l);
    return l;
  });

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setFormatLocale(l);
    document.documentElement.lang = l;
    setLangState(l);
  }, []);

  const t = useCallback<TFunc>(
    (key, vars) => {
      let text: string = DICTS[lang][key] ?? DICTS.fr[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return ctx;
}

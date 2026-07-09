import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface ApiResource<T> {
  data: T | null;
  loading: boolean;
  /** Message d'erreur si le chargement a échoué (état affichable, pas un toast). */
  error: string | null;
  /** Recharge la ressource (bouton « Réessayer », rafraîchissement après mutation). */
  reload: () => Promise<void>;
  /** Mise à jour optimiste locale après une mutation réussie. */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Chargement d'une ressource API avec gestion complète du cycle de vie :
 * chargement initial, état d'erreur persistant (avec réessai), rechargement.
 * Ignore les réponses arrivées après un démontage ou un changement de chemin.
 */
export function useApiResource<T>(path: string): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const gen = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path);
      if (gen !== generation.current) return;
      setData(result);
    } catch (err) {
      if (gen !== generation.current) return;
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      if (gen === generation.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
    return () => {
      // Invalide les réponses en vol au démontage.
      generation.current++;
    };
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

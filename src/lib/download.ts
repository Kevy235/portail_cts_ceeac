import { ApiError } from "@/lib/api";

/**
 * Récupère un fichier en flux continu et rapporte la progression (0-100).
 * `onProgress` reçoit -1 lorsque la taille totale est inconnue.
 * Utilisé par le téléchargement et par le lecteur intégré.
 */
export async function fetchWithProgress(
  url: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<{ blob: Blob; fileName: string | null }> {
  const res = await fetch(url, { credentials: "include", signal });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    let code: string | undefined;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
      if (data?.code) code = data.code;
    } catch {
      /* réponse non JSON */
    }
    throw new ApiError(res.status, message, code);
  }

  // Nom de fichier annoncé par le serveur (Content-Disposition).
  const disposition = res.headers.get("content-disposition") ?? "";
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const plainMatch = /filename="([^"]+)"/i.exec(disposition);
  const fileName = utf8Match ? decodeURIComponent(utf8Match[1]) : (plainMatch?.[1] ?? null);

  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body?.getReader();

  let blob: Blob;
  if (!reader) {
    onProgress(-1);
    blob = await res.blob();
  } else {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let loaded = 0;
    onProgress(total ? 0 : -1);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as Uint8Array<ArrayBuffer>);
      loaded += value.length;
      if (total) onProgress(Math.min(99, Math.round((loaded / total) * 100)));
    }
    blob = new Blob(chunks, {
      type: res.headers.get("content-type") ?? "application/octet-stream",
    });
  }
  onProgress(100);
  return { blob, fileName };
}

/**
 * Télécharge un fichier avec progression, puis l'enregistre via la boîte de
 * dialogue du navigateur.
 */
export async function downloadWithProgress(
  url: string,
  fallbackName: string,
  onProgress: (percent: number) => void
): Promise<void> {
  const { blob, fileName } = await fetchWithProgress(url, onProgress);

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

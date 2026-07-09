import { ApiError } from "@/lib/api";

/**
 * Télécharge un fichier en flux continu et rapporte la progression (0-100).
 * `onProgress` reçoit -1 lorsque la taille totale est inconnue.
 * Le fichier est ensuite enregistré via la boîte de dialogue du navigateur.
 */
export async function downloadWithProgress(
  url: string,
  fallbackName: string,
  onProgress: (percent: number) => void
): Promise<void> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* réponse non JSON */
    }
    throw new ApiError(res.status, message);
  }

  // Nom de fichier annoncé par le serveur (Content-Disposition), sinon repli.
  const disposition = res.headers.get("content-disposition") ?? "";
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const plainMatch = /filename="([^"]+)"/i.exec(disposition);
  const fileName = utf8Match
    ? decodeURIComponent(utf8Match[1])
    : (plainMatch?.[1] ?? fallbackName);

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

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

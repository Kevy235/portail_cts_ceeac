export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers:
      options.body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    ...options,
  });

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
  return res.json() as Promise<T>;
}

/**
 * Envoi d'un formulaire avec suivi de progression (0-100).
 * XMLHttpRequest est utilisé car fetch n'expose pas la progression d'envoi.
 */
function requestFormWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (percent: number) => void,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `/api${path}`);
    xhr.withCredentials = true;
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as T);
      } else {
        const data = xhr.response as { error?: string; code?: string } | null;
        reject(new ApiError(xhr.status, data?.error ?? `Erreur ${xhr.status}`, data?.code));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Connexion au serveur impossible"));
    xhr.send(form);
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  postFormWithProgress: <T>(
    path: string,
    form: FormData,
    onProgress: (percent: number) => void
  ) => requestFormWithProgress<T>(path, form, onProgress),
  putFormWithProgress: <T>(
    path: string,
    form: FormData,
    onProgress: (percent: number) => void
  ) => requestFormWithProgress<T>(path, form, onProgress, "PUT"),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

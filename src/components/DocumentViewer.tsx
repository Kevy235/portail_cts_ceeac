import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  FileWarning,
  KeyRound,
  LoaderCircle,
  Maximize,
  Minimize,
  RotateCw,
  Search,
  ShieldAlert,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { clsx } from "clsx";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ApiError } from "@/lib/api";
import { fetchWithProgress } from "@/lib/download";
import { formatSize } from "@/lib/format";
import { fileExt, loadPdfJs, viewerKind, type ViewerSource } from "@/lib/viewer";
import { LANG_LABELS, useI18n, type Lang } from "@/i18n";
import { DownloadButton } from "@/components/DownloadButton";
import { CodedBadge, FlagIcon, inputClass, PrimaryButton } from "@/components/ui";

/** 100 % = taille réelle : 1 pt PDF = 4/3 px CSS. */
const CSS_UNITS = 96 / 72;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const PAGE_GAP = 16;

type ZoomMode = "auto" | "width" | "page" | number;
type Phase =
  | { kind: "loading"; pct: number }
  | { kind: "ready" }
  | { kind: "error"; message?: string }
  | { kind: "password"; wrong: boolean };

interface DocInfo {
  pages: number;
  /** Dimensions de la première page à 100 %, en px CSS. */
  width: number;
  height: number;
}

interface EngineHandle {
  /** Numéros des pages (1…n) contenant la requête. */
  search: (query: string) => Promise<number[]>;
}

interface EngineProps {
  data: ArrayBuffer;
  scale: number;
  highlight: string;
  onReady: (info: DocInfo) => void;
  onError: () => void;
}

/** Conteneur défilant : racine des IntersectionObserver des pages. */
const ScrollRootContext = createContext<HTMLElement | null>(null);

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Recherche insensible à la casse et aux accents. */
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

/** Surligne les fragments de texte contenant la requête. */
function applyHighlight(root: HTMLElement | null, query: string) {
  if (!root) return;
  root.querySelectorAll(".viewer-hit").forEach((el) => el.classList.remove("viewer-hit"));
  const needle = normalize(query.trim());
  if (!needle) return;
  root.querySelectorAll<HTMLElement>("span").forEach((span) => {
    if (span.children.length === 0 && normalize(span.textContent ?? "").includes(needle)) {
      span.classList.add("viewer-hit");
    }
  });
}

/** Longueur CSS (« 612pt », « 816px ») convertie en px. */
function cssLengthPx(value: string | undefined): number | null {
  const n = parseFloat(value ?? "");
  if (!Number.isFinite(n) || n <= 0) return null;
  return value!.trim().endsWith("pt") ? n * CSS_UNITS : n;
}

// ─── Moteur PDF (pdf.js) ──────────────────────────────────────────────────────

function PdfPage({
  pdf,
  n,
  scale,
  rotation,
  base,
  highlight,
}: {
  pdf: PDFDocumentProxy;
  n: number;
  scale: number;
  rotation: number;
  base: { width: number; height: number };
  highlight: string;
}) {
  const root = useContext(ScrollRootContext);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(n <= 2);
  // Dimensions propres à la page (les pages d'un PDF peuvent différer).
  const [size, setSize] = useState(base);
  const highlightRef = useRef(highlight);
  highlightRef.current = highlight;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !root) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root,
      rootMargin: "1200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const textDiv = textRef.current;
    if (!canvas || !textDiv) return;
    if (!visible) {
      // Page éloignée : on libère la mémoire du canevas.
      canvas.width = 0;
      canvas.height = 0;
      textDiv.replaceChildren();
      return;
    }
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    let textLayer: { cancel: () => void } | null = null;

    (async () => {
      const page = await pdf.getPage(n);
      if (cancelled) return;
      const natural = page.getViewport({ scale: CSS_UNITS });
      setSize((s) =>
        s.width === natural.width && s.height === natural.height
          ? s
          : { width: natural.width, height: natural.height }
      );
      const viewport = page.getViewport({
        scale: scale * CSS_UNITS,
        rotation: (page.rotate + rotation) % 360,
      });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      renderTask = page.render({
        canvasContext: ctx,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      await renderTask.promise;
      if (cancelled) return;

      // Couche de texte : sélection, copie et surlignage de la recherche.
      const pdfjs = await loadPdfJs();
      if (cancelled) return;
      textDiv.replaceChildren();
      const layer = new pdfjs.TextLayer({
        textContentSource: page.streamTextContent(),
        container: textDiv,
        viewport,
      });
      textLayer = layer;
      await layer.render();
      if (!cancelled) applyHighlight(textDiv, highlightRef.current);
    })().catch(() => {
      /* rendu annulé (zoom, défilement) ou page illisible */
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
    };
  }, [pdf, n, scale, rotation, visible]);

  useEffect(() => {
    applyHighlight(textRef.current, highlight);
  }, [highlight]);

  const rotated = rotation % 180 !== 0;
  const w = Math.floor((rotated ? size.height : size.width) * scale);
  const h = Math.floor((rotated ? size.width : size.height) * scale);

  return (
    <div
      ref={wrapRef}
      data-page={n}
      className="pdf-page mx-auto"
      style={
        {
          width: w,
          height: h,
          "--scale-factor": scale * CSS_UNITS,
        } as React.CSSProperties
      }
    >
      <canvas ref={canvasRef} aria-hidden />
      <div ref={textRef} className="textLayer" />
    </div>
  );
}

const PdfEngine = forwardRef<
  EngineHandle,
  EngineProps & {
    password?: string;
    rotation: number;
    onPassword: (wrong: boolean) => void;
  }
>(function PdfEngine(props, ref) {
  const { data, password, scale, rotation, highlight } = props;
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [base, setBase] = useState<{ width: number; height: number } | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  const textCache = useRef(new Map<number, string>());

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | null = null;
    textCache.current.clear();

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        // Copie : pdf.js transfère le tampon au worker (réutilisé si une clé
        // de lecture est ensuite saisie).
        const task = pdfjs.getDocument({
          data: new Uint8Array(data.slice(0)),
          password,
          isEvalSupported: false,
        });
        destroy = () => void task.destroy();
        const doc = await task.promise;
        if (cancelled) return;
        const first = (await doc.getPage(1)).getViewport({ scale: CSS_UNITS });
        if (cancelled) return;
        setBase({ width: first.width, height: first.height });
        setPdf(doc);
        callbacks.current.onReady({
          pages: doc.numPages,
          width: first.width,
          height: first.height,
        });
      } catch (err) {
        if (cancelled) return;
        if ((err as { name?: string }).name === "PasswordException") {
          // code 1 : clé requise ; code 2 : clé incorrecte
          callbacks.current.onPassword((err as { code?: number }).code === 2);
        } else {
          callbacks.current.onError();
        }
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [data, password]);

  useImperativeHandle(
    ref,
    () => ({
      async search(query) {
        if (!pdf) return [];
        const needle = normalize(query.trim());
        if (!needle) return [];
        const hits: number[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          let text = textCache.current.get(i);
          if (text === undefined) {
            const content = await (await pdf.getPage(i)).getTextContent();
            text = normalize(
              content.items
                .map((it) => ("str" in it ? it.str + (it.hasEOL ? " " : "") : ""))
                .join("")
            );
            textCache.current.set(i, text);
          }
          if (text.includes(needle)) hits.push(i);
        }
        return hits;
      },
    }),
    [pdf]
  );

  if (!pdf || !base) return null;
  return (
    <div className="flex flex-col items-center" style={{ gap: PAGE_GAP }}>
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PdfPage
          key={i}
          pdf={pdf}
          n={i + 1}
          scale={scale}
          rotation={rotation}
          base={base}
          highlight={highlight}
        />
      ))}
    </div>
  );
});

// ─── Moteur Word (docx-preview) ───────────────────────────────────────────────

/** Liens du document : seuls http(s), mailto et ancres internes restent actifs. */
function sanitizeLinks(root: HTMLElement) {
  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (href.startsWith("#")) return;
    if (/^(https?:|mailto:)/i.test(href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    } else {
      a.removeAttribute("href");
    }
  });
}

const DocxEngine = forwardRef<EngineHandle, EngineProps>(function DocxEngine(props, ref) {
  const { data, scale, highlight } = props;
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    const body = bodyRef.current;
    const style = styleRef.current;
    if (!body || !style) return;
    let cancelled = false;

    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        if (cancelled) return;
        body.replaceChildren();
        style.replaceChildren();
        await renderAsync(data, body, style, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          renderAltChunks: false, // pas de HTML embarqué
          renderComments: false,
          renderChanges: false,
          useBase64URL: true,
        });
        if (cancelled) return;
        sanitizeLinks(body);
        const sections = body.querySelectorAll<HTMLElement>("section.docx");
        sections.forEach((s, i) => (s.dataset.page = String(i + 1)));
        callbacks.current.onReady({
          pages: Math.max(1, sections.length),
          width: cssLengthPx(sections[0]?.style.width) ?? 816,
          height: cssLengthPx(sections[0]?.style.minHeight) ?? 1056,
        });
      } catch {
        if (!cancelled) callbacks.current.onError();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  useEffect(() => {
    applyHighlight(bodyRef.current, highlight);
  }, [highlight]);

  useImperativeHandle(ref, () => ({
    async search(query) {
      const needle = normalize(query.trim());
      if (!needle || !bodyRef.current) return [];
      return Array.from(bodyRef.current.querySelectorAll<HTMLElement>("section.docx"))
        .filter((s) => normalize(s.textContent ?? "").includes(needle))
        .map((s) => Number(s.dataset.page));
    },
  }));

  return (
    <div className="docx-viewer" style={{ zoom: scale }}>
      <div ref={styleRef} />
      <div ref={bodyRef} />
    </div>
  );
});

// ─── Lecteur ──────────────────────────────────────────────────────────────────

function ToolButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0",
        "disabled:opacity-35 disabled:cursor-not-allowed",
        active ? "bg-brand-soft text-brand-dark" : "text-slate2 hover:bg-mist hover:text-brand"
      )}
    >
      {children}
    </button>
  );
}

function StatePanel({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto mt-10 max-w-md bg-white rounded-2xl border border-line-soft shadow-lg p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-soft flex items-center justify-center text-brand">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink font-title">{title}</h3>
      <p className="text-sm text-slate2 mt-1.5 leading-relaxed">{text}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}

/**
 * Lecteur de documents intégré (plein écran) : PDF et Word affichés dans la
 * plateforme, navigation par page, zoom, rotation, recherche plein texte,
 * changement de version linguistique et téléchargement.
 * Les autres formats (Excel, PowerPoint, .doc) sont proposés au téléchargement.
 */
export function DocumentViewer({
  source,
  initialLang,
  onClose,
  onDownloaded,
}: {
  source: ViewerSource;
  initialLang: Lang;
  onClose: () => void;
  onDownloaded?: () => void;
}) {
  const { t } = useI18n();
  const [lang, setLang] = useState<Lang>(initialLang);
  const file = source.files.find((f) => f.lang === lang) ?? source.files[0];
  const kind = viewerKind(file);
  const viewUrl = source.viewUrl(file.lang);

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const engineRef = useRef<EngineHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading", pct: -1 });
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [info, setInfo] = useState<DocInfo | null>(null);

  const [page, setPage] = useState(1);
  const [pageDraft, setPageDraft] = useState("1");
  const [zoom, setZoom] = useState<ZoomMode>("auto");
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [hits, setHits] = useState<number[] | null>(null);
  const [hitIndex, setHitIndex] = useState(0);
  const [searching, setSearching] = useState(false);

  const ready = phase.kind === "ready" && info !== null;
  const pageCount = info?.pages ?? 0;

  // ─── Ouverture : verrou du défilement, focus, restauration ──────────────
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scrollRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      previouslyFocused?.focus?.();
    };
  }, []);

  // ─── Chargement du fichier de la langue choisie ─────────────────────────
  useEffect(() => {
    setData(null);
    setInfo(null);
    setPassword(undefined);
    setPasswordDraft("");
    setPage(1);
    setPageDraft("1");
    setHits(null);
    setSearchedQuery("");
    if (kind === "other") return;
    setPhase({ kind: "loading", pct: -1 });
    const ctrl = new AbortController();
    fetchWithProgress(
      viewUrl,
      (pct) => setPhase((p) => (p.kind === "loading" ? { kind: "loading", pct } : p)),
      ctrl.signal
    )
      .then(({ blob }) => blob.arrayBuffer())
      .then((buf) => {
        if (!ctrl.signal.aborted) setData(buf);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setPhase({ kind: "error", message: err instanceof ApiError ? err.message : undefined });
      });
    return () => ctrl.abort();
  }, [viewUrl, kind]);

  const handleReady = useCallback((i: DocInfo) => {
    setInfo(i);
    setPhase({ kind: "ready" });
  }, []);
  const handleError = useCallback(() => setPhase({ kind: "error" }), []);
  const handlePassword = useCallback((wrong: boolean) => {
    setPhase({ kind: "password", wrong });
  }, []);

  // ─── Dimensions de la zone de lecture (zoom « ajusté ») ─────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (typeof zoom === "number") return zoom;
    if (!info || !area.w) return 1;
    const rotated = rotation % 180 !== 0;
    const w = rotated ? info.height : info.width;
    const h = rotated ? info.width : info.height;
    const fitWidth = (area.w - 40) / w;
    if (zoom === "width") return clampZoom(fitWidth);
    if (zoom === "page") return clampZoom(Math.min(fitWidth, (area.h - 40) / h));
    return clampZoom(Math.min(fitWidth, 1.25)); // auto : confortable, sans excès
  }, [zoom, info, area, rotation]);

  // ─── Navigation ─────────────────────────────────────────────────────────
  const goToPage = useCallback((n: number) => {
    const c = scrollRef.current;
    const el = c?.querySelector<HTMLElement>(`[data-page="${n}"]`);
    if (!c || !el) return;
    const offset = el.getBoundingClientRect().top - c.getBoundingClientRect().top;
    c.scrollTo({ top: c.scrollTop + offset - 12 });
  }, []);

  const pageRef = useRef(page);
  pageRef.current = page;

  // Garde la page courante en vue après un changement de zoom ou de rotation.
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => goToPage(pageRef.current));
    return () => cancelAnimationFrame(id);
  }, [scale, rotation, ready, goToPage]);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = c.getBoundingClientRect().top;
        const mark = c.clientHeight * 0.35;
        let current = 1;
        for (const el of c.querySelectorAll<HTMLElement>("[data-page]")) {
          if (el.getBoundingClientRect().top - top <= mark) current = Number(el.dataset.page);
          else break;
        }
        setPage(current);
        setPageDraft(String(current));
      });
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      c.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const zoomBy = useCallback(
    (dir: 1 | -1) => {
      const next =
        dir > 0
          ? (ZOOM_STEPS.find((s) => s > scale + 0.01) ?? MAX_ZOOM)
          : ([...ZOOM_STEPS].reverse().find((s) => s < scale - 0.01) ?? MIN_ZOOM);
      setZoom(clampZoom(next));
    },
    [scale]
  );

  // Ctrl + molette : zoom (écouteur non passif pour bloquer le zoom du navigateur).
  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1 : -1);
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // ─── Plein écran ────────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  // ─── Recherche ──────────────────────────────────────────────────────────
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.select());
  }, []);

  const showHit = (list: number[], i: number) => {
    setHitIndex(i);
    goToPage(list[i]);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q || !engineRef.current) return;
    if (q === searchedQuery && hits && hits.length > 0) {
      showHit(hits, (hitIndex + 1) % hits.length);
      return;
    }
    setSearching(true);
    try {
      const found = await engineRef.current.search(q);
      setHits(found);
      setSearchedQuery(q);
      if (found.length > 0) showHit(found, 0);
    } finally {
      setSearching(false);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setHits(null);
    setSearchedQuery("");
    scrollRef.current?.focus();
  };

  // ─── Clavier ────────────────────────────────────────────────────────────
  const closeSearchRef = useRef(closeSearch);
  closeSearchRef.current = closeSearch;
  const zoomByRef = useRef(zoomBy);
  zoomByRef.current = zoomBy;
  const pageCountRef = useRef(pageCount);
  pageCountRef.current = pageCount;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (e.key === "Escape") {
        e.stopPropagation();
        if (typing && target === searchInputRef.current) closeSearchRef.current();
        else onCloseRef.current();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        openSearch();
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToPage(Math.min(pageRef.current + 1, pageCountRef.current));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPage(Math.max(pageRef.current - 1, 1));
      } else if (e.key === "+" || e.key === "=") {
        zoomByRef.current(1);
      } else if (e.key === "-") {
        zoomByRef.current(-1);
      } else if (e.key === "0") {
        setZoom("auto");
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [goToPage, openSearch]);

  // Piège de focus : Tab reste dans le lecteur.
  const onKeyDownTrap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !rootRef.current) return;
    const items = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.round(Number(pageDraft));
    if (Number.isFinite(n) && n >= 1 && n <= pageCount) goToPage(n);
    else setPageDraft(String(page));
  };

  const zoomSelectValue = typeof zoom === "number" ? String(zoom) : zoom;
  const percent = `${Math.round(scale * 100)} %`;
  const highlight = searchOpen ? searchedQuery : "";

  const engineProps: EngineProps = {
    data: data!,
    scale,
    highlight,
    onReady: handleReady,
    onError: handleError,
  };

  const body = (() => {
    if (kind === "other") {
      return (
        <StatePanel
          icon={<FileText size={22} />}
          title={t("viewer.unsupportedTitle")}
          text={t("viewer.unsupportedText", { ext: fileExt(file.fileName) })}
        >
          <DownloadButton
            url={source.downloadUrl(file.lang)}
            file={file}
            label={t("viewer.download")}
            onDone={onDownloaded}
          />
        </StatePanel>
      );
    }
    if (phase.kind === "error") {
      return (
        <StatePanel
          icon={<FileWarning size={22} />}
          title={t("viewer.errorTitle")}
          text={phase.message ?? t("viewer.errorText")}
        >
          <DownloadButton
            url={source.downloadUrl(file.lang)}
            file={file}
            label={t("viewer.download")}
            onDone={onDownloaded}
          />
        </StatePanel>
      );
    }
    if (phase.kind === "password") {
      return (
        <StatePanel
          icon={<KeyRound size={22} />}
          title={t("viewer.passwordTitle")}
          text={t("viewer.passwordText")}
        >
          <form
            className="w-full space-y-3 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              if (!passwordDraft) return;
              setPhase({ kind: "loading", pct: 100 });
              setPassword(passwordDraft);
            }}
          >
            <label className="block text-xs font-semibold text-ink" htmlFor="viewer-key">
              {t("viewer.passwordLabel")}
            </label>
            <input
              id="viewer-key"
              type="password"
              autoFocus
              autoComplete="off"
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
              className={inputClass}
            />
            {phase.wrong && <p className="text-xs text-danger">{t("viewer.passwordWrong")}</p>}
            <PrimaryButton type="submit" className="w-full justify-center">
              <KeyRound size={14} aria-hidden />
              {t("viewer.passwordSubmit")}
            </PrimaryButton>
          </form>
        </StatePanel>
      );
    }
    return (
      <>
        {!ready && (
          <div className="flex flex-col items-center justify-center gap-3 pt-24 text-slate2">
            <LoaderCircle size={32} className="animate-spin text-brand" aria-hidden />
            <p className="text-sm font-medium">
              {t("viewer.loading")}
              {phase.kind === "loading" && phase.pct >= 0 && phase.pct < 100 && (
                <span className="ml-1.5 tabular-nums">{phase.pct} %</span>
              )}
            </p>
          </div>
        )}
        {data && (
          <div className={clsx(!ready && "invisible h-0 overflow-hidden")}>
            {kind === "pdf" ? (
              <PdfEngine
                key={viewUrl}
                ref={engineRef}
                {...engineProps}
                password={password}
                rotation={rotation}
                onPassword={handlePassword}
              />
            ) : (
              <DocxEngine key={viewUrl} ref={engineRef} {...engineProps} />
            )}
          </div>
        )}
      </>
    );
  })();

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={source.title}
      onKeyDown={onKeyDownTrap}
      className="fixed inset-0 z-[60] flex flex-col bg-slate-200"
    >
      {/* ─── En-tête : document, versions linguistiques, téléchargement ─── */}
      <header className="bg-gradient-to-b from-brand-deep to-brand-night text-white flex-shrink-0">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 flex-wrap">
          <span
            className="hidden sm:flex w-9 h-9 rounded-xl bg-white/10 border border-white/15 items-center justify-center flex-shrink-0"
            aria-hidden
          >
            <FileText size={17} className="text-accent" />
          </span>
          <div className="min-w-0 flex-1 basis-48">
            <h2 className="text-sm sm:text-base font-bold font-title truncate" title={source.title}>
              {source.title}
            </h2>
            <p className="text-[11px] text-white/65 truncate flex items-center gap-2">
              {source.meta && <span className="font-mono">{source.meta}</span>}
              {source.version && source.version > 1 && (
                <span className="text-accent font-semibold">
                  {t("docs.version", { n: source.version })}
                </span>
              )}
              <span className="truncate">
                {file.fileName} · {formatSize(file.fileSize)}
              </span>
            </p>
          </div>

          {source.isCoded && (
            <span className="hidden md:inline-flex">
              <CodedBadge compact />
            </span>
          )}

          {source.files.length > 1 && (
            <div
              className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5"
              role="group"
              aria-label={t("viewer.versions")}
            >
              {source.files.map((f) => (
                <button
                  key={f.lang}
                  type="button"
                  onClick={() => setLang(f.lang)}
                  aria-pressed={f.lang === file.lang}
                  title={LANG_LABELS[f.lang]}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase transition-colors",
                    f.lang === file.lang
                      ? "bg-white text-brand-dark shadow-sm"
                      : "text-white/80 hover:bg-white/15"
                  )}
                >
                  <FlagIcon lang={f.lang} className="w-[14px] h-[9px]" />
                  {f.lang}
                </button>
              ))}
            </div>
          )}

          <DownloadButton
            url={source.downloadUrl(file.lang)}
            file={file}
            label={t("viewer.download")}
            onDone={onDownloaded}
          />

          <button
            type="button"
            onClick={onClose}
            title={t("viewer.close")}
            aria-label={t("viewer.close")}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/85 hover:bg-white/15 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-brand via-accent to-brand" aria-hidden />
      </header>

      {/* ─── Barre d'outils ─── */}
      {kind !== "other" && (
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 bg-white border-b border-line shadow-sm flex-shrink-0 overflow-x-auto">
          <ToolButton
            label={t("viewer.prev")}
            onClick={() => goToPage(Math.max(page - 1, 1))}
            disabled={!ready || page <= 1}
          >
            <ChevronLeft size={17} />
          </ToolButton>
          <form onSubmit={submitPage} className="flex items-center gap-1.5 text-xs text-slate2">
            <input
              value={pageDraft}
              onChange={(e) => setPageDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={() => setPageDraft(String(page))}
              disabled={!ready}
              inputMode="numeric"
              aria-label={t("viewer.pageLabel")}
              className="w-11 text-center py-1 rounded-md border border-line bg-mist/60 font-semibold text-ink tabular-nums focus:border-brand outline-none"
            />
            <span className="whitespace-nowrap tabular-nums">
              {t("viewer.of", { n: pageCount || "…" })}
            </span>
          </form>
          <ToolButton
            label={t("viewer.next")}
            onClick={() => goToPage(Math.min(page + 1, pageCount))}
            disabled={!ready || page >= pageCount}
          >
            <ChevronRight size={17} />
          </ToolButton>

          <span className="w-px h-6 bg-line mx-1 flex-shrink-0" aria-hidden />

          <ToolButton label={t("viewer.zoomOut")} onClick={() => zoomBy(-1)} disabled={!ready}>
            <ZoomOut size={16} />
          </ToolButton>
          <select
            value={zoomSelectValue}
            onChange={(e) => {
              const v = e.target.value;
              setZoom(v === "auto" || v === "width" || v === "page" ? v : Number(v));
            }}
            disabled={!ready}
            aria-label={t("viewer.zoomLevel")}
            className="w-[4.75rem] sm:w-auto text-xs font-semibold text-ink border border-line rounded-md py-1 pl-2 pr-1 bg-white focus:border-brand outline-none"
          >
            {zoom === "auto" && <option value="auto">{percent}</option>}
            {typeof zoom === "number" && !ZOOM_STEPS.includes(zoom) && (
              <option value={String(zoom)}>{percent}</option>
            )}
            <option value="width">{t("viewer.fitWidth")}</option>
            <option value="page">{t("viewer.fitPage")}</option>
            {ZOOM_STEPS.map((s) => (
              <option key={s} value={String(s)}>
                {Math.round(s * 100)} %
              </option>
            ))}
          </select>
          <ToolButton label={t("viewer.zoomIn")} onClick={() => zoomBy(1)} disabled={!ready}>
            <ZoomIn size={16} />
          </ToolButton>

          {kind === "pdf" && (
            <ToolButton
              label={t("viewer.rotate")}
              onClick={() => setRotation((r) => (r + 90) % 360)}
              disabled={!ready}
            >
              <RotateCw size={15} />
            </ToolButton>
          )}

          <span className="flex-1" />

          <ToolButton
            label={t("viewer.search")}
            onClick={() => (searchOpen ? closeSearch() : openSearch())}
            disabled={!ready}
            active={searchOpen}
          >
            <Search size={15} />
          </ToolButton>
          {document.fullscreenEnabled && (
            <ToolButton
              label={fullscreen ? t("viewer.exitFullscreen") : t("viewer.fullscreen")}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </ToolButton>
          )}
        </div>
      )}

      {/* ─── Recherche plein texte ─── */}
      {searchOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-mist border-b border-line flex-shrink-0 flex-wrap"
        >
          <div className="relative flex-1 min-w-48 max-w-md">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand/60"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("viewer.searchPh")}
              aria-label={t("viewer.search")}
              className={`${inputClass} pl-8 py-1.5 text-sm`}
            />
          </div>
          <ToolButton
            label={t("viewer.searchPrev")}
            onClick={() => hits && showHit(hits, (hitIndex - 1 + hits.length) % hits.length)}
            disabled={!hits || hits.length < 2}
          >
            <ChevronUp size={16} />
          </ToolButton>
          <ToolButton
            label={t("viewer.searchNext")}
            onClick={() => hits && showHit(hits, (hitIndex + 1) % hits.length)}
            disabled={!hits || hits.length < 2}
          >
            <ChevronDown size={16} />
          </ToolButton>
          <span className="text-xs text-slate2 tabular-nums" aria-live="polite">
            {searching
              ? t("viewer.searching")
              : hits === null
                ? ""
                : hits.length === 0
                  ? t("viewer.searchNone")
                  : t("viewer.searchHit", {
                      p: hits[hitIndex],
                      i: hitIndex + 1,
                      n: hits.length,
                    })}
          </span>
          <button
            type="button"
            onClick={closeSearch}
            className="ml-auto p-1.5 rounded-md text-slate2 hover:bg-white"
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={14} />
          </button>
        </form>
      )}

      {source.isCoded && kind !== "other" && (
        <p className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-danger bg-danger-soft border-b border-danger/20 flex-shrink-0">
          <ShieldAlert size={13} aria-hidden className="flex-shrink-0" />
          {t("viewer.codedNote")}
        </p>
      )}

      {/* ─── Zone de lecture ─── */}
      <div
        ref={(el) => {
          scrollRef.current = el;
          setScrollEl(el);
        }}
        tabIndex={0}
        className="flex-1 overflow-auto outline-none px-3 sm:px-5 py-5"
      >
        <ScrollRootContext.Provider value={scrollEl}>{body}</ScrollRootContext.Provider>
      </div>

      {/* ─── Barre d'état ─── */}
      {ready && (
        <footer className="hidden sm:flex items-center justify-between gap-4 px-4 py-1 bg-white border-t border-line text-[11px] text-slate2/80 flex-shrink-0">
          <span className="tabular-nums">
            {t("viewer.pages", { n: pageCount })} · {percent}
          </span>
          <span>{t("viewer.shortcuts")}</span>
        </footer>
      )}
    </div>,
    document.body
  );
}

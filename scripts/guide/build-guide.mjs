/**
 * Génère le guide utilisateur PDRS-CEEAC au format Word (.docx) dans les
 * 4 langues de la Communauté, avec les captures d'écran réelles de la
 * plateforme (produites par screenshots.mjs dans captures/<langue>/).
 *
 * Le contenu rédactionnel de chaque langue est dans content/<langue>.mjs ;
 * ce script ne porte que la mise en page (commune aux 4 versions).
 *
 * Usage : node build-guide.mjs [fr en pt es]   (par défaut : les 4 langues)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../..");
const CAPTURES = path.join(HERE, "captures");
const OUT_DIR = path.join(PROJECT, "docs");

const ALL_LANGS = ["fr", "en", "pt", "es"];
const LANGS = process.argv.slice(2).filter((l) => ALL_LANGS.includes(l));
if (LANGS.length === 0) LANGS.push(...ALL_LANGS);

// Charte graphique de la plateforme
const BRAND = "0077C8";
const BRAND_DEEP = "073E63";
const BRAND_NIGHT = "001F4D";
const ACCENT = "2AA87C";
const ACCENT_SOFT = "DDF5EC";
const GOLD = "E9A219";
const GOLD_SOFT = "FDF3DD";
const DANGER = "C8232A";
const DANGER_SOFT = "FCEBEB";
const MUTED = "5A6E82";
const LINE = "DEE7F0";
const FONT = "Calibri";

/** Dimensions d'un PNG (en-tête IHDR) — pour conserver les proportions. */
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 22, ...opts });

/** Texte avec segments **gras** (syntaxe minimale du fichier de contenu). */
function rich(text, base = {}) {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**")
        ? run(part.slice(2, -2), { ...base, bold: true })
        : run(part, base)
    );
}

function buildGuide(c) {
  const capDir = path.join(CAPTURES, c.lang);
  let figCount = 0;
  let tableCount = 0;

  const p = (text, opts = {}) =>
    new Paragraph({
      spacing: { after: 160, line: 300 },
      alignment: AlignmentType.JUSTIFIED,
      children: rich(text, opts.run),
      ...opts.para,
    });

  const h1 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { before: 0, after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
      children: [run(text, { bold: true, size: 34, color: BRAND_DEEP })],
    });

  const h2 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 140 },
      keepNext: true,
      children: [run(text, { bold: true, size: 26, color: BRAND })],
    });

  const bullets = (items) =>
    items.map(
      (item) =>
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 90, line: 290 },
          children: Array.isArray(item)
            ? [run(`${item[0]} — `, { bold: true, color: BRAND_DEEP }), ...rich(item[1])]
            : rich(item),
        })
    );

  /** Procédure numérotée : pastille + texte + précision en italique. */
  const steps = (items) =>
    items.map(
      ([text, detail], i) =>
        new Paragraph({
          spacing: { after: 110, line: 290 },
          indent: { left: 520, hanging: 520 },
          tabStops: [{ type: TabStopType.LEFT, position: 520 }],
          children: [
            run(` ${i + 1} `, {
              bold: true,
              color: "FFFFFF",
              shading: { type: ShadingType.CLEAR, fill: BRAND, color: "auto" },
            }),
            run("\t"),
            ...rich(text),
            ...(detail ? [run(` ${detail}`, { italics: true, color: MUTED })] : []),
          ],
        })
    );

  const figure = (file, caption, maxWidth = 600) => {
    const data = fs.readFileSync(path.join(capDir, file));
    const { width, height } = pngSize(data);
    const w = Math.min(maxWidth, width);
    figCount++;
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180, after: 80 },
        keepNext: true,
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 },
          left: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 },
          right: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 },
        },
        children: [
          new ImageRun({
            type: "png",
            data,
            transformation: { width: w, height: Math.round((w * height) / width) },
            altText: { title: caption, description: caption, name: file },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 260 },
        children: [
          run(`${c.labels.figure} ${figCount} — `, { bold: true, size: 18, color: BRAND_DEEP }),
          run(caption, { italics: true, size: 18, color: MUTED }),
        ],
      }),
    ];
  };

  const BOX_STYLES = {
    info: { color: ACCENT, fill: ACCENT_SOFT, title: "1E8862" },
    warning: { color: GOLD, fill: GOLD_SOFT, title: "9A6A0B" },
    security: { color: DANGER, fill: DANGER_SOFT, title: DANGER },
  };
  const box = ({ kind = "info", title, text }) => {
    const s = BOX_STYLES[kind];
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          left: { style: BorderStyle.SINGLE, size: 24, color: s.color },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: s.fill, color: "auto" },
                margins: { top: 140, bottom: 140, left: 200, right: 200 },
                children: [
                  new Paragraph({
                    spacing: { after: 60 },
                    children: [run(title, { bold: true, color: s.title })],
                  }),
                  ...(Array.isArray(text) ? text : [text]).map(
                    (t) =>
                      new Paragraph({
                        spacing: { after: 40, line: 280 },
                        children: rich(t, { size: 21 }),
                      })
                  ),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 160 }, children: [] }),
    ];
  };

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  };
  const cell = (text, { header = false, width, center = false, zebra = false, keepNext = false }) =>
    new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      shading: header
        ? { type: ShadingType.CLEAR, fill: BRAND_DEEP, color: "auto" }
        : zebra
          ? { type: ShadingType.CLEAR, fill: "F3F7FB", color: "auto" }
          : undefined,
      margins: { top: 90, bottom: 90, left: 130, right: 130 },
      children: [
        new Paragraph({
          spacing: { after: 0, line: 270 },
          keepNext, // garde les tableaux courts sur une même page
          alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: rich(text, {
            size: 19,
            bold: header || undefined,
            color: header ? "FFFFFF" : undefined,
          }),
        }),
      ],
    });
  const table = ({ caption, head, rows, widths, center = [] }) => {
    tableCount++;
    return [
      new Paragraph({
        spacing: { before: 120, after: 80 },
        keepNext: true,
        children: [
          run(`${c.labels.table} ${tableCount} — `, { bold: true, size: 18, color: BRAND_DEEP }),
          run(caption, { italics: true, size: 18, color: MUTED }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({
            tableHeader: true,
            children: head.map((h, i) =>
              cell(h, { header: true, width: widths[i], center: center.includes(i), keepNext: true })
            ),
          }),
          ...rows.map(
            (r, ri) =>
              new TableRow({
                cantSplit: true,
                children: r.map((v, i) =>
                  cell(v, {
                    width: widths[i],
                    center: center.includes(i),
                    zebra: ri % 2 === 1,
                    keepNext: rows.length <= 10 && ri < rows.length - 1,
                  })
                ),
              })
          ),
        ],
      }),
      new Paragraph({ spacing: { after: 200 }, children: [] }),
    ];
  };

  const renderBlock = (b) => {
    if (b.p) return [p(b.p)];
    if (b.h2) return [h2(b.h2)];
    if (b.bullets) return bullets(b.bullets);
    if (b.steps) return steps(b.steps);
    if (b.figure) return figure(b.figure[0], b.figure[1], b.figure[2]);
    if (b.box) return box(b.box);
    if (b.table) return table(b.table);
    throw new Error(`Bloc inconnu : ${JSON.stringify(b).slice(0, 80)}`);
  };

  // ─── Page de garde ─────────────────────────────────────────────────────
  const cv = c.cover;
  const band = (fill, height) =>
    new Paragraph({
      spacing: { after: 0 },
      shading: { type: ShadingType.CLEAR, fill, color: "auto" },
      children: [run(" ", { size: height })],
    });
  const centered = (text, opts, after = 120) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after },
      children: [run(text, opts)],
    });

  const cover = [
    band(BRAND_NIGHT, 20),
    band(ACCENT, 6),
    new Paragraph({ spacing: { after: 700 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new ImageRun({
          type: "png",
          data: fs.readFileSync(path.join(PROJECT, "logo_ceeac.png")),
          transformation: { width: 150, height: 150 },
          altText: { title: "CEEAC-ECCAS", description: "Logo CEEAC-ECCAS", name: "logo" },
        }),
      ],
    }),
    centered(cv.community, { size: 24, color: MUTED }, 80),
    centered(cv.secretariat, { size: 22, color: MUTED }, 640),
    centered("PDRS-CEEAC", { bold: true, size: 40, color: BRAND, characterSpacing: 40 }, 80),
    centered(cv.platform, { size: 22, color: BRAND_DEEP }, 480),
    centered(cv.title, { bold: true, size: 60, color: BRAND_DEEP }, 160),
    centered(cv.subtitle, { size: 30, color: ACCENT }, 1300),
    centered(cv.version, { bold: true, size: 22, color: BRAND_DEEP }, 60),
    centered(cv.audience, { size: 21, color: MUTED }, 0),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─── Fiche du document + sommaire ──────────────────────────────────────
  const docSheet = [
    new Paragraph({
      spacing: { after: 200 },
      children: [run(c.sheet.title, { bold: true, size: 28, color: BRAND_DEEP })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: c.sheet.rows.map(
        ([k, v]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: "EEF4FA", color: "auto" },
                margins: { top: 90, bottom: 90, left: 140, right: 140 },
                children: [
                  new Paragraph({ children: [run(k, { bold: true, size: 20, color: BRAND_DEEP })] }),
                ],
              }),
              new TableCell({
                width: { size: 68, type: WidthType.PERCENTAGE },
                margins: { top: 90, bottom: 90, left: 140, right: 140 },
                children: [new Paragraph({ children: rich(v, { size: 20 }) })],
              }),
            ],
          })
      ),
    }),
    new Paragraph({
      pageBreakBefore: true,
      spacing: { after: 200 },
      children: [run(c.labels.toc, { bold: true, size: 28, color: BRAND_DEEP })],
    }),
    new TableOfContents(c.labels.toc, { hyperlink: true, headingStyleRange: "1-2" }),
    new Paragraph({
      spacing: { before: 200 },
      children: [run(c.labels.tocHint, { italics: true, size: 18, color: MUTED })],
    }),
  ];

  const body = c.chapters.flatMap((ch) => [h1(ch.title), ...ch.blocks.flatMap(renderBlock)]);

  return new Document({
    creator: "CEEAC-ECCAS · PDRS-CEEAC",
    title: c.meta.title,
    subject: c.meta.subject,
    description: c.meta.subject,
    language: c.meta.locale,
    features: { updateFields: true },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "▪",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 520, hanging: 300 } },
                run: { color: ACCENT },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: FONT, size: 22 } },
        heading1: { run: { font: FONT, size: 34, bold: true, color: BRAND_DEEP } },
        heading2: { run: { font: FONT, size: 26, bold: true, color: BRAND } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1150, right: 1150 } } },
        children: cover,
      },
      {
        properties: {
          titlePage: false,
          page: { margin: { top: 1250, bottom: 1150, left: 1250, right: 1250 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9400 }],
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
                children: [
                  run("PDRS-CEEAC", { bold: true, size: 16, color: BRAND_DEEP }),
                  run(`\t${c.meta.header}`, { size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9400 }],
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
                children: [
                  run(c.meta.footer, { size: 16, color: MUTED }),
                  run(`\t${c.labels.page} `, { size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: BRAND_DEEP, bold: true }),
                  run(` / `, { size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children: [...docSheet, ...body],
      },
    ],
  });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const lang of LANGS) {
  const { default: content } = await import(
    pathToFileURL(path.join(HERE, "content", `${lang}.mjs`)).href
  );
  const doc = buildGuide(content);
  const out = path.join(OUT_DIR, content.file);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(out, buffer);
  console.log(`Guide ${lang.toUpperCase()} : ${out} (${Math.round(buffer.length / 1024)} Ko)`);
}

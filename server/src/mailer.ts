import nodemailer, { type Transporter } from "nodemailer";
import { config, isMailConfigured } from "./config.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
    });
  }
  return transporter;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface MailContent {
  subject: string;
  text: string;
  html: string;
  attachments?: MailAttachment[];
}

export interface BroadcastResult {
  sent: string[];
  failed: string[];
}

/**
 * Envoie un e-mail individuel à chaque destinataire (pas de Cc/Cci : les
 * adresses des participants ne doivent pas fuiter entre États membres).
 */
export async function sendBroadcast(
  recipients: string[],
  content: MailContent
): Promise<BroadcastResult> {
  if (!isMailConfigured()) {
    throw new Error("SMTP non configuré");
  }
  const t = getTransporter();
  const result: BroadcastResult = { sent: [], failed: [] };

  for (const to of recipients) {
    try {
      await t.sendMail({
        from: config.smtp.from,
        to,
        subject: content.subject,
        text: content.text,
        html: content.html,
        attachments: content.attachments,
      });
      result.sent.push(to);
    } catch (err) {
      console.error(`[mail] échec d'envoi à ${to} :`, err);
      result.failed.push(to);
    }
  }
  return result;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export interface ReportLink {
  title: string;
  url: string;
  isCoded: boolean;
}

/** Construit le contenu (texte + HTML) de l'e-mail de diffusion d'un rapport. */
export function buildReportMail(options: {
  platformName: string;
  sessionTitle: string;
  subject: string;
  message: string;
  documents: ReportLink[];
  appUrl: string;
}): MailContent {
  const { platformName, sessionTitle, subject, message, documents, appUrl } =
    options;

  const textDocs = documents
    .map((d) => `  • ${d.title}${d.isCoded ? " (document codé)" : ""}\n    ${d.url}`)
    .join("\n");
  const text = [
    message,
    "",
    documents.length ? "Documents :" : "",
    textDocs,
    "",
    appUrl ? `Plateforme : ${appUrl}` : "",
    `— ${platformName} · ${sessionTitle}`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlDocs = documents
    .map(
      (d) =>
        `<li style="margin:6px 0"><a href="${esc(d.url)}" style="color:#006EB5">${esc(d.title)}</a>${
          d.isCoded
            ? ' <span style="color:#C1272D;font-size:13px">(document codé)</span>'
            : ""
        }</li>`
    )
    .join("");
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1a2b3c">
    <div style="background:#006EB5;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
      <h1 style="margin:0;font-size:18px">${esc(platformName)}</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:.9">${esc(sessionTitle)}</p>
    </div>
    <div style="border:1px solid #dde5ec;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="margin:0 0 12px;font-size:16px">${esc(subject)}</h2>
      <p style="font-size:15px;line-height:1.6;white-space:pre-line">${esc(message)}</p>
      ${documents.length ? `<h3 style="font-size:14px;margin:20px 0 8px">Documents :</h3><ul style="font-size:15px;padding-left:20px">${htmlDocs}</ul>` : ""}
      ${appUrl ? `<p style="margin-top:24px"><a href="${esc(appUrl)}" style="background:#006EB5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;display:inline-block">Accéder à la plateforme</a></p>` : ""}
      <p style="font-size:12px;color:#6b7c8d;margin-top:24px">Connectez-vous avec votre compte pour télécharger les documents.</p>
    </div>
  </div>`;

  return { subject, text, html };
}

/** E-mail d'accès pour un compte participant créé par l'administrateur. */
export function buildAccessMail(options: {
  platformName: string;
  recipientName: string;
  email: string;
  password: string;
  loginUrl: string;
}): MailContent {
  const { platformName, recipientName, email, password, loginUrl } = options;
  const subject = `Vos accès — ${platformName}`;
  const greeting = recipientName.trim() ? `Bonjour ${recipientName},` : "Bonjour,";

  const text = [
    greeting,
    "",
    `Un compte participant a été créé pour vous sur ${platformName} (Portail Documentaire des Réunions Statutaires de la CEEAC).`,
    "",
    "Identifiants de connexion :",
    `  Adresse e-mail : ${email}`,
    `  Mot de passe provisoire : ${password}`,
    "",
    "Orientations pour vous connecter :",
    `  1. Ouvrez la page de connexion : ${loginUrl}`,
    "  2. Saisissez votre adresse e-mail et le mot de passe provisoire ci-dessus.",
    "  3. Lors de la première connexion, vous serez invité(e) à définir votre mot de passe personnel.",
    "",
    "Vous pourrez ensuite consulter les documents des réunions auxquelles vous avez accès.",
    "Ne communiquez ces identifiants à personne et conservez-les en lieu sûr.",
    "",
    `— ${platformName}`,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1a2b3c">
    <div style="background:#006EB5;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
      <h1 style="margin:0;font-size:18px">${esc(platformName)}</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:.9">Portail Documentaire des Réunions Statutaires de la CEEAC</p>
    </div>
    <div style="border:1px solid #dde5ec;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px">${esc(greeting)}</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px">
        Un compte participant a été créé pour vous sur <strong>${esc(platformName)}</strong>.
      </p>
      <div style="background:#f4f7fa;border:1px solid #dde5ec;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7c8d;text-transform:uppercase;letter-spacing:.04em">Identifiants de connexion</p>
        <p style="margin:0 0 6px;font-size:15px">Adresse e-mail : <strong>${esc(email)}</strong></p>
        <p style="margin:0;font-size:15px">Mot de passe provisoire : <strong style="font-family:Consolas,Monaco,monospace">${esc(password)}</strong></p>
      </div>
      <p style="font-size:15px;font-weight:bold;margin:0 0 8px">Orientations pour vous connecter</p>
      <ol style="font-size:15px;line-height:1.6;margin:0 0 20px;padding-left:20px">
        <li>Ouvrez la page de connexion.</li>
        <li>Saisissez votre adresse e-mail et le mot de passe provisoire.</li>
        <li>Lors de la première connexion, définissez votre mot de passe personnel.</li>
      </ol>
      <p style="margin:0 0 16px">
        <a href="${esc(loginUrl)}" style="background:#006EB5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;display:inline-block">Accéder à la page de connexion</a>
      </p>
      <p style="font-size:13px;color:#6b7c8d;margin:0">
        Vous pourrez ensuite consulter les documents des réunions auxquelles vous avez accès.
        Ne communiquez ces identifiants à personne.
      </p>
    </div>
  </div>`;

  return { subject, text, html };
}

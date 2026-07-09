/**
 * Génère le guide d'utilisation participant au format Word (.docx),
 * avec les captures d'écran réelles de la plateforme.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPTURES = path.join(HERE, "captures");
const PROJECT = "k:/Portail-Web-Document-CTS";
const OUT = path.join(PROJECT, "docs", "Guide-Participant-Plateforme-CTS-APPS.docx");

const BRAND = "006EB5";
const BRAND_DEEP = "073E63";
const ACCENT = "3DA281";

const img = (name) => fs.readFileSync(path.join(CAPTURES, name));

// ─── Briques de mise en page ─────────────────────────────────────────────────
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 160, line: 300 },
    ...opts,
    children: [new TextRun({ text, size: 22, ...opts.run })],
  });

const bullet = (text, bold = null) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 300 },
    children: bold
      ? [
          new TextRun({ text: `${bold} : `, bold: true, size: 22 }),
          new TextRun({ text, size: 22 }),
        ]
      : [new TextRun({ text, size: 22 })],
  });

const step = (n, text, detail = "") =>
  new Paragraph({
    spacing: { after: 120, line: 300 },
    indent: { left: 240 },
    children: [
      new TextRun({ text: `${n}. `, bold: true, color: BRAND, size: 22 }),
      new TextRun({ text, size: 22 }),
      ...(detail ? [new TextRun({ text: ` ${detail}`, italics: true, size: 22, color: "5A6E82" })] : []),
    ],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: BRAND })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, color: BRAND_DEEP })],
  });

let figCount = 0;
const figure = (file, caption, width = 620, height = 388) => {
  figCount++;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
      children: [
        new ImageRun({
          type: "png",
          data: img(file),
          transformation: { width, height },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Figure ${figCount} — ${caption}`,
          italics: true,
          size: 18,
          color: "5A6E82",
        }),
      ],
    }),
  ];
};

const infoBox = (title, text) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT },
      right: { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "E4F4EE" },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: title, bold: true, size: 22, color: "2E8A6C" })],
              }),
              new Paragraph({
                spacing: { after: 0, line: 280 },
                children: [new TextRun({ text, size: 21 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const faqRow = (probleme, solution, header = false) =>
  new TableRow({
    tableHeader: header,
    children: [probleme, solution].map(
      (text, i) =>
        new TableCell({
          width: { size: i === 0 ? 40 : 60, type: WidthType.PERCENTAGE },
          shading: header
            ? { type: ShadingType.CLEAR, fill: BRAND }
            : undefined,
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({
              spacing: { after: 0, line: 280 },
              children: [
                new TextRun({
                  text,
                  size: 20,
                  bold: header,
                  color: header ? "FFFFFF" : undefined,
                }),
              ],
            }),
          ],
        })
    ),
  });

const faq = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
  },
  rows: [
    faqRow("Situation", "Que faire ?", true),
    faqRow(
      "« Identifiant ou mot de passe de session incorrect » à l'inscription",
      "Vérifiez l'identifiant (format CTS-XXXXXX) et le mot de passe reçus, en respectant les tirets. Si le message persiste, les accès ont peut-être été renouvelés : rapprochez-vous de votre point focal national ou du Secrétariat DAPPS."
    ),
    faqRow(
      "« Les inscriptions pour cette session sont closes »",
      "La session est terminée. Contactez le Secrétariat DAPPS pour obtenir un accès à la plateforme."
    ),
    faqRow(
      "« Un compte existe déjà avec cet e-mail »",
      "Vous avez déjà un compte : utilisez la page de connexion. En cas de mot de passe oublié, demandez une réinitialisation au Secrétariat DAPPS."
    ),
    faqRow(
      "« Identifiants incorrects » à la connexion",
      "Vérifiez l'adresse e-mail et le mot de passe (attention aux majuscules). Après plusieurs échecs, patientez 15 minutes avant de réessayer."
    ),
    faqRow(
      "« Votre compte est désactivé »",
      "Votre accréditation a été suspendue. Contactez le Secrétariat DAPPS."
    ),
    faqRow(
      "« Session expirée, veuillez vous reconnecter »",
      "Votre session a expiré (7 jours) ou votre mot de passe a été réinitialisé. Reconnectez-vous simplement."
    ),
    faqRow(
      "Un document attendu n'apparaît pas dans la bibliothèque",
      "Vérifiez vos langues de documents dans Mon profil : seuls les documents disponibles dans les langues sélectionnées sont affichés. Sinon, le document n'est peut-être pas encore publié."
    ),
    faqRow(
      "Un fichier téléchargé « codé » ne s'ouvre pas normalement",
      "C'est le comportement attendu : les documents portant le badge « Document codé » sont chiffrés avant leur mise en ligne. La clé de lecture est communiquée séparément par le Secrétariat, par un canal sécurisé."
    ),
    faqRow(
      "Le texte est trop petit à l'écran",
      "Utilisez le bouton A / A+ / A++ dans la barre d'en-tête pour agrandir toute l'interface. Votre choix est mémorisé."
    ),
  ],
});

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "CEEAC · DAPPS",
  title: "Guide du participant — Plateforme CTS-APPS",
  description:
    "Guide d'utilisation de la plateforme d'accès aux documents du CTS-APPS pour les experts accrédités",
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    // ─── Page de garde ───────────────────────────────────────────────
    {
      properties: {},
      children: [
        new Paragraph({ spacing: { after: 800 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new ImageRun({
              type: "png",
              data: fs.readFileSync(path.join(PROJECT, "logo_ceeac.png")),
              transformation: { width: 140, height: 140 },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Communauté Économique des États de l'Afrique Centrale",
              size: 24,
              color: "5A6E82",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "Département des Affaires Politiques, Paix et Sécurité (DAPPS)",
              size: 24,
              color: "5A6E82",
            }),
          ],
        }),
        new Paragraph({ spacing: { after: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "PLATEFORME CTS-APPS",
              bold: true,
              size: 36,
              color: BRAND,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Guide d'utilisation",
              bold: true,
              size: 56,
              color: BRAND_DEEP,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
          children: [
            new TextRun({
              text: "Espace Participant",
              size: 32,
              color: ACCENT,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Version 1.0 — Juillet 2026", size: 22, color: "5A6E82" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "À l'attention des experts accrédités des États membres",
              size: 22,
              color: "5A6E82",
            }),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ─── Sommaire ────────────────────────────────────────────────
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun({ text: "Table des matières", bold: true, size: 32, color: BRAND })],
        }),
        new TableOfContents("Table des matières", {
          hyperlink: true,
          headingStyleRange: "1-2",
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ─── 1. Présentation ─────────────────────────────────────────
        h1("1. Présentation de la plateforme"),
        p(
          "La Plateforme CTS-APPS est le portail documentaire officiel du Comité Technique Spécialisé des Affaires Politiques, Paix et Sécurité de la CEEAC. Elle permet aux experts accrédités des États membres :"
        ),
        bullet("de consulter et télécharger les documents officiels des sessions (rapports, résolutions, ordres du jour, notes conceptuelles, instruments juridiques…), dans les quatre langues de la Communauté (français, anglais, portugais, espagnol) ;"),
        bullet("de suivre le calendrier des sessions du CTS et d'échanger avec les autres participants dans le fil de discussion de chaque session ;"),
        bullet("de recevoir par e-mail les rapports de réunion diffusés par le Secrétariat ;"),
        bullet("de gérer leur profil et leurs préférences de langue."),
        p(
          "L'accès est strictement réservé aux personnes accréditées. L'adresse de la plateforme vous est communiquée par le Secrétariat DAPPS ou par votre point focal national."
        ),
        infoBox(
          "Bon à savoir",
          "La plateforme fonctionne sur tout navigateur récent (Chrome, Edge, Firefox, Safari), sur ordinateur, tablette ou téléphone. Aucune installation n'est nécessaire."
        ),
        spacer(),

        // ─── 2. Obtenir un compte ────────────────────────────────────
        h1("2. Obtenir votre accès"),
        p("Il existe deux façons d'obtenir un compte participant :"),
        bullet(
          "vous créez vous-même votre compte à l'aide de l'identifiant et du mot de passe de session transmis à votre État membre (voir chapitre 3) — c'est la voie normale avant chaque session du CTS ;",
          "L'auto-inscription"
        ),
        bullet(
          "le Secrétariat crée votre compte et vous remet un mot de passe provisoire, à changer lors de votre première connexion (voir chapitre 4.1).",
          "La création par le Secrétariat"
        ),
        spacer(),

        // ─── 3. Auto-inscription ─────────────────────────────────────
        h1("3. Créer votre compte avec les accès de session"),
        p(
          "Avant chaque session du CTS, le Secrétariat DAPPS transmet aux États membres une invitation contenant un identifiant de session (au format CTS-XXXXXX) et un mot de passe d'accès. Ces accès vous permettent de créer votre compte personnel :"
        ),
        step(1, "Ouvrez la page d'inscription :", "adresse de la plateforme suivie de /inscription (le lien figure aussi dans l'invitation et sur la page de connexion)."),
        step(2, "Saisissez l'identifiant de session et le mot de passe d'accès reçus."),
        step(3, "Renseignez vos informations personnelles :", "nom complet, adresse e-mail institutionnelle, pays, fonction et institution."),
        step(4, "Choisissez votre mot de passe personnel (8 caractères minimum) et confirmez-le."),
        step(5, "Cliquez sur « Créer mon compte ».", "Vous êtes immédiatement connecté(e) et dirigé(e) vers la bibliothèque documentaire."),
        ...figure("02-inscription.png", "La page d'inscription : accès de session en haut, informations personnelles en dessous"),
        infoBox(
          "Important",
          "Le mot de passe de session sert uniquement à créer votre compte. Par la suite, vous vous connecterez toujours avec votre adresse e-mail et le mot de passe personnel que vous avez choisi. Ne communiquez les accès de session qu'aux personnes autorisées de votre délégation."
        ),
        spacer(),

        // ─── 4. Connexion ────────────────────────────────────────────
        h1("4. Se connecter"),
        step(1, "Ouvrez l'adresse de la plateforme dans votre navigateur."),
        step(2, "Saisissez votre adresse e-mail et votre mot de passe."),
        step(3, "Cliquez sur « Se connecter »."),
        ...figure("01-connexion.png", "La page de connexion"),
        p(
          "Votre session reste active pendant 7 jours sur l'appareil utilisé. Pour vous déconnecter manuellement, cliquez sur l'icône de déconnexion en haut à droite de l'écran."
        ),

        h2("4.1. Première connexion avec un mot de passe provisoire"),
        p(
          "Si votre compte a été créé par le Secrétariat, vous avez reçu un mot de passe provisoire. Lors de votre première connexion, la plateforme vous demande de définir votre mot de passe personnel :"
        ),
        step(1, "Connectez-vous avec votre e-mail et le mot de passe provisoire reçu."),
        step(2, "Saisissez le mot de passe provisoire, puis votre nouveau mot de passe (8 caractères minimum) et sa confirmation."),
        step(3, "Cliquez sur « Définir mon mot de passe ».", "Vous accédez alors à votre espace."),
        ...figure("03-premiere-connexion.png", "L'écran de première connexion : définition du mot de passe personnel"),
        spacer(),

        // ─── 5. Bibliothèque ─────────────────────────────────────────
        h1("5. La bibliothèque documentaire"),
        p(
          "La bibliothèque est votre page d'accueil : elle rassemble tous les documents officiels publiés par le Secrétariat."
        ),
        ...figure("04-bibliotheque.png", "La bibliothèque documentaire : recherche, filtres par catégorie et téléchargement par langue"),
        h2("5.1. Rechercher et filtrer"),
        bullet("saisissez un ou plusieurs mots du titre dans le champ de recherche ;", "Recherche"),
        bullet("cliquez sur une catégorie (Rapport, Résolution, Ordre du Jour…) pour n'afficher que les documents correspondants ;", "Filtres"),
        bullet("chaque document indique sa catégorie, la référence de la session à laquelle il se rattache et sa date de publication.", "Repères"),
        h2("5.2. Télécharger un document"),
        p(
          "Chaque document peut exister en plusieurs versions linguistiques. Cliquez sur le bouton de la langue souhaitée (FR, EN, PT, ES) pour télécharger le fichier correspondant. Seules les langues disponibles pour ce document sont proposées."
        ),
        infoBox(
          "Langues affichées",
          "La bibliothèque n'affiche que les documents disponibles dans vos langues de travail, définies dans Mon profil (voir chapitre 7). Si un document semble manquer, vérifiez d'abord vos langues sélectionnées."
        ),
        h2("5.3. Les documents codés"),
        p(
          "Certains documents sensibles portent le badge rouge « Document codé » : le fichier a été chiffré par le Secrétariat avant sa mise en ligne, par mesure de sécurité. Après téléchargement, son ouverture nécessite la clé de lecture communiquée séparément par le Secrétariat, par un canal sécurisé. Si vous n'avez pas reçu cette clé, rapprochez-vous de votre point focal ou du Secrétariat DAPPS."
        ),
        spacer(),

        // ─── 6. Sessions & discussions ───────────────────────────────
        h1("6. Sessions CTS et fils de discussion"),
        p(
          "La page « Sessions & échanges » présente le calendrier des sessions du CTS : dates, lieu, statut (à venir, en cours, terminée), description et nombre de documents rattachés."
        ),
        p(
          "Chaque session dispose d'un fil de discussion ouvert aux participants et au Secrétariat. Cliquez sur le bouton « Discussion » d'une session pour l'ouvrir :"
        ),
        ...figure("05-sessions-discussion.png", "Une session CTS avec son fil de discussion ouvert"),
        bullet("saisissez votre message dans le champ du bas, puis appuyez sur Entrée ou cliquez sur le bouton d'envoi (2 000 caractères maximum) ;", "Écrire"),
        bullet("les nouveaux messages des autres participants apparaissent automatiquement, sans recharger la page ;", "Suivre"),
        bullet("vous pouvez supprimer vos propres messages (icône corbeille au survol) ; le Secrétariat peut modérer l'ensemble du fil.", "Supprimer"),
        infoBox(
          "Bonnes pratiques",
          "Le fil de discussion est un espace de travail officiel entre experts accrédités. Restez courtois et factuel, et n'y partagez aucune information confidentielle qui ne serait pas destinée à l'ensemble des participants."
        ),
        spacer(),

        // ─── 7. Profil ───────────────────────────────────────────────
        h1("7. Votre profil et vos préférences"),
        ...figure("06-profil.png", "La page Mon profil : informations d'accréditation, préférences de langue et mot de passe"),
        h2("7.1. Vos informations d'accréditation"),
        p(
          "La page « Mon profil » récapitule vos informations : e-mail, pays représenté, fonction, institution, date d'accréditation, statut et, le cas échéant, la session via laquelle vous vous êtes inscrit(e). Pour toute correction, contactez le Secrétariat DAPPS (les informations ne sont pas modifiables directement)."
        ),
        h2("7.2. Vos langues"),
        bullet("choisissez la langue d'affichage de la plateforme (français, anglais, portugais ou espagnol) ;", "Langue de l'interface"),
        bullet("sélectionnez les langues dans lesquelles vous souhaitez voir les documents de la bibliothèque (au moins une).", "Langues des documents"),
        p("Cliquez sur « Enregistrer » pour appliquer vos préférences : elles sont conservées d'une connexion à l'autre, sur tous vos appareils."),
        h2("7.3. Changer votre mot de passe"),
        step(1, "Dans « Changer mon mot de passe », saisissez votre mot de passe actuel."),
        step(2, "Saisissez le nouveau mot de passe (8 caractères minimum) et sa confirmation."),
        step(3, "Cliquez sur « Mettre à jour »."),
        infoBox(
          "Sécurité",
          "Choisissez un mot de passe robuste et unique (lettres, chiffres, caractères spéciaux). Votre mot de passe est chiffré : ni le Secrétariat ni l'administrateur ne peuvent le consulter. Après un changement, les éventuelles sessions ouvertes sur d'autres appareils sont automatiquement déconnectées."
        ),
        spacer(),

        // ─── 8. Confort de lecture ───────────────────────────────────
        h1("8. Confort de lecture et langue de l'interface"),
        p("Deux outils sont disponibles en permanence dans la barre d'en-tête :"),
        ...figure("07-entete-outils.png", "Les outils de l'en-tête : taille du texte (A), langue, profil et déconnexion", 620, 62),
        bullet("le bouton A agrandit le texte de toute la plateforme en trois paliers (A, A+, A++). Cliquez plusieurs fois pour passer d'un palier à l'autre ; votre choix est mémorisé ;", "Taille du texte"),
        bullet("le sélecteur de langue change immédiatement la langue de l'interface, sans déconnexion.", "Langue"),
        spacer(),

        // ─── 9. E-mails ──────────────────────────────────────────────
        h1("9. Les e-mails de la plateforme"),
        p(
          "Après les réunions, le Secrétariat peut vous adresser par e-mail les rapports et documents officiels : le message contient des liens de téléchargement directs par langue. Vous devez être connecté(e) à la plateforme pour que le téléchargement démarre (connectez-vous puis cliquez à nouveau sur le lien si nécessaire)."
        ),
        infoBox(
          "Vigilance",
          "Les e-mails officiels proviennent de l'adresse du Secrétariat et pointent uniquement vers l'adresse officielle de la plateforme. En cas de doute sur un message, ne cliquez pas et signalez-le au Secrétariat."
        ),
        spacer(),

        // ─── 10. FAQ ─────────────────────────────────────────────────
        h1("10. Questions fréquentes"),
        faq,
        spacer(),

        // ─── 11. Assistance ──────────────────────────────────────────
        h1("11. Assistance"),
        p(
          "Pour toute difficulté d'accès, demande de réinitialisation de mot de passe ou question relative à votre accréditation, contactez le Secrétariat du DAPPS-CEEAC :"
        ),
        bullet("par e-mail, à l'adresse de contact indiquée sur la page de connexion de la plateforme ;"),
        bullet("ou par l'intermédiaire de votre point focal national."),
        p(
          "Merci d'indiquer dans votre message : votre nom complet, votre pays, votre institution et une description précise du problème rencontré (avec, si possible, le message d'erreur affiché)."
        ),
      ],
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" } },
              children: [
                new TextRun({
                  text: "Plateforme CTS-APPS · Guide du participant",
                  size: 16,
                  color: "5A6E82",
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "© 2026 CEEAC-ECCAS · Département des Affaires Politiques, Paix et Sécurité — Page ",
                  size: 16,
                  color: "5A6E82",
                }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "5A6E82" }),
              ],
            }),
          ],
        }),
      },
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Guide généré : ${OUT} (${Math.round(buffer.length / 1024)} Ko, ${figCount} figures)`);

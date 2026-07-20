/**
 * Génère le guide d'utilisation participant au format Word (.docx),
 * avec les captures d'écran réelles de la plateforme.
 *
 * Version 2.0 — intègre l'accès invité par codes de session, la consultation
 * des documents dans le navigateur, les filtres enrichis et le profil épuré.
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
const OUT = path.join(PROJECT, "docs", "Guide-Participant-Plateforme-CTS-DSS.docx");

const BRAND = "0077C8";
const BRAND_DEEP = "073E63";
const ACCENT = "2AA87C";

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
            shading: { type: ShadingType.CLEAR, fill: "DDF5EC" },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: title, bold: true, size: 22, color: "1E8862" })],
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

// ─── Tableaux génériques (comparaison des accès, FAQ) ───────────────────────
const cell = (text, { header = false, width, center = false } = {}) =>
  new TableCell({
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
    shading: header ? { type: ShadingType.CLEAR, fill: BRAND } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        spacing: { after: 0, line: 280 },
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
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
  });

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" },
};

// Tableau comparatif : ce que permet chaque mode d'accès
const accessCompare = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: tableBorders,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Ce que vous pouvez faire", { header: true, width: 50 }),
        cell("Invité (codes de session)", { header: true, width: 25, center: true }),
        cell("Participant (compte)", { header: true, width: 25, center: true }),
      ],
    }),
    ...[
      ["Consulter les documents publiés en ligne", "Oui", "Oui"],
      ["Télécharger les documents (toutes langues)", "Oui", "Oui"],
      ["Rechercher et filtrer la bibliothèque", "Oui", "Oui"],
      ["Suivre le calendrier des sessions", "—", "Oui"],
      ["Participer aux fils de discussion", "—", "Oui"],
      ["Recevoir les rapports diffusés par e-mail", "—", "Oui"],
      ["Disposer d'un profil personnel permanent", "—", "Oui"],
      ["Durée de l'accès", "24 heures, renouvelable", "Permanent"],
    ].map(
      ([a, b, c]) =>
        new TableRow({
          children: [
            cell(a, { width: 50 }),
            cell(b, { width: 25, center: true }),
            cell(c, { width: 25, center: true }),
          ],
        })
    ),
  ],
});

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const faqRow = (probleme, solution, header = false) =>
  new TableRow({
    tableHeader: header,
    children: [
      cell(probleme, { header, width: 40 }),
      cell(solution, { header, width: 60 }),
    ],
  });

const faq = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: tableBorders,
  rows: [
    faqRow("Situation rencontrée", "Marche à suivre", true),
    faqRow(
      "« Identifiant ou mot de passe de session incorrect »",
      "Veuillez vérifier l'identifiant (format CTS-XXXXXX) et le mot de passe reçus, en respectant les tirets et les majuscules. Si le message persiste, les accès ont pu être renouvelés par le Secrétariat : rapprochez-vous de votre point focal national ou du Secrétariat CTS-DSS."
    ),
    faqRow(
      "« Cette session est terminée, ses accès ne sont plus valides »",
      "Les codes d'une session close ne permettent plus d'accéder à la plateforme. Veuillez contacter le Secrétariat CTS-DSS pour obtenir un accès."
    ),
    faqRow(
      "« Accès invité expiré, saisissez à nouveau les codes de session »",
      "L'accès invité est valable 24 heures : saisissez de nouveau les codes de session pour le renouveler. Si les codes ne fonctionnent plus, ils ont été renouvelés — rapprochez-vous de votre point focal national."
    ),
    faqRow(
      "« Un compte existe déjà avec cet e-mail »",
      "Un compte est déjà associé à cette adresse : utilisez l'onglet « J'ai un compte » de la page de connexion. En cas de mot de passe oublié, veuillez solliciter une réinitialisation auprès du Secrétariat CTS-DSS."
    ),
    faqRow(
      "« Identifiants incorrects » à la connexion",
      "Veuillez vérifier l'adresse e-mail et le mot de passe (attention aux majuscules). Après plusieurs tentatives infructueuses, un délai d'attente de 15 minutes s'applique par mesure de sécurité."
    ),
    faqRow(
      "« Votre compte est désactivé »",
      "Votre accréditation a été suspendue. Veuillez prendre l'attache du Secrétariat CTS-DSS pour en connaître les motifs et, le cas échéant, solliciter sa réactivation."
    ),
    faqRow(
      "« Session expirée, veuillez vous reconnecter »",
      "Votre session de travail a expiré (7 jours) ou votre mot de passe a été réinitialisé entre-temps. Il vous suffit de vous reconnecter."
    ),
    faqRow(
      "Impossible d'écrire dans les fils de discussion",
      "Les fils de discussion sont réservés aux titulaires d'un compte participant. Si vous êtes connecté(e) en qualité d'invité, créez votre compte via le lien « Créer mon compte » du menu."
    ),
    faqRow(
      "Un document attendu n'apparaît pas dans la bibliothèque",
      "Le document n'a vraisemblablement pas encore été publié par le Secrétariat. Vous pouvez également élargir vos filtres (catégorie, session) et vider le champ de recherche."
    ),
    faqRow(
      "Un fichier téléchargé « codé » ne s'ouvre pas normalement",
      "Ce comportement est attendu : les documents portant le badge « Document codé » sont chiffrés avant leur mise en ligne. La clé de lecture est communiquée séparément par le Secrétariat, par un canal sécurisé. Si vous ne l'avez pas reçue, rapprochez-vous de votre point focal."
    ),
    faqRow(
      "Le texte est trop petit à l'écran",
      "Utilisez le bouton A / A+ / A++ de la barre d'en-tête pour agrandir l'ensemble de l'interface. Votre réglage est conservé d'une visite à l'autre."
    ),
    faqRow(
      "Mot de passe oublié",
      "Veuillez adresser une demande de réinitialisation au Secrétariat CTS-DSS. Un mot de passe provisoire vous sera remis ; il vous sera demandé d'en définir un nouveau à la connexion suivante."
    ),
  ],
});

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "CEEAC · CTS-DSS",
  title: "Guide du participant — Plateforme CTS-DSS",
  description:
    "Guide d'utilisation de la plateforme d'accès aux documents du CTS-DSS à l'attention des représentants et experts accrédités des États membres",
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        // ─── Page de garde ───────────────────────────────────────────
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
              text: "Comité Technique Spécialisé Défense, Sûreté et Sécurité (CTS-DSS)",
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
              text: "PLATEFORME CTS-DSS",
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
          children: [new TextRun({ text: "Version 2.0 — Juillet 2026", size: 22, color: "5A6E82" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "À l'attention des représentants et experts accrédités des États membres",
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
          "La Plateforme CTS-DSS est le portail documentaire officiel du Comité Technique Spécialisé Défense, Sûreté et Sécurité de la CEEAC. Mise en œuvre par le Secrétariat du CTS-DSS, elle offre aux représentants et experts des États membres :"
        ),
        bullet(
          "la consultation en ligne et le téléchargement des documents officiels des sessions (rapports, résolutions, ordres du jour, notes conceptuelles, instruments juridiques…), dans les quatre langues de la Communauté — français, anglais, portugais et espagnol ;"
        ),
        bullet(
          "le suivi du calendrier des sessions du CTS et la possibilité d'échanger avec les autres participants dans le fil de discussion propre à chaque session ;"
        ),
        bullet("la réception, par courrier électronique, des rapports de réunion diffusés par le Secrétariat ;"),
        bullet("la consultation des informations de leur accréditation."),
        p(
          "L'accès est réservé aux personnes dûment autorisées. L'adresse de la plateforme vous est communiquée par le Secrétariat CTS-DSS ou par votre point focal national."
        ),
        infoBox(
          "Bon à savoir",
          "La plateforme fonctionne sur tout navigateur récent (Chrome, Edge, Firefox, Safari), depuis un ordinateur, une tablette ou un téléphone. Aucune installation n'est requise."
        ),
        spacer(),

        // ─── 2. Modes d'accès ────────────────────────────────────────
        h1("2. Les modes d'accès : invité ou participant"),
        p(
          "En amont de chaque session du CTS, le Secrétariat CTS-DSS transmet aux États membres deux codes d'accès : un identifiant de session (au format CTS-XXXXXX) et un mot de passe d'accès. À partir de ces codes, deux niveaux d'accès vous sont proposés :"
        ),
        bullet(
          "vous saisissez les codes de session sur la page de connexion et accédez immédiatement à la bibliothèque documentaire, sans créer de compte. Cet accès convient à la consultation et au téléchargement des documents (voir chapitre 3) ;",
          "L'accès invité"
        ),
        bullet(
          "vous créez, si vous le souhaitez, votre compte personnel à l'aide des mêmes codes de session. Le compte est nécessaire pour participer aux fils de discussion et recevoir les diffusions par e-mail (voir chapitre 4). Cette inscription est facultative et demeure possible à tout moment ;",
          "Le compte participant"
        ),
        bullet(
          "dans certains cas, le Secrétariat crée directement votre compte et vous remet un mot de passe provisoire, à personnaliser lors de votre première connexion (voir chapitre 5.1).",
          "Le compte créé par le Secrétariat"
        ),
        p("Le tableau ci-dessous récapitule les possibilités offertes par chaque niveau d'accès :"),
        accessCompare,
        spacer(),

        // ─── 3. Accès invité ─────────────────────────────────────────
        h1("3. Accéder aux documents avec les codes de session (invité)"),
        p(
          "Cette voie est la plus directe : elle ne requiert aucune création de compte et convient parfaitement à la consultation des documents de session."
        ),
        step(1, "Ouvrez l'adresse de la plateforme dans votre navigateur."),
        step(2, "Sur la page de connexion, sélectionnez l'onglet « Codes de session »."),
        step(
          3,
          "Saisissez l'identifiant de session (CTS-XXXXXX) et le mot de passe d'accès reçus.",
          "Les majuscules sont appliquées automatiquement."
        ),
        step(4, "Cliquez sur « Accéder aux documents ».", "La bibliothèque documentaire s'ouvre immédiatement."),
        ...figure("01b-connexion-codes.png", "L'onglet « Codes de session » de la page de connexion"),
        p(
          "En qualité d'invité, vous consultez et téléchargez librement l'ensemble des documents publiés. Un bandeau discret vous rappelle votre statut et vous propose, à tout moment, de créer votre compte participant."
        ),
        ...figure("03b-espace-invite.png", "L'espace documentaire en accès invité, avec le bandeau d'information"),
        infoBox(
          "Durée et renouvellement de l'accès invité",
          "L'accès invité est valable 24 heures ; il suffit de saisir à nouveau les codes de session pour le renouveler. Si le Secrétariat renouvelle les accès d'une session, les anciens codes cessent immédiatement de fonctionner. Veuillez ne communiquer les codes de session qu'aux personnes autorisées de votre délégation."
        ),
        spacer(),

        // ─── 4. Créer un compte ──────────────────────────────────────
        h1("4. Créer votre compte participant (facultatif)"),
        p(
          "La création d'un compte personnel n'est pas requise pour consulter les documents. Elle vous ouvre en revanche les fonctionnalités de collaboration : fils de discussion des sessions, réception des rapports diffusés par e-mail et profil permanent. Les mêmes codes de session servent à l'inscription :"
        ),
        step(
          1,
          "Ouvrez la page d'inscription :",
          "lien « Inscrivez-vous ici » de l'onglet « Codes de session », lien « Créer mon compte » de l'espace invité, ou adresse de la plateforme suivie de /inscription."
        ),
        step(2, "Saisissez l'identifiant de session et le mot de passe d'accès reçus."),
        step(
          3,
          "Renseignez vos informations personnelles :",
          "nom complet, adresse e-mail institutionnelle et pays sont requis ; la fonction et l'institution sont facultatives."
        ),
        step(4, "Choisissez votre mot de passe personnel (8 caractères minimum) et confirmez-le."),
        step(5, "Cliquez sur « Créer mon compte ».", "Vous êtes immédiatement connecté(e) et dirigé(e) vers la bibliothèque documentaire."),
        ...figure("02-inscription.png", "La page d'inscription : accès de session en haut, informations personnelles en dessous"),
        infoBox(
          "Important",
          "Les codes de session servent uniquement à ouvrir l'accès. Une fois votre compte créé, vous vous connecterez toujours avec votre adresse e-mail et le mot de passe personnel que vous avez choisi."
        ),
        spacer(),

        // ─── 5. Connexion ────────────────────────────────────────────
        h1("5. Se connecter avec votre compte"),
        step(1, "Ouvrez l'adresse de la plateforme dans votre navigateur."),
        step(2, "Dans l'onglet « J'ai un compte », saisissez votre adresse e-mail et votre mot de passe."),
        step(3, "Cliquez sur « Se connecter »."),
        ...figure("01-connexion.png", "La page de connexion — onglet « J'ai un compte »"),
        p(
          "Votre session de travail demeure active pendant 7 jours sur l'appareil utilisé. Pour vous déconnecter manuellement, cliquez sur l'icône de déconnexion située en haut à droite de l'écran."
        ),

        h2("5.1. Première connexion avec un mot de passe provisoire"),
        p(
          "Si votre compte a été créé par le Secrétariat, un mot de passe provisoire vous a été remis. Lors de votre première connexion, la plateforme vous invite à définir votre mot de passe personnel :"
        ),
        step(1, "Connectez-vous avec votre adresse e-mail et le mot de passe provisoire reçu."),
        step(2, "Saisissez le mot de passe provisoire, puis votre nouveau mot de passe (8 caractères minimum) et sa confirmation."),
        step(3, "Cliquez sur « Définir mon mot de passe ».", "Vous accédez alors à votre espace."),
        ...figure("03-premiere-connexion.png", "L'écran de première connexion : définition du mot de passe personnel"),
        infoBox(
          "Sécurité de votre mot de passe",
          "Choisissez un mot de passe robuste et qui vous est propre (lettres, chiffres, caractères spéciaux). Il est conservé sous forme chiffrée : ni le Secrétariat ni l'administrateur ne peuvent le consulter. En cas d'oubli, une réinitialisation peut être sollicitée auprès du Secrétariat CTS-DSS."
        ),
        spacer(),

        // ─── 6. Bibliothèque ─────────────────────────────────────────
        h1("6. La bibliothèque documentaire"),
        p(
          "La bibliothèque constitue votre page d'accueil : elle rassemble l'ensemble des documents officiels publiés par le Secrétariat, présentés du plus récent au plus ancien."
        ),
        ...figure("04-bibliotheque.png", "La bibliothèque documentaire : recherche, filtres, consultation et téléchargement par langue"),

        h2("6.1. Rechercher et filtrer"),
        bullet("saisissez un ou plusieurs mots du titre dans le champ de recherche ;", "Recherche"),
        bullet(
          "cliquez sur une catégorie (Rapport, Résolution, Ordre du Jour…) pour restreindre l'affichage aux documents correspondants ;",
          "Catégories"
        ),
        bullet(
          "le sélecteur « Toutes les sessions » permet de n'afficher que les documents rattachés à une session donnée ;",
          "Session"
        ),
        bullet(
          "chaque document indique sa catégorie, la référence de la session à laquelle il se rattache et sa date de publication.",
          "Repères"
        ),

        h2("6.2. Consulter un document en ligne"),
        p(
          "Les documents au format PDF peuvent être consultés directement dans le navigateur, sans téléchargement : cliquez sur le bouton marqué d'un œil, à gauche du bouton de téléchargement de la langue souhaitée. Le document s'ouvre dans un nouvel onglet."
        ),

        h2("6.3. Télécharger un document"),
        p(
          "Chaque document peut exister en plusieurs versions linguistiques, identifiées par leur drapeau et leur code (FR, EN, PT, ES). Cliquez sur le bouton de la langue souhaitée pour télécharger le fichier correspondant ; la progression s'affiche dans le bouton. Seules les langues effectivement disponibles pour ce document sont proposées."
        ),

        h2("6.4. Les documents codés"),
        p(
          "Certains documents sensibles portent le badge rouge « Document codé » : le fichier a été chiffré par le Secrétariat avant sa mise en ligne, par mesure de sécurité. Après téléchargement, son ouverture nécessite la clé de lecture communiquée séparément par le Secrétariat, par un canal sécurisé. Si vous n'avez pas reçu cette clé, veuillez vous rapprocher de votre point focal ou du Secrétariat CTS-DSS."
        ),
        spacer(),

        // ─── 7. Sessions & discussions ───────────────────────────────
        h1("7. Sessions CTS et fils de discussion"),
        p(
          "La page « Sessions & échanges » présente le calendrier des sessions du CTS : dates, lieu, statut (à venir, en cours, terminée), description et nombre de documents rattachés. Cette page est réservée aux titulaires d'un compte participant."
        ),
        p(
          "Chaque session dispose d'un fil de discussion ouvert aux participants et au Secrétariat. Cliquez sur le bouton « Discussion » d'une session pour l'ouvrir :"
        ),
        ...figure("05-sessions-discussion.png", "Une session CTS avec son fil de discussion ouvert"),
        bullet(
          "saisissez votre message dans le champ inférieur, puis appuyez sur Entrée ou cliquez sur le bouton d'envoi (2 000 caractères au maximum) ;",
          "Écrire"
        ),
        bullet("les messages des autres participants apparaissent automatiquement, sans qu'il soit nécessaire de recharger la page ;", "Suivre"),
        bullet(
          "vous pouvez supprimer vos propres messages (icône corbeille au survol) ; le Secrétariat assure la modération de l'ensemble du fil.",
          "Supprimer"
        ),
        infoBox(
          "Bonnes pratiques",
          "Le fil de discussion est un espace de travail officiel entre experts accrédités. Nous vous invitons à y observer la courtoisie d'usage, à demeurer factuel et à n'y partager aucune information confidentielle qui ne serait pas destinée à l'ensemble des participants."
        ),
        spacer(),

        // ─── 8. Profil ───────────────────────────────────────────────
        h1("8. Votre profil"),
        p(
          "La page « Mon profil » récapitule les informations de votre accréditation : adresse e-mail, institution, pays représenté, fonction, date d'accréditation, statut et, le cas échéant, la session au titre de laquelle vous vous êtes inscrit(e)."
        ),
        ...figure("06-profil.png", "La page Mon profil : les informations de votre accréditation"),
        infoBox(
          "Mise à jour de vos informations",
          "Les informations d'accréditation ne sont pas modifiables directement, par souci d'intégrité des données officielles. Pour toute correction (changement de fonction, d'institution ou d'adresse e-mail) ou pour un changement de mot de passe, veuillez adresser votre demande au Secrétariat CTS-DSS."
        ),
        spacer(),

        // ─── 9. Confort de lecture ───────────────────────────────────
        h1("9. Confort de lecture et langue de l'interface"),
        p("Deux réglages sont disponibles en permanence dans la barre d'en-tête, y compris sur la page de connexion :"),
        ...figure("07-entete-outils.png", "Les outils de l'en-tête : taille du texte, langues (avec drapeaux), profil et déconnexion", 620, 42),
        bullet(
          "le bouton A agrandit le texte de toute la plateforme en trois paliers (A, A+, A++). Cliquez successivement pour passer d'un palier à l'autre ; votre réglage est conservé ;",
          "Taille du texte"
        ),
        bullet(
          "les boutons de langue (drapeaux FR · EN · PT · ES) changent immédiatement la langue de l'interface, sans déconnexion.",
          "Langue de l'interface"
        ),
        spacer(),

        // ─── 10. E-mails ─────────────────────────────────────────────
        h1("10. Les courriers électroniques de la plateforme"),
        p(
          "À l'issue des réunions, le Secrétariat peut adresser aux participants les rapports et documents officiels par courrier électronique. Ces messages peuvent contenir :"
        ),
        bullet("des liens de téléchargement directs, par langue, vers les documents publiés sur la plateforme — une connexion à votre compte est nécessaire pour que le téléchargement s'effectue ;"),
        bullet("des documents joints directement au message, lisibles sans connexion."),
        infoBox(
          "Vigilance",
          "Les courriers officiels proviennent exclusivement de l'adresse du Secrétariat et renvoient uniquement vers l'adresse officielle de la plateforme. En cas de doute sur l'authenticité d'un message, veuillez vous abstenir de cliquer et le signaler au Secrétariat."
        ),
        spacer(),

        // ─── 11. FAQ ─────────────────────────────────────────────────
        h1("11. Questions fréquentes"),
        faq,
        spacer(),

        // ─── 12. Assistance ──────────────────────────────────────────
        h1("12. Assistance"),
        p(
          "Pour toute difficulté d'accès, demande de réinitialisation de mot de passe, correction de vos informations d'accréditation ou question relative à la plateforme, le Secrétariat du CTS-DSS-CEEAC demeure à votre disposition :"
        ),
        bullet("par courrier électronique, à l'adresse de contact indiquée sur la page de connexion de la plateforme ;"),
        bullet("ou par l'intermédiaire de votre point focal national."),
        p(
          "Afin de faciliter le traitement de votre demande, nous vous saurions gré d'indiquer dans votre message : votre nom complet, votre pays, votre institution, ainsi qu'une description précise de la difficulté rencontrée (accompagnée, si possible, du message d'erreur affiché)."
        ),
        p("Le Secrétariat vous remercie de votre collaboration et vous souhaite une excellente utilisation de la plateforme.", {
          run: { italics: true, color: "5A6E82" },
        }),
      ],
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DEE7F0" } },
              children: [
                new TextRun({
                  text: "Plateforme CTS-DSS · Guide du participant",
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
                  text: "© 2026 CEEAC-ECCAS · Comité Technique Spécialisé Défense, Sûreté et Sécurité — Page ",
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

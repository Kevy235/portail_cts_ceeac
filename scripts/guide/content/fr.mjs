/**
 * Guide utilisateur PDRS-CEEAC — contenu français (version de référence).
 * Syntaxe : **texte** = gras. Les libellés entre « » reprennent exactement
 * ceux de l'interface (src/i18n/fr.ts).
 */
export default {
  lang: "fr",
  file: "Guide-Utilisateur-PDRS-CEEAC-FR.docx",
  meta: {
    locale: "fr-FR",
    title: "Guide d'utilisation — PDRS-CEEAC",
    subject:
      "Guide d'utilisation du Portail Documentaire des Réunions Statutaires de la CEEAC à l'attention des délégués et experts des États membres",
    header: "Guide d'utilisation · Espace participant",
    footer: "© 2026 CEEAC-ECCAS · Portail Documentaire des Réunions Statutaires",
  },
  labels: {
    figure: "Figure",
    table: "Tableau",
    toc: "Table des matières",
    tocHint:
      "Si la table des matières n'apparaît pas, acceptez la mise à jour des champs proposée par Word à l'ouverture du document (ou clic droit › Mettre à jour les champs).",
    page: "Page",
  },
  cover: {
    community: "Communauté Économique des États de l'Afrique Centrale",
    secretariat: "Commission de la CEEAC · Secrétariat des réunions statutaires",
    platform: "Portail Documentaire des Réunions Statutaires de la CEEAC",
    title: "Guide d'utilisation",
    subtitle: "Espace participant et accès invité",
    version: "Version 3.0 — Octobre 2026",
    audience: "À l'attention des délégués et experts accrédités des États membres",
  },
  sheet: {
    title: "Fiche du document",
    rows: [
      ["Intitulé", "Guide d'utilisation de la plateforme PDRS-CEEAC — Espace participant"],
      ["Version", "3.0 — octobre 2026"],
      ["Public visé", "Délégués, experts et points focaux des États membres ; invités disposant des codes d'une réunion"],
      ["Langues", "Français · English · Português · Español"],
      ["Nouveautés de la version 3.0", "Lecteur de documents intégré (PDF et Word) ; accès cloisonné par réunion ; ajout d'une réunion par ses codes ; captures d'écran actualisées"],
      ["Contact", "Secrétariat de la CEEAC — adresse indiquée sur la page de connexion de la plateforme"],
    ],
  },
  chapters: [
    {
      title: "1. Présentation de la plateforme",
      blocks: [
        { p: "Le **PDRS-CEEAC** (Portail Documentaire des Réunions Statutaires de la CEEAC) est la plateforme officielle de mise à disposition des documents des réunions statutaires de la Communauté : Conférence des Chefs d'État et de Gouvernement, Conseil des Ministres, Comité des Ambassadeurs, Comités Techniques Spécialisés et autres réunions statutaires." },
        { p: "Mise en œuvre par la Commission de la CEEAC, elle offre aux délégués et experts des États membres :" },
        {
          bullets: [
            "la **lecture en ligne** des documents officiels directement dans la plateforme, grâce au lecteur intégré, sans téléchargement ni logiciel supplémentaire ;",
            "le **téléchargement** de chaque document dans les langues de la Communauté disponibles — français, anglais, portugais et espagnol ;",
            "le suivi du **calendrier des réunions statutaires** et les **fils de discussion** propres à chaque réunion ;",
            "la réception, par courrier électronique, des rapports et documents diffusés par le Secrétariat.",
          ],
        },
        { p: "Les documents sont accessibles **avant, pendant et après** chaque réunion. Chaque accès est **cloisonné** : les codes d'une réunion ne donnent accès qu'aux documents de cette réunion." },
        { box: { kind: "info", title: "Bon à savoir", text: "La plateforme fonctionne sur tout navigateur récent (Chrome, Edge, Firefox, Safari), depuis un ordinateur, une tablette ou un téléphone. Aucune installation n'est requise. L'adresse de la plateforme vous est communiquée par le Secrétariat de la CEEAC ou par votre point focal national." } },
      ],
    },
    {
      title: "2. Les modes d'accès",
      blocks: [
        { p: "En amont de chaque réunion statutaire, le Secrétariat transmet aux États membres deux codes d'accès : un **identifiant de réunion** (au format CEEAC-XXXXXX) et un **mot de passe d'accès** (au format XXXX-XXXX). Ces codes ouvrent deux niveaux d'accès :" },
        {
          bullets: [
            ["Accès invité", "vous saisissez les codes de réunion sur la page de connexion et consultez immédiatement les documents de la réunion, sans créer de compte (chapitre 3) ;"],
            ["Compte participant", "vous créez, si vous le souhaitez, votre compte personnel avec les mêmes codes. Il est nécessaire pour participer aux discussions, recevoir les diffusions par e-mail et regrouper plusieurs réunions dans un même espace (chapitre 4) ;"],
            ["Compte créé par le Secrétariat", "dans certains cas, le Secrétariat crée directement votre compte et vous remet un mot de passe provisoire, à personnaliser lors de votre première connexion (section 5.1)."],
          ],
        },
        {
          table: {
            caption: "Fonctionnalités disponibles selon le mode d'accès",
            head: ["Fonctionnalité", "Invité (codes de réunion)", "Participant (compte)"],
            widths: [50, 25, 25],
            center: [1, 2],
            rows: [
              ["Lire les documents dans le lecteur intégré", "Oui", "Oui"],
              ["Télécharger les documents (toutes langues disponibles)", "Oui", "Oui"],
              ["Rechercher et filtrer la bibliothèque", "Oui", "Oui"],
              ["Réunions accessibles", "La réunion des codes saisis", "Toutes les réunions ouvertes au compte"],
              ["Consulter le calendrier des réunions statutaires", "—", "Oui"],
              ["Participer aux fils de discussion", "—", "Oui"],
              ["Recevoir les rapports diffusés par e-mail", "—", "Oui"],
              ["Durée de l'accès", "24 heures, renouvelable", "Permanente"],
            ],
          },
        },
      ],
    },
    {
      title: "3. Accéder aux documents avec les codes de réunion (invité)",
      blocks: [
        { p: "Cette voie est la plus directe : elle ne requiert aucune création de compte et convient parfaitement à la consultation des documents d'une réunion." },
        {
          steps: [
            ["Ouvrez l'adresse de la plateforme dans votre navigateur."],
            ["Sur la page de connexion, sélectionnez l'onglet **« Codes de réunion »**."],
            ["Saisissez l'**identifiant de réunion** (CEEAC-XXXXXX) et le **mot de passe d'accès** reçus.", "Les majuscules sont appliquées automatiquement."],
            ["Cliquez sur **« Accéder aux documents »**.", "La bibliothèque de la réunion s'ouvre immédiatement."],
          ],
        },
        { figure: ["01b-connexion-codes.png", "L'onglet « Codes de réunion » de la page de connexion"] },
        { p: "En qualité d'invité, vous lisez et téléchargez librement l'ensemble des documents publiés pour la réunion. Un bandeau vous rappelle votre statut et vous propose, à tout moment, de créer votre compte participant." },
        { figure: ["03b-espace-invite.png", "L'espace documentaire en accès invité, avec le bandeau d'information"] },
        { box: { kind: "warning", title: "Durée et renouvellement de l'accès invité", text: "L'accès invité est valable 24 heures ; il suffit de saisir à nouveau les codes de réunion pour le renouveler. Si le Secrétariat renouvelle les accès d'une réunion, les anciens codes cessent immédiatement de fonctionner. Ne communiquez les codes qu'aux membres autorisés de votre délégation." } },
      ],
    },
    {
      title: "4. Créer votre compte participant (facultatif)",
      blocks: [
        { p: "La création d'un compte personnel n'est pas requise pour lire les documents. Elle ouvre en revanche les fonctionnalités de collaboration : fils de discussion des réunions, réception des rapports diffusés par e-mail et regroupement de plusieurs réunions dans votre espace. Les mêmes codes de réunion servent à l'inscription." },
        {
          steps: [
            ["Ouvrez la page d'inscription :", "lien « Inscrivez-vous ici » de la page de connexion ou lien « Créer mon compte » de l'espace invité."],
            ["Dans la rubrique **« Accès de la réunion »**, saisissez l'identifiant et le mot de passe de réunion reçus."],
            ["Dans la rubrique **« Vos informations »**, renseignez votre nom complet, votre adresse e-mail institutionnelle et votre pays.", "La fonction et l'institution sont facultatives."],
            ["Choisissez votre mot de passe personnel (8 caractères minimum) et confirmez-le."],
            ["Cliquez sur **« Créer mon compte »**.", "Vous êtes immédiatement connecté(e) et dirigé(e) vers la bibliothèque documentaire."],
          ],
        },
        { figure: ["02-inscription.png", "La page d'inscription : accès de la réunion, puis informations personnelles"] },
        { box: { kind: "info", title: "Important", text: ["Les codes de réunion servent uniquement à ouvrir l'accès. Une fois votre compte créé, vous vous connectez toujours avec **votre adresse e-mail et votre mot de passe personnel**.", "Les inscriptions sont closes lorsqu'une réunion est terminée ; ses documents restent néanmoins consultables avec les codes de réunion."] } },
      ],
    },
    {
      title: "5. Se connecter avec votre compte",
      blocks: [
        {
          steps: [
            ["Ouvrez l'adresse de la plateforme dans votre navigateur."],
            ["Dans l'onglet **« J'ai un compte »**, saisissez votre adresse e-mail et votre mot de passe."],
            ["Cliquez sur **« Se connecter »**."],
          ],
        },
        { figure: ["01-connexion.png", "La page de connexion — onglet « J'ai un compte »"] },
        { p: "Votre session de travail demeure active pendant 7 jours sur l'appareil utilisé. Pour vous déconnecter, cliquez sur l'icône de déconnexion située en haut à droite de l'écran, notamment sur un poste partagé." },
        { h2: "5.1. Première connexion avec un mot de passe provisoire" },
        { p: "Si votre compte a été créé par le Secrétariat, un mot de passe provisoire vous a été remis. Lors de votre première connexion, la plateforme vous invite à définir votre mot de passe personnel :" },
        {
          steps: [
            ["Connectez-vous avec votre adresse e-mail et le mot de passe provisoire reçu."],
            ["Saisissez le mot de passe provisoire, puis votre nouveau mot de passe (8 caractères minimum) et sa confirmation."],
            ["Cliquez sur **« Définir mon mot de passe »**.", "Vous accédez alors à votre espace."],
          ],
        },
        { figure: ["03-premiere-connexion.png", "L'écran de première connexion : définition du mot de passe personnel"] },
        { box: { kind: "security", title: "Sécurité de votre mot de passe", text: "Choisissez un mot de passe robuste et personnel (lettres, chiffres et caractères spéciaux). Il est conservé sous forme chiffrée : ni le Secrétariat ni l'administrateur ne peuvent le consulter. En cas d'oubli, sollicitez une réinitialisation auprès du Secrétariat de la CEEAC." } },
      ],
    },
    {
      title: "6. La bibliothèque documentaire",
      blocks: [
        { p: "La bibliothèque constitue votre page d'accueil. Elle rassemble les documents officiels publiés pour les réunions qui vous sont ouvertes, regroupés par statut de réunion (**réunion en cours**, **réunions à venir**, **réunions terminées**, puis **autres documents**)." },
        { figure: ["04-bibliotheque.png", "La bibliothèque documentaire : recherche, filtres, lecture et téléchargement par langue"] },
        { h2: "6.1. Rechercher et filtrer" },
        {
          bullets: [
            ["Recherche", "saisissez un ou plusieurs mots du titre ou du nom de fichier dans le champ « Rechercher un document… » ;"],
            ["Réunion", "le sélecteur « Toutes les réunions » restreint l'affichage aux documents d'une réunion donnée ;"],
            ["Catégorie", "cliquez sur une catégorie (Rapport, Résolution, Ordre du Jour, Note Conceptuelle…) ;"],
            ["Langue", "les boutons drapeaux n'affichent que les documents disponibles dans la langue choisie ;"],
            ["Réinitialisation", "le bouton « Réinitialiser les filtres » rétablit l'affichage complet ; le nombre de documents correspondants est indiqué à droite."],
          ],
        },
        { h2: "6.2. Lire ou télécharger un document" },
        { p: "Pour chaque document, deux actions sont proposées par version linguistique :" },
        {
          bullets: [
            ["Lire", "cliquez sur le **titre du document** ou sur le bouton **œil** : le document s'ouvre dans le lecteur intégré (chapitre 7) ;"],
            ["Télécharger", "cliquez sur le bouton de la langue souhaitée (drapeau et code FR, EN, PT, ES) : la progression s'affiche dans le bouton, puis le fichier est enregistré sur votre appareil."],
          ],
        },
        { p: "Seules les langues effectivement disponibles pour un document sont proposées. La mention « Version n » signale qu'un document a été mis à jour par le Secrétariat : la bibliothèque affiche toujours la version la plus récente." },
        { h2: "6.3. Les documents codés" },
        { p: "Certains documents sensibles portent le badge rouge **« Document codé »** : le fichier a été chiffré par le Secrétariat avant sa mise en ligne. Son ouverture nécessite la **clé de lecture** communiquée séparément, par un canal sécurisé. Si vous n'avez pas reçu cette clé, rapprochez-vous de votre point focal ou du Secrétariat de la CEEAC." },
      ],
    },
    {
      title: "7. Lire un document dans la plateforme",
      blocks: [
        { p: "Le **lecteur intégré** affiche les documents PDF et Word directement dans la plateforme, en plein écran, sans téléchargement ni logiciel supplémentaire. Il s'ouvre par un clic sur le titre d'un document ou sur le bouton œil ; par défaut, il présente la version dans la langue de l'interface lorsqu'elle existe." },
        { figure: ["04b-lecteur.png", "Le lecteur intégré : en-tête du document, versions linguistiques, téléchargement et barre d'outils"] },
        { h2: "7.1. Composition du lecteur" },
        {
          bullets: [
            ["En-tête", "titre du document, référence de la réunion, nom et taille du fichier, badge « Codé » le cas échéant ;"],
            ["Versions linguistiques", "les drapeaux FR · EN · PT · ES permettent de passer d'une langue à l'autre sans fermer le lecteur ;"],
            ["Télécharger", "le bouton « Télécharger » enregistre la version affichée sur votre appareil ;"],
            ["Barre d'outils", "navigation par page, zoom, rotation, recherche et plein écran ;"],
            ["Barre d'état", "nombre de pages, niveau de zoom et rappel des raccourcis clavier."],
          ],
        },
        { h2: "7.2. Naviguer et ajuster l'affichage" },
        {
          table: {
            caption: "Commandes de la barre d'outils du lecteur",
            head: ["Commande", "Effet"],
            widths: [32, 68],
            rows: [
              ["Flèches ‹ et ›", "Page précédente / page suivante."],
              ["Champ « n sur N »", "Saisissez un numéro de page puis appuyez sur Entrée pour vous y rendre directement."],
              ["Loupes − et +", "Réduire / agrandir l'affichage par paliers (50 % à 300 %)."],
              ["Liste du zoom", "« Ajuster à la largeur », « Page entière » ou un pourcentage précis."],
              ["Flèche circulaire", "Pivoter les pages d'un quart de tour (documents PDF)."],
              ["Loupe (à droite)", "Ouvrir la recherche dans le document."],
              ["Cadre (à droite)", "Passer en plein écran / quitter le plein écran."],
              ["Croix (en-tête)", "Fermer le lecteur et revenir à la bibliothèque."],
            ],
          },
        },
        { p: "Vous pouvez également faire défiler le document à la souris, au pavé tactile ou au doigt : le numéro de la page courante se met à jour automatiquement. Le texte des documents PDF peut être sélectionné et copié." },
        { h2: "7.3. Rechercher dans le document" },
        {
          steps: [
            ["Cliquez sur la loupe de la barre d'outils, ou appuyez sur **Ctrl + F**."],
            ["Saisissez un mot ou une expression, puis appuyez sur **Entrée**.", "La recherche ignore les majuscules et les accents."],
            ["Le lecteur affiche la première page concernée et met les passages en évidence. Appuyez de nouveau sur Entrée, ou utilisez les flèches ˄ ˅, pour passer d'un résultat à l'autre."],
          ],
        },
        { figure: ["04c-lecteur-recherche.png", "Recherche plein texte : résultat courant, nombre de résultats et passages surlignés"] },
        { h2: "7.4. Les documents Word" },
        { p: "Les documents Word récents (format .docx) sont affichés avec leur mise en forme : titres, paragraphes, tableaux et images. La recherche, le zoom et le téléchargement fonctionnent comme pour un PDF." },
        { figure: ["04d-lecteur-word.png", "Un document Word affiché dans le lecteur intégré"] },
        { h2: "7.5. Documents protégés par une clé de lecture" },
        { p: "Lorsqu'un document codé est un PDF protégé par mot de passe, le lecteur affiche l'écran **« Document protégé par une clé de lecture »**. Saisissez la clé transmise par le Secrétariat puis cliquez sur **« Ouvrir le document »**. La clé n'est ni enregistrée ni transmise : elle n'est utilisée que dans votre navigateur, le temps de la lecture. Si un document codé utilise un autre procédé de chiffrement, téléchargez-le et ouvrez-le avec l'outil indiqué par le Secrétariat." },
        { h2: "7.6. Formats non affichables" },
        { p: "Les fichiers Excel, PowerPoint et Word 97-2003 (.doc) ne sont pas affichés dans le lecteur : un message vous invite à les télécharger pour les ouvrir avec votre logiciel habituel." },
        {
          table: {
            caption: "Raccourcis clavier du lecteur",
            head: ["Touche", "Action"],
            widths: [32, 68],
            rows: [
              ["← / →", "Page précédente / page suivante"],
              ["+ / −", "Agrandir / réduire"],
              ["0", "Revenir au zoom par défaut"],
              ["Ctrl + molette", "Zoom progressif"],
              ["Ctrl + F", "Rechercher dans le document"],
              ["Échap", "Fermer la recherche, puis le lecteur"],
            ],
          },
        },
        { box: { kind: "info", title: "Lecture ou téléchargement ?", text: "La lecture dans la plateforme est recommandée pour consulter rapidement un document, notamment en séance ou sur un appareil partagé : le document n'est pas enregistré dans les fichiers de l'appareil. Téléchargez le document lorsque vous devez le conserver, l'annoter ou le consulter hors connexion." } },
      ],
    },
    {
      title: "8. Réunions statutaires et fils de discussion",
      blocks: [
        { p: "La page **« Réunions statutaires »** présente le calendrier des réunions qui vous sont ouvertes : organe statutaire, dates, lieu, statut (à venir, en cours, terminée), description et nombre de documents rattachés. Elle est réservée aux titulaires d'un compte participant." },
        { p: "Chaque réunion dispose d'un fil de discussion ouvert aux participants et au Secrétariat. Cliquez sur le bouton **« Discussion »** d'une réunion pour l'ouvrir :" },
        { figure: ["05-reunions-discussion.png", "Une réunion statutaire avec son fil de discussion ouvert"] },
        {
          bullets: [
            ["Écrire", "saisissez votre message dans le champ inférieur, puis appuyez sur Entrée ou cliquez sur le bouton d'envoi (2 000 caractères au maximum) ;"],
            ["Suivre", "les nouveaux messages apparaissent automatiquement, sans recharger la page ;"],
            ["Supprimer", "vous pouvez supprimer vos propres messages ; le Secrétariat assure la modération du fil."],
          ],
        },
        { h2: "8.1. Ajouter une réunion à votre compte" },
        { p: "Votre compte donne accès à la réunion au titre de laquelle vous vous êtes inscrit(e). Si vous recevez les codes d'une autre réunion, ajoutez-la à votre espace sans créer de nouveau compte :" },
        {
          steps: [
            ["Ouvrez la page « Réunions statutaires » et cliquez sur **« Ajouter une réunion »**."],
            ["Saisissez l'identifiant de réunion et le mot de passe d'accès reçus."],
            ["Cliquez sur **« Déverrouiller l'accès »**.", "La réunion et ses documents apparaissent aussitôt dans votre espace."],
          ],
        },
        { figure: ["05b-ajouter-reunion.png", "Le formulaire « Ajouter une réunion »"] },
        { box: { kind: "info", title: "Bonnes pratiques", text: "Le fil de discussion est un espace de travail officiel entre délégués accrédités. Nous vous invitons à y observer la courtoisie d'usage, à demeurer factuel et à n'y partager aucune information confidentielle non destinée à l'ensemble des participants." } },
      ],
    },
    {
      title: "9. Votre profil",
      blocks: [
        { p: "La page **« Mon profil »** récapitule les informations de votre accréditation : adresse e-mail, institution, pays représenté, fonction, date d'accréditation, statut et, le cas échéant, la réunion au titre de laquelle vous vous êtes inscrit(e)." },
        { figure: ["06-profil.png", "La page « Mon profil » : informations de votre accréditation"] },
        { box: { kind: "info", title: "Mise à jour de vos informations", text: "Par souci d'intégrité des données officielles, les informations d'accréditation ne sont pas modifiables directement. Pour toute correction (fonction, institution, adresse e-mail) ou pour un changement de mot de passe, adressez votre demande au Secrétariat de la CEEAC." } },
      ],
    },
    {
      title: "10. Confort de lecture et langue de l'interface",
      blocks: [
        { p: "Deux réglages sont disponibles en permanence dans la barre d'en-tête, y compris sur la page de connexion :" },
        { figure: ["07-entete-outils.png", "Les outils de l'en-tête : taille du texte, langues, profil et déconnexion", 620] },
        {
          bullets: [
            ["Taille du texte", "le bouton A agrandit le texte de toute la plateforme en trois paliers (A, A+, A++) ; votre réglage est conservé d'une visite à l'autre ;"],
            ["Langue de l'interface", "les boutons drapeaux (FR · EN · PT · ES) changent immédiatement la langue de l'interface, sans déconnexion. La langue des documents se choisit séparément, au moment de la lecture ou du téléchargement."],
          ],
        },
      ],
    },
    {
      title: "11. Le guide intégré",
      blocks: [
        { p: "Un guide abrégé est disponible à tout moment dans la plateforme : lien **« Guide utilisateur »** de la page de connexion, ou menu **« Guide »** de votre espace. Il résume les procédures essentielles et propose, lorsqu'il a été publié par le Secrétariat, le présent guide complet en lecture ou en téléchargement dans les quatre langues." },
        { figure: ["08-guide-integre.png", "Le guide intégré à la plateforme"] },
      ],
    },
    {
      title: "12. Les courriers électroniques de la plateforme",
      blocks: [
        { p: "À l'issue des réunions, le Secrétariat peut adresser aux participants les rapports et documents officiels par courrier électronique. Ces messages peuvent contenir :" },
        {
          bullets: [
            "des **liens directs**, par langue, vers les documents publiés sur la plateforme — une connexion à votre compte est nécessaire pour les ouvrir ;",
            "des **documents joints** directement au message.",
          ],
        },
        { box: { kind: "security", title: "Vigilance", text: "Les courriers officiels proviennent exclusivement de l'adresse du Secrétariat et renvoient uniquement vers l'adresse officielle de la plateforme. En cas de doute sur l'authenticité d'un message, abstenez-vous de cliquer et signalez-le au Secrétariat." } },
      ],
    },
    {
      title: "13. Sécurité et confidentialité",
      blocks: [
        {
          bullets: [
            "Ne communiquez jamais votre mot de passe personnel ; le Secrétariat ne vous le demandera jamais.",
            "Ne transmettez les codes de réunion qu'aux membres autorisés de votre délégation.",
            "Sur un poste partagé, préférez la lecture dans la plateforme au téléchargement et déconnectez-vous à la fin de votre consultation.",
            "Conservez les clés de lecture des documents codés séparément des documents eux-mêmes.",
            "Signalez sans délai au Secrétariat toute perte de codes, tout accès suspect ou tout message douteux.",
          ],
        },
      ],
    },
    {
      title: "14. Questions fréquentes",
      blocks: [
        {
          table: {
            caption: "Situations fréquentes et marche à suivre",
            head: ["Situation rencontrée", "Marche à suivre"],
            widths: [38, 62],
            rows: [
              ["« Identifiant ou mot de passe de réunion incorrect »", "Vérifiez l'identifiant (format CEEAC-XXXXXX) et le mot de passe (format XXXX-XXXX), tirets compris. Si le message persiste, les accès ont pu être renouvelés : rapprochez-vous de votre point focal national ou du Secrétariat."],
              ["« Accès invité expiré, saisissez à nouveau les codes de réunion »", "L'accès invité est valable 24 heures : saisissez de nouveau les codes de réunion pour le renouveler."],
              ["« Les inscriptions pour cette réunion sont closes »", "La réunion est terminée : la création de compte n'est plus possible, mais ses documents restent consultables avec les codes de réunion (onglet « Codes de réunion »)."],
              ["« Un compte existe déjà avec cet e-mail »", "Utilisez l'onglet « J'ai un compte » de la page de connexion. Pour accéder à une nouvelle réunion, utilisez « Ajouter une réunion » (section 8.1)."],
              ["« Identifiants incorrects » à la connexion", "Vérifiez l'adresse e-mail et le mot de passe (attention aux majuscules). Après plusieurs tentatives infructueuses, un délai d'attente de 15 minutes s'applique par mesure de sécurité."],
              ["« Votre compte est désactivé »", "Votre accréditation a été suspendue. Prenez l'attache du Secrétariat de la CEEAC pour en connaître les motifs et, le cas échéant, solliciter sa réactivation."],
              ["« Session expirée, veuillez vous reconnecter »", "Votre session a expiré (7 jours) ou votre mot de passe a été réinitialisé entre-temps : reconnectez-vous."],
              ["Un document attendu n'apparaît pas", "Il n'est peut-être pas encore publié, ou il relève d'une réunion qui ne vous est pas ouverte : ajoutez cette réunion avec ses codes (section 8.1). Pensez aussi à réinitialiser les filtres."],
              ["Le lecteur affiche « Aperçu non disponible pour ce format »", "Le fichier est au format Excel, PowerPoint ou Word 97-2003 : téléchargez-le pour l'ouvrir avec votre logiciel habituel."],
              ["Le lecteur demande une clé de lecture", "Le document est codé : saisissez la clé transmise par le Secrétariat. Si vous ne l'avez pas reçue, rapprochez-vous de votre point focal."],
              ["Le texte est trop petit à l'écran", "Utilisez le bouton A / A+ / A++ de l'en-tête, ou le zoom du lecteur pour les documents."],
              ["Mot de passe oublié", "Adressez une demande de réinitialisation au Secrétariat. Un mot de passe provisoire vous sera remis ; vous en définirez un nouveau à la connexion suivante."],
            ],
          },
        },
      ],
    },
    {
      title: "15. Assistance",
      blocks: [
        { p: "Pour toute difficulté d'accès, demande de réinitialisation de mot de passe, correction de vos informations d'accréditation ou question relative à la plateforme, le Secrétariat de la CEEAC demeure à votre disposition :" },
        {
          bullets: [
            "par courrier électronique, à l'adresse de contact indiquée sur la page de connexion et dans le guide intégré ;",
            "ou par l'intermédiaire de votre point focal national.",
          ],
        },
        { p: "Afin de faciliter le traitement de votre demande, merci d'indiquer votre nom complet, votre pays, votre institution, la réunion concernée et une description précise de la difficulté rencontrée, accompagnée si possible du message d'erreur affiché." },
        { p: "Le Secrétariat vous remercie de votre collaboration et vous souhaite une excellente utilisation de la plateforme.", run: {} },
      ],
    },
  ],
};

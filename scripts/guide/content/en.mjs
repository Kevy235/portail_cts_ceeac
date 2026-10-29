/**
 * PDRS-CEEAC user guide — English content (translated from fr.mjs).
 * Syntax: **text** = bold. Labels in “ ” match the interface strings
 * exactly (src/i18n/en.ts).
 */
export default {
  lang: "en",
  file: "Guide-Utilisateur-PDRS-CEEAC-EN.docx",
  meta: {
    locale: "en-GB",
    title: "User Guide — PDRS-CEEAC",
    subject:
      "User guide to the ECCAS Statutory Meetings Document Portal for delegates and experts of Member States",
    header: "User Guide · Participant area",
    footer: "© 2026 CEEAC-ECCAS · Statutory Meetings Document Portal",
  },
  labels: {
    figure: "Figure",
    table: "Table",
    toc: "Table of contents",
    tocHint:
      "If the table of contents does not appear, accept the field update offered by Word when the document opens (or right-click › Update Field).",
    page: "Page",
  },
  cover: {
    community: "Economic Community of Central African States",
    secretariat: "ECCAS Commission · Secretariat of Statutory Meetings",
    platform: "ECCAS Statutory Meetings Document Portal",
    title: "User Guide",
    subtitle: "Participant area and guest access",
    version: "Version 3.0 — October 2026",
    audience: "For accredited delegates and experts of Member States",
  },
  sheet: {
    title: "Document information",
    rows: [
      ["Title", "User guide to the PDRS-CEEAC platform — Participant area"],
      ["Version", "3.0 — October 2026"],
      ["Intended audience", "Delegates, experts and focal points of Member States; guests holding the codes of a meeting"],
      ["Languages", "Français · English · Português · Español"],
      ["New in version 3.0", "Built-in document viewer (PDF and Word); access restricted by meeting; adding a meeting with its codes; updated screenshots"],
      ["Contact", "ECCAS Secretariat — address shown on the platform sign-in page"],
    ],
  },
  chapters: [
    {
      title: "1. Overview of the platform",
      blocks: [
        { p: "**PDRS-CEEAC** (the ECCAS Statutory Meetings Document Portal) is the official platform for making available the documents of the Community's statutory meetings: the Conference of Heads of State and Government, the Council of Ministers, the Committee of Ambassadors, the Specialised Technical Committees and other statutory meetings." },
        { p: "Operated by the ECCAS Commission, it offers delegates and experts of Member States:" },
        {
          bullets: [
            "**online reading** of official documents directly within the platform, using the built-in viewer, with no download or additional software required;",
            "**download** of each document in the available Community languages — French, English, Portuguese and Spanish;",
            "access to the **calendar of statutory meetings** and to the **discussion threads** specific to each meeting;",
            "receipt, by e-mail, of the reports and documents circulated by the Secretariat.",
          ],
        },
        { p: "Documents are available **before, during and after** each meeting. Each access is **restricted**: the codes of a meeting give access only to the documents of that meeting." },
        { box: { kind: "info", title: "Good to know", text: "The platform works on any recent browser (Chrome, Edge, Firefox, Safari), from a computer, tablet or mobile phone. No installation is required. The platform address is provided by the ECCAS Secretariat or by your national focal point." } },
      ],
    },
    {
      title: "2. Access modes",
      blocks: [
        { p: "Ahead of each statutory meeting, the Secretariat sends Member States two access codes: a **meeting ID** (in the format CEEAC-XXXXXX) and an **access password** (in the format XXXX-XXXX). These codes provide two levels of access:" },
        {
          bullets: [
            ["Guest access", "you enter the meeting codes on the sign-in page and immediately view the meeting documents, without creating an account (Chapter 3);"],
            ["Participant account", "if you wish, you create your personal account with the same codes. An account is required to take part in discussions, receive e-mail circulations and group several meetings in a single area (Chapter 4);"],
            ["Account created by the Secretariat", "in some cases, the Secretariat creates your account directly and gives you a temporary password, which you personalise when you first sign in (Section 5.1)."],
          ],
        },
        {
          table: {
            caption: "Features available by access mode",
            head: ["Feature", "Guest (meeting codes)", "Participant (account)"],
            widths: [50, 25, 25],
            center: [1, 2],
            rows: [
              ["Read documents in the built-in viewer", "Yes", "Yes"],
              ["Download documents (all available languages)", "Yes", "Yes"],
              ["Search and filter the library", "Yes", "Yes"],
              ["Accessible meetings", "The meeting of the codes entered", "All meetings opened to the account"],
              ["View the calendar of statutory meetings", "—", "Yes"],
              ["Take part in discussion threads", "—", "Yes"],
              ["Receive reports circulated by e-mail", "—", "Yes"],
              ["Duration of access", "24 hours, renewable", "Permanent"],
            ],
          },
        },
      ],
    },
    {
      title: "3. Accessing documents with the meeting codes (guest)",
      blocks: [
        { p: "This is the most direct route: it requires no account and is ideally suited to consulting the documents of a meeting." },
        {
          steps: [
            ["Open the platform address in your browser."],
            ["On the sign-in page, select the **“Meeting codes”** tab."],
            ["Enter the **meeting ID** (CEEAC-XXXXXX) and the **access password** you received.", "Capital letters are applied automatically."],
            ["Click **“Access the documents”**.", "The meeting library opens immediately."],
          ],
        },
        { figure: ["01b-connexion-codes.png", "The “Meeting codes” tab of the sign-in page"] },
        { p: "As a guest, you may freely read and download all documents published for the meeting. A banner reminds you of your status and invites you, at any time, to create your participant account." },
        { figure: ["03b-espace-invite.png", "The document area in guest access, with the information banner"] },
        { box: { kind: "warning", title: "Duration and renewal of guest access", text: "Guest access is valid for 24 hours; simply enter the meeting codes again to renew it. If the Secretariat renews the access codes of a meeting, the previous codes stop working immediately. Share the codes only with authorised members of your delegation." } },
      ],
    },
    {
      title: "4. Creating your participant account (optional)",
      blocks: [
        { p: "A personal account is not required to read documents. It does, however, unlock the collaboration features: meeting discussion threads, receipt of reports circulated by e-mail and grouping of several meetings in your area. The same meeting codes are used to register." },
        {
          steps: [
            ["Open the registration page:", "the “Register here” link on the sign-in page or the “Create my account” link in the guest area."],
            ["In the **“Meeting access”** section, enter the meeting ID and password you received."],
            ["In the **“Your information”** section, enter your full name, your institutional e-mail address and your country.", "Position and institution are optional."],
            ["Choose your personal password (at least 8 characters) and confirm it."],
            ["Click **“Create my account”**.", "You are signed in immediately and taken to the document library."],
          ],
        },
        { figure: ["02-inscription.png", "The registration page: meeting access, then personal information"] },
        { box: { kind: "info", title: "Important", text: ["The meeting codes serve only to open access. Once your account has been created, you always sign in with **your e-mail address and personal password**.", "Registration closes once a meeting has ended; its documents nevertheless remain available with the meeting codes."] } },
      ],
    },
    {
      title: "5. Signing in to your account",
      blocks: [
        {
          steps: [
            ["Open the platform address in your browser."],
            ["In the **“I have an account”** tab, enter your e-mail address and password."],
            ["Click **“Sign in”**."],
          ],
        },
        { figure: ["01-connexion.png", "The sign-in page — “I have an account” tab"] },
        { p: "Your working session remains active for 7 days on the device used. To sign out, click the sign-out icon at the top right of the screen, particularly on a shared computer." },
        { h2: "5.1. First sign-in with a temporary password" },
        { p: "If your account was created by the Secretariat, you were given a temporary password. When you first sign in, the platform asks you to set your personal password:" },
        {
          steps: [
            ["Sign in with your e-mail address and the temporary password you received."],
            ["Enter the temporary password, then your new password (at least 8 characters) and its confirmation."],
            ["Click **“Set my password”**.", "You then access your area."],
          ],
        },
        { figure: ["03-premiere-connexion.png", "The first sign-in screen: setting your personal password"] },
        { box: { kind: "security", title: "Password security", text: "Choose a strong, personal password (letters, numbers and special characters). It is stored in encrypted form: neither the Secretariat nor the administrator can view it. If you forget it, request a reset from the ECCAS Secretariat." } },
      ],
    },
    {
      title: "6. The document library",
      blocks: [
        { p: "The library is your home page. It brings together the official documents published for the meetings open to you, grouped by meeting status (**ongoing meeting**, **upcoming meetings**, **completed meetings**, then **other documents**)." },
        { figure: ["04-bibliotheque.png", "The document library: search, filters, reading and download by language"] },
        { h2: "6.1. Searching and filtering" },
        {
          bullets: [
            ["Search", "enter one or more words from the title or file name in the “Search for a document…” field;"],
            ["Meeting", "the “All meetings” selector restricts the display to the documents of a given meeting;"],
            ["Category", "click a category (e.g. Rapport, Résolution, Ordre du Jour, Note Conceptuelle — names as defined by the Secretariat);"],
            ["Language", "the flag buttons display only the documents available in the selected language;"],
            ["Reset", "the “Reset filters” button restores the full display; the number of matching documents is shown on the right."],
          ],
        },
        { h2: "6.2. Reading or downloading a document" },
        { p: "For each document, two actions are offered for each language version:" },
        {
          bullets: [
            ["Read", "click the **document title** or the **eye** button: the document opens in the built-in viewer (Chapter 7);"],
            ["Download", "click the button for the desired language (flag and code FR, EN, PT, ES): progress is shown in the button, then the file is saved to your device."],
          ],
        },
        { p: "Only the languages actually available for a document are offered. The label “Version n” indicates that a document has been updated by the Secretariat: the library always displays the most recent version." },
        { h2: "6.3. Coded documents" },
        { p: "Certain sensitive documents bear the red **“Coded document”** badge: the file was encrypted by the Secretariat before being uploaded. Opening it requires the **reading key** communicated separately through a secure channel. If you have not received this key, please contact your focal point or the ECCAS Secretariat." },
      ],
    },
    {
      title: "7. Reading a document in the platform",
      blocks: [
        { p: "The **built-in viewer** displays PDF and Word documents directly within the platform, in full screen, with no download or additional software required. It opens when you click a document title or the eye button; by default, it shows the version in the interface language where available." },
        { figure: ["04b-lecteur.png", "The built-in viewer: document header, language versions, download and toolbar"] },
        { h2: "7.1. Layout of the viewer" },
        {
          bullets: [
            ["Header", "document title, meeting reference, file name and size, and the “Coded” badge where applicable;"],
            ["Language versions", "the FR · EN · PT · ES flags let you switch from one language to another without closing the viewer;"],
            ["Download", "the “Download” button saves the displayed version to your device;"],
            ["Toolbar", "page navigation, zoom, rotation, search and full screen;"],
            ["Status bar", "number of pages, zoom level and a reminder of the keyboard shortcuts."],
          ],
        },
        { h2: "7.2. Navigating and adjusting the display" },
        {
          table: {
            caption: "Viewer toolbar commands",
            head: ["Command", "Effect"],
            widths: [32, 68],
            rows: [
              ["Arrows ‹ and ›", "Previous page / next page."],
              ["“n of N” field", "Enter a page number and press Enter to go directly to it."],
              ["Magnifiers − and +", "Zoom out / zoom in by steps (50% to 300%)."],
              ["Zoom list", "“Fit to width”, “Whole page” or a specific percentage."],
              ["Circular arrow", "Rotate pages by a quarter turn (PDF documents)."],
              ["Magnifier (right)", "Open search within the document."],
              ["Frame (right)", "Enter / exit full screen."],
              ["Cross (header)", "Close the viewer and return to the library."],
            ],
          },
        },
        { p: "You can also scroll through the document with the mouse, touchpad or your finger: the current page number updates automatically. Text in PDF documents can be selected and copied." },
        { h2: "7.3. Searching within the document" },
        {
          steps: [
            ["Click the magnifier in the toolbar, or press **Ctrl + F**."],
            ["Enter a word or phrase, then press **Enter**.", "The search ignores capital letters and accents."],
            ["The viewer displays the first relevant page and highlights the matching passages. Press Enter again, or use the ˄ ˅ arrows, to move from one result to the next."],
          ],
        },
        { figure: ["04c-lecteur-recherche.png", "Full-text search: current result, number of results and highlighted passages"] },
        { h2: "7.4. Word documents" },
        { p: "Recent Word documents (.docx format) are displayed with their formatting: headings, paragraphs, tables and images. Search, zoom and download work as for a PDF." },
        { figure: ["04d-lecteur-word.png", "A Word document displayed in the built-in viewer"] },
        { h2: "7.5. Documents protected by a reading key" },
        { p: "When a coded document is a password-protected PDF, the viewer displays the **“Document protected by a reading key”** screen. Enter the key sent by the Secretariat, then click **“Open the document”**. The key is neither stored nor transmitted: it is used only within your browser, for the duration of reading. If a coded document uses another encryption method, download it and open it with the tool specified by the Secretariat." },
        { h2: "7.6. Formats that cannot be displayed" },
        { p: "Excel, PowerPoint and Word 97-2003 (.doc) files are not displayed in the viewer: a message invites you to download them and open them with your usual software." },
        {
          table: {
            caption: "Viewer keyboard shortcuts",
            head: ["Key", "Action"],
            widths: [32, 68],
            rows: [
              ["← / →", "Previous page / next page"],
              ["+ / −", "Zoom in / zoom out"],
              ["0", "Return to the default zoom"],
              ["Ctrl + mouse wheel", "Gradual zoom"],
              ["Ctrl + F", "Search within the document"],
              ["Esc", "Close the search, then the viewer"],
            ],
          },
        },
        { box: { kind: "info", title: "Read or download?", text: "Reading within the platform is recommended for quickly consulting a document, particularly during a session or on a shared device: the document is not saved to the device's files. Download the document when you need to keep it, annotate it or consult it offline." } },
      ],
    },
    {
      title: "8. Statutory meetings and discussion threads",
      blocks: [
        { p: "The **“Statutory meetings”** page presents the calendar of the meetings open to you: statutory body, dates, venue, status (upcoming, ongoing, completed), description and number of attached documents. It is reserved for holders of a participant account." },
        { p: "Each meeting has a discussion thread open to participants and the Secretariat. Click the **“Discussion”** button of a meeting to open it:" },
        { figure: ["05-reunions-discussion.png", "A statutory meeting with its discussion thread open"] },
        {
          bullets: [
            ["Write", "type your message in the field at the bottom, then press Enter or click the send button (2,000 characters maximum);"],
            ["Follow", "new messages appear automatically, without reloading the page;"],
            ["Delete", "you may delete your own messages; the Secretariat moderates the thread."],
          ],
        },
        { h2: "8.1. Adding a meeting to your account" },
        { p: "Your account gives access to the meeting for which you registered. If you receive the codes of another meeting, add it to your area without creating a new account:" },
        {
          steps: [
            ["Open the “Statutory meetings” page and click **“Add a meeting”**."],
            ["Enter the meeting ID and access password you received."],
            ["Click **“Unlock access”**.", "The meeting and its documents appear in your area straight away."],
          ],
        },
        { figure: ["05b-ajouter-reunion.png", "The “Add a meeting” form"] },
        { box: { kind: "info", title: "Good practice", text: "The discussion thread is an official working space between accredited delegates. Please observe customary courtesy, remain factual and do not share any confidential information not intended for all participants." } },
      ],
    },
    {
      title: "9. Your profile",
      blocks: [
        { p: "The **“My profile”** page summarises your accreditation details: e-mail address, institution, country represented, position, accreditation date, status and, where applicable, the meeting for which you registered." },
        { figure: ["06-profil.png", "The “My profile” page: your accreditation details"] },
        { box: { kind: "info", title: "Updating your details", text: "To preserve the integrity of official data, accreditation details cannot be edited directly. For any correction (position, institution, e-mail address) or to change your password, please send your request to the ECCAS Secretariat." } },
      ],
    },
    {
      title: "10. Reading comfort and interface language",
      blocks: [
        { p: "Two settings are always available in the header bar, including on the sign-in page:" },
        { figure: ["07-entete-outils.png", "Header tools: text size, languages, profile and sign-out", 620] },
        {
          bullets: [
            ["Text size", "the A button enlarges the text throughout the platform in three steps (A, A+, A++); your setting is kept from one visit to the next;"],
            ["Interface language", "the flag buttons (FR · EN · PT · ES) change the interface language immediately, without signing out. The language of documents is chosen separately, when reading or downloading."],
          ],
        },
      ],
    },
    {
      title: "11. The built-in guide",
      blocks: [
        { p: "A short guide is available at any time within the platform: the **“User guide”** link on the sign-in page, or the **“Guide”** menu in your area. It summarises the essential procedures and, where published by the Secretariat, offers this full guide for reading or download in the four languages." },
        { figure: ["08-guide-integre.png", "The guide built into the platform"] },
      ],
    },
    {
      title: "12. E-mails from the platform",
      blocks: [
        { p: "After meetings, the Secretariat may send participants the official reports and documents by e-mail. These messages may contain:" },
        {
          bullets: [
            "**direct links**, by language, to the documents published on the platform — you must sign in to your account to open them;",
            "**documents attached** directly to the message.",
          ],
        },
        { box: { kind: "security", title: "Vigilance", text: "Official e-mails come exclusively from the Secretariat's address and link only to the official platform address. If in doubt about the authenticity of a message, do not click on it and report it to the Secretariat." } },
      ],
    },
    {
      title: "13. Security and confidentiality",
      blocks: [
        {
          bullets: [
            "Never disclose your personal password; the Secretariat will never ask you for it.",
            "Share the meeting codes only with authorised members of your delegation.",
            "On a shared computer, prefer reading within the platform to downloading, and sign out at the end of your session.",
            "Keep the reading keys for coded documents separate from the documents themselves.",
            "Report any loss of codes, suspicious access or doubtful message to the Secretariat without delay.",
          ],
        },
      ],
    },
    {
      title: "14. Frequently asked questions",
      blocks: [
        {
          table: {
            caption: "Common situations and what to do",
            head: ["Situation", "What to do"],
            widths: [38, 62],
            rows: [
              ["“Incorrect meeting ID or password”", "Check the ID (format CEEAC-XXXXXX) and the password (format XXXX-XXXX), including the hyphens. If the message persists, the access codes may have been renewed: contact your national focal point or the Secretariat."],
              ["Guest access has expired and the meeting codes are requested again", "Guest access is valid for 24 hours: enter the meeting codes again to renew it."],
              ["“Registration for this meeting is closed”", "The meeting has ended: account creation is no longer possible, but its documents remain available with the meeting codes (“Meeting codes” tab)."],
              ["“An account already exists with this e-mail”", "Use the “I have an account” tab on the sign-in page. To access a new meeting, use “Add a meeting” (Section 8.1)."],
              ["“Invalid credentials” when signing in", "Check your e-mail address and password (mind capital letters). After several unsuccessful attempts, a 15-minute waiting period applies as a security measure."],
              ["“Your account is disabled”", "Your accreditation has been suspended. Contact the ECCAS Secretariat to learn the reasons and, where appropriate, request its reactivation."],
              ["Session expired, you are asked to sign in again", "Your session has expired (7 days) or your password has been reset in the meantime: sign in again."],
              ["An expected document does not appear", "It may not yet be published, or it may belong to a meeting not open to you: add that meeting with its codes (Section 8.1). Also remember to reset the filters."],
              ["The viewer displays “Preview not available for this format”", "The file is in Excel, PowerPoint or Word 97-2003 format: download it and open it with your usual software."],
              ["The viewer asks for a reading key", "The document is coded: enter the key sent by the Secretariat. If you have not received it, contact your focal point."],
              ["The text is too small on screen", "Use the A / A+ / A++ button in the header, or the viewer zoom for documents."],
              ["Forgotten password", "Send a reset request to the Secretariat. You will be given a temporary password; you will set a new one the next time you sign in."],
            ],
          },
        },
      ],
    },
    {
      title: "15. Support",
      blocks: [
        { p: "For any access difficulty, password reset request, correction of your accreditation details or question about the platform, the ECCAS Secretariat remains at your disposal:" },
        {
          bullets: [
            "by e-mail, at the contact address shown on the sign-in page and in the built-in guide;",
            "or through your national focal point.",
          ],
        },
        { p: "To help process your request, please state your full name, country, institution, the meeting concerned and a precise description of the difficulty encountered, accompanied if possible by the error message displayed." },
        { p: "The Secretariat thanks you for your cooperation and wishes you a productive use of the platform.", run: {} },
      ],
    },
  ],
};

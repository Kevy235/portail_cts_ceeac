export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: "schema initial",
    sql: `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('admin','participant')),
        country TEXT NOT NULL DEFAULT '',
        function_title TEXT NOT NULL DEFAULT '',
        institution TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'en-attente' CHECK (status IN ('actif','en-attente','inactif')),
        must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_users_role ON users(role);

      CREATE TABLE cts_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        start_date DATE NOT NULL,
        end_date DATE,
        status TEXT NOT NULL DEFAULT 'à-venir' CHECK (status IN ('à-venir','en-cours','terminé')),
        reference TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        expected_participants INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        position INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        session_id UUID REFERENCES cts_sessions(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('publié','brouillon')),
        file_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_documents_status ON documents(status);
      CREATE INDEX idx_documents_session ON documents(session_id);

      CREATE TABLE document_downloads (
        id BIGSERIAL PRIMARY KEY,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_downloads_document ON document_downloads(document_id);
      CREATE INDEX idx_downloads_date ON document_downloads(created_at);

      CREATE TABLE activity_log (
        id BIGSERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        detail TEXT NOT NULL DEFAULT '',
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_activity_date ON activity_log(created_at DESC);

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      );
    `,
  },
  {
    id: 2,
    name: "données de référence",
    sql: `
      INSERT INTO categories (name, position) VALUES
        ('Rapport', 1),
        ('Résolution', 2),
        ('Ordre du Jour', 3),
        ('Note Conceptuelle', 4),
        ('Instrument Juridique', 5),
        ('Document Stratégique', 6),
        ('Communiqué', 7)
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO settings (key, value) VALUES
        ('platform_name', 'CEEAC · DAPPS'),
        ('platform_subtitle', 'Plateforme CTS-APPS'),
        ('org_full_name', 'Comité Technique Spécialisé des Affaires Politiques, Paix et Sécurité'),
        ('org_description', 'Plateforme d''accès aux documents et ressources du DAPPS — CEEAC'),
        ('contact_email', 'dapps@ceeac-eccas.org'),
        ('footer_text', '© 2025 CEEAC-ECCAS · Département Affaires Politiques, Paix et Sécurité'),
        ('login_notice', 'Accès réservé aux experts accrédités et aux administrateurs')
      ON CONFLICT (key) DO NOTHING;
    `,
  },
  {
    id: 3,
    name: "multilinguisme et discussions",
    sql: `
      -- Préférences de langue des utilisateurs
      ALTER TABLE users
        ADD COLUMN ui_lang TEXT NOT NULL DEFAULT 'fr' CHECK (ui_lang IN ('fr','en','pt','es')),
        ADD COLUMN doc_langs TEXT[] NOT NULL DEFAULT ARRAY['fr','en','pt','es'];

      -- Un document = un jeu de métadonnées + un fichier par langue
      CREATE TABLE document_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        lang TEXT NOT NULL CHECK (lang IN ('fr','en','pt','es')),
        file_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (document_id, lang)
      );

      -- Reprise des fichiers existants comme version française
      INSERT INTO document_files (document_id, lang, file_name, stored_name, file_size, mime_type)
      SELECT id, 'fr', file_name, stored_name, file_size, mime_type FROM documents;

      ALTER TABLE documents
        DROP COLUMN file_name,
        DROP COLUMN stored_name,
        DROP COLUMN file_size,
        DROP COLUMN mime_type;

      ALTER TABLE document_downloads
        ADD COLUMN lang TEXT NOT NULL DEFAULT 'fr';

      -- Fil de discussion par session
      CREATE TABLE session_messages (
        id BIGSERIAL PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES cts_sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_messages_session ON session_messages(session_id, id);

      -- Contenus du portail par langue
      ALTER TABLE settings ADD COLUMN lang TEXT NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr','en','pt','es'));
      ALTER TABLE settings DROP CONSTRAINT settings_pkey;
      ALTER TABLE settings ADD PRIMARY KEY (key, lang);
    `,
  },
  {
    id: 4,
    name: "contenus du portail traduits (en, pt, es)",
    sql: `
      INSERT INTO settings (key, lang, value) VALUES
        ('platform_name', 'en', 'ECCAS · DPAPS'),
        ('platform_subtitle', 'en', 'STC-PAPS Platform'),
        ('org_full_name', 'en', 'Specialized Technical Committee on Political Affairs, Peace and Security'),
        ('org_description', 'en', 'Document and resource access platform of the DPAPS — ECCAS'),
        ('contact_email', 'en', 'dapps@ceeac-eccas.org'),
        ('footer_text', 'en', '© 2025 ECCAS-CEEAC · Department of Political Affairs, Peace and Security'),
        ('login_notice', 'en', 'Access restricted to accredited experts and administrators'),

        ('platform_name', 'pt', 'CEEAC · DAPPS'),
        ('platform_subtitle', 'pt', 'Plataforma CTE-APPS'),
        ('org_full_name', 'pt', 'Comité Técnico Especializado para os Assuntos Políticos, Paz e Segurança'),
        ('org_description', 'pt', 'Plataforma de acesso aos documentos e recursos do DAPPS — CEEAC'),
        ('contact_email', 'pt', 'dapps@ceeac-eccas.org'),
        ('footer_text', 'pt', '© 2025 CEEAC-ECCAS · Departamento dos Assuntos Políticos, Paz e Segurança'),
        ('login_notice', 'pt', 'Acesso reservado aos peritos acreditados e aos administradores'),

        ('platform_name', 'es', 'CEEAC · DAPPS'),
        ('platform_subtitle', 'es', 'Plataforma CTE-APPS'),
        ('org_full_name', 'es', 'Comité Técnico Especializado de Asuntos Políticos, Paz y Seguridad'),
        ('org_description', 'es', 'Plataforma de acceso a los documentos y recursos del DAPPS — CEEAC'),
        ('contact_email', 'es', 'dapps@ceeac-eccas.org'),
        ('footer_text', 'es', '© 2025 CEEAC-ECCAS · Departamento de Asuntos Políticos, Paz y Seguridad'),
        ('login_notice', 'es', 'Acceso reservado a los expertos acreditados y a los administradores')
      ON CONFLICT (key, lang) DO NOTHING;
    `,
  },
  {
    id: 5,
    name: "accès par session, révocation de jetons, documents codés",
    sql: `
      -- Révocation des jetons (incrémenté à chaque changement de mot de passe)
      ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

      -- Session via laquelle un participant s'est auto-inscrit
      ALTER TABLE users ADD COLUMN origin_session_id UUID REFERENCES cts_sessions(id) ON DELETE SET NULL;
      CREATE INDEX idx_users_origin_session ON users(origin_session_id);

      -- Identifiant + mot de passe d'accès générés pour chaque session CTS,
      -- transmis aux États membres pour l'auto-inscription des participants.
      ALTER TABLE cts_sessions
        ADD COLUMN access_code TEXT UNIQUE,
        ADD COLUMN access_password TEXT NOT NULL DEFAULT '';

      UPDATE cts_sessions SET
        access_code = 'CTS-' || upper(substr(md5(random()::text || id::text), 1, 6)),
        access_password = upper(substr(md5(random()::text || id::text), 9, 10))
      WHERE access_code IS NULL;

      ALTER TABLE cts_sessions ALTER COLUMN access_code SET NOT NULL;

      -- Document codé (chiffré par l'administrateur avant téléversement)
      ALTER TABLE documents ADD COLUMN is_coded BOOLEAN NOT NULL DEFAULT FALSE;
    `,
  },
  {
    id: 6,
    name: "renommage CTS-DSS et guide utilisateur téléchargeable",
    sql: `
      -- Nouvel intitulé : Comité Technique Spécialisé Défense, Sûreté et Sécurité
      UPDATE settings SET value = CASE key
        WHEN 'platform_name' THEN 'CEEAC · CTS-DSS'
        WHEN 'platform_subtitle' THEN 'Plateforme CTS-DSS'
        WHEN 'org_full_name' THEN 'Comité Technique Spécialisé Défense, Sûreté et Sécurité'
        WHEN 'org_description' THEN 'Plateforme d''accès aux documents et ressources du CTS-DSS — CEEAC'
        WHEN 'footer_text' THEN '© 2025 CEEAC-ECCAS · Comité Technique Spécialisé Défense, Sûreté et Sécurité'
      END
      WHERE lang = 'fr' AND key IN ('platform_name','platform_subtitle','org_full_name','org_description','footer_text');

      UPDATE settings SET value = CASE key
        WHEN 'platform_name' THEN 'ECCAS · STC-DSS'
        WHEN 'platform_subtitle' THEN 'STC-DSS Platform'
        WHEN 'org_full_name' THEN 'Specialised Technical Committee on Defence, Safety and Security'
        WHEN 'org_description' THEN 'Document and resource access platform of the STC-DSS — ECCAS'
        WHEN 'footer_text' THEN '© 2025 ECCAS-CEEAC · Specialised Technical Committee on Defence, Safety and Security'
      END
      WHERE lang = 'en' AND key IN ('platform_name','platform_subtitle','org_full_name','org_description','footer_text');

      UPDATE settings SET value = CASE key
        WHEN 'platform_name' THEN 'CEEAC · CTE-DSS'
        WHEN 'platform_subtitle' THEN 'Plataforma CTE-DSS'
        WHEN 'org_full_name' THEN 'Comité Técnico Especializado de Defesa, Proteção e Segurança'
        WHEN 'org_description' THEN 'Plataforma de acesso aos documentos e recursos do CTE-DSS — CEEAC'
        WHEN 'footer_text' THEN '© 2025 CEEAC-ECCAS · Comité Técnico Especializado de Defesa, Proteção e Segurança'
      END
      WHERE lang = 'pt' AND key IN ('platform_name','platform_subtitle','org_full_name','org_description','footer_text');

      UPDATE settings SET value = CASE key
        WHEN 'platform_name' THEN 'CEEAC · CTE-DSS'
        WHEN 'platform_subtitle' THEN 'Plataforma CTE-DSS'
        WHEN 'org_full_name' THEN 'Comité Técnico Especializado de Defensa, Protección y Seguridad'
        WHEN 'org_description' THEN 'Plataforma de acceso a los documentos y recursos del CTE-DSS — CEEAC'
        WHEN 'footer_text' THEN '© 2025 CEEAC-ECCAS · Comité Técnico Especializado de Defensa, Protección y Seguridad'
      END
      WHERE lang = 'es' AND key IN ('platform_name','platform_subtitle','org_full_name','org_description','footer_text');

      -- Guide utilisateur téléchargeable : un fichier par langue, géré par l'admin
      CREATE TABLE guide_files (
        lang TEXT PRIMARY KEY CHECK (lang IN ('fr','en','pt','es')),
        file_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  },
];

export const LANGS = ["fr", "en", "pt", "es"] as const;
export type Lang = (typeof LANGS)[number];

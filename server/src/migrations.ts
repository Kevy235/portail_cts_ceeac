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
];

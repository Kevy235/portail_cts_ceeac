/**
 * Base PostgreSQL de développement local (aucune installation requise).
 * Lance un PostgreSQL embarqué sur le port 5432 avec la base `portail_cts`,
 * correspondant au DATABASE_URL par défaut du serveur.
 *
 * Usage : node scripts/dev-db.mjs   (laisser tourner, Ctrl+C pour arrêter)
 * Prérequis : npm i --no-save embedded-postgres
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";

const pg = new EmbeddedPostgres({
  databaseDir: path.resolve(".pgdata-dev"),
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

const initialised = await pg
  .initialise()
  .then(() => true)
  .catch(() => false); // déjà initialisée lors d'un lancement précédent

await pg.start();
if (initialised) {
  await pg.createDatabase("portail_cts");
}

console.log(
  "\nPostgreSQL de développement prêt : postgresql://postgres:postgres@localhost:5432/portail_cts"
);
console.log("Laissez cette fenêtre ouverte, puis lancez `npm run dev`. Ctrl+C pour arrêter.\n");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

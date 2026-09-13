import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ensureSchema } from './db.js';
import { savesRouter } from './routes/saves.js';

const PORT = Number(process.env.PORT ?? 3000);
const PACKAGE_JSON_PATH = fileURLToPath(new URL('../package.json', import.meta.url));
const VERSION = (JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')) as { version: string }).version;

const app = express();
app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', version: VERSION });
});

app.use('/api/saves', savesRouter);

// No Kubernetes, o Postgres pode ainda não aceitar conexões quando este processo sobe (mesmo
// namespace, mas sem garantia de ordem entre pods) - sem retry, ensureSchema() lançava na
// primeira tentativa e o processo morria (process.exit), dependendo do proprio restart do
// Kubernetes tentar de novo ate o Postgres ficar pronto por acaso.
const SCHEMA_RETRY_ATTEMPTS = 10;
const SCHEMA_RETRY_DELAY_MS = 2000;

async function ensureSchemaWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= SCHEMA_RETRY_ATTEMPTS; attempt++) {
    try {
      await ensureSchema();
      return;
    } catch (err) {
      if (attempt === SCHEMA_RETRY_ATTEMPTS) throw err;
      console.warn(
        `Postgres ainda não está pronto (tentativa ${attempt}/${SCHEMA_RETRY_ATTEMPTS}), tentando de novo em ${SCHEMA_RETRY_DELAY_MS}ms...`,
        err,
      );
      await new Promise((resolve) => setTimeout(resolve, SCHEMA_RETRY_DELAY_MS));
    }
  }
}

async function main() {
  await ensureSchemaWithRetry();
  app.listen(PORT, () => {
    console.log(`lonewolf-api listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start lonewolf-api:', err);
  process.exit(1);
});

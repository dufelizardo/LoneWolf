import express from 'express';
import { ensureSchema } from './db.js';
import { savesRouter } from './routes/saves.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

app.use('/api/saves', savesRouter);

async function main() {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`lonewolf-api listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start lonewolf-api:', err);
  process.exit(1);
});

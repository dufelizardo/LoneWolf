import { Router, type Request, type Response } from 'express';
import { pool } from '../db.js';
import { generateSaveCode } from '../codeGenerator.js';

export const savesRouter = Router();

const UNIQUE_VIOLATION = '23505';
const MAX_INSERT_ATTEMPTS = 5;

savesRouter.post('/', async (req: Request, res: Response) => {
  const chart = req.body;
  if (!chart || typeof chart !== 'object') {
    res.status(400).json({ error: 'Missing chart in request body' });
    return;
  }

  for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt++) {
    const code = generateSaveCode();
    try {
      await pool.query('INSERT INTO saves (code, chart) VALUES ($1, $2)', [code, chart]);
      res.status(201).json({ code });
      return;
    } catch (err: unknown) {
      if ((err as { code?: string }).code === UNIQUE_VIOLATION) continue;
      throw err;
    }
  }
  res.status(500).json({ error: 'Could not generate a unique save code, try again' });
});

savesRouter.get('/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  const result = await pool.query('SELECT chart FROM saves WHERE code = $1', [code]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Save not found' });
    return;
  }
  res.json({ chart: result.rows[0].chart });
});

savesRouter.put('/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  const chart = req.body;
  if (!chart || typeof chart !== 'object') {
    res.status(400).json({ error: 'Missing chart in request body' });
    return;
  }
  const result = await pool.query(
    'UPDATE saves SET chart = $1, updated_at = now() WHERE code = $2',
    [chart, code],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: 'Save not found' });
    return;
  }
  res.status(204).send();
});

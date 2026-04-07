import express, { Request, Response } from 'express';
import { supabase } from './supabaseClient';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Express + Supabase backend is running');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/users', async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('users').select('*').limit(10);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ data });
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});

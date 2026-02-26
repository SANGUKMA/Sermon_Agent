import type { VercelRequest } from '@vercel/node';
import { supabaseAdmin } from './supabaseAdmin';

export async function verifyUser(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }

  return data.user.id;
}

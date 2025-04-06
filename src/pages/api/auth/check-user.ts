/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// pages/api/auth/check-user.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // only use on server
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    const user = users.find((u: { email: string }) => u.email === email);

    return res.status(200).json({ exists: Boolean(user) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to check user" });
  }
}

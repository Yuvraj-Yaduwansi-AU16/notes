import { type NextApiRequest, type NextApiResponse } from "next";
import { supabase } from "~/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await supabase.auth.signOut(); // Ensure Supabase session is destroyed

    res.setHeader(
      "Set-Cookie",
      "next-auth.session-token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Logout failed" });
  }
}

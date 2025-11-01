import supabase from "../../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "PATCH") {
      res.setHeader("Allow", ["PATCH"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { id } = req.query || {};
    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    const userId = String(id);

    // Fetch current user
    const { data: user, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchErr && !/PGRST116|Row not found/i.test(fetchErr.message || "")) {
      return res.status(400).json({ error: fetchErr.message || "Query error" });
    }
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    if (!user.banned) {
      return res.status(400).json({ error: "User ini tidak sedang diblokir." });
    }

    // Update: set banned=false and clear bannedAt
    const patch = { banned: false, bannedAt: null };

    const { data: updatedUser, error: updateErr } = await supabase
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select()
      .single();

    if (updateErr) {
      return res.status(400).json({ error: updateErr.message || "Gagal membuka blokir user" });
    }

    // Return success with updated user
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (e) {
    return res.status(400).json({ error: "Bad Request" });
  }
}
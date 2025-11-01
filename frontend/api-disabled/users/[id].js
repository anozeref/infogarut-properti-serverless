import supabase from "../../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }
    const userId = String(id);

    if (req.method === "GET") {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If not found
        if ((error.message || "").match(/PGRST116|Row not found/i)) {
          return res.status(404).json({ error: "User tidak ditemukan" });
        }
        return res.status(400).json({ error: error.message || "Query error" });
      }

      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      return res.status(200).json(user);
    }

    if (req.method === "PATCH") {
      const patch = req.body || {};
      // prevent id override
      if (Object.prototype.hasOwnProperty.call(patch, "id")) {
        delete patch.id;
      }

      if (!patch || Object.keys(patch).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update(patch)
        .eq("id", userId)
        .select()
        .single();

      if (updateErr) {
        // If not found
        if ((updateErr.message || "").match(/PGRST116|Row not found/i)) {
          return res.status(404).json({ error: "User tidak ditemukan" });
        }
        return res.status(400).json({ error: updateErr.message || "Failed to update user" });
      }

      return res.status(200).json(updated);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    return res.status(400).json({ error: "Bad Request" });
  }
}
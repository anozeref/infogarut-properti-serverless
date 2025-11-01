import supabase from "../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "Missing id param" });

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", String(id))
        .single();
      if (error) {
        console.error("Properties [id] GET error");
        return res.status(404).json({ error: error.message || "Not found" });
      }
      return res.status(200).json(data);
    }

    if (req.method === "PATCH") {
      const updated = req.body || {};
      const { data, error } = await supabase
        .from("properties")
        .update(updated)
        .eq("id", String(id))
        .select()
        .single();

      if (error) {
        console.error("Properties [id] PATCH error");
        return res.status(400).json({ error: error.message || "Update error" });
      }
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", String(id));

      if (error) {
        console.error("Properties [id] DELETE error");
        return res.status(400).json({ error: error.message || "Delete error" });
      }
      return res.status(200).json({});
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Properties [id] route exception");
    return res.status(400).json({ error: "Bad Request" });
  }
}
import supabase from "../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "Missing id param" });

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", String(id))
        .single();
      if (error) {
        console.error("Notifications [id] GET error");
        return res.status(404).json({ error: error.message || "Not found" });
      }
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", String(id));
      if (error) {
        console.error("Notifications [id] DELETE error");
        return res.status(400).json({ error: error.message || "Delete error" });
      }
      // JSON Server-compatible: return empty object
      return res.status(200).json({});
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Notifications [id] route exception");
    return res.status(400).json({ error: "Bad Request" });
  }
}
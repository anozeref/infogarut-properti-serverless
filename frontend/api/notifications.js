import supabase from "./_lib/supabase.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { userId, _sort, _order } = req.query || {};
      let query = supabase.from("notifications").select("*");
      if (userId) query = query.eq("userId", String(userId));
      if (_sort) {
        const asc = String(_order || "asc").toLowerCase() !== "desc";
        query = query.order(_sort, { ascending: asc });
      }
      const { data, error } = await query;
      if (error) {
        console.error("Notifications GET error");
        return res.status(400).json({ error: error.message || "Query error" });
      }
      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const payload = {
        userId: body.userId,
        text: body.text || "",
        link: body.link || null,
        isRead: Boolean(body.isRead ?? false),
        createdAt: body.createdAt || new Date().toISOString(),
      };
      if (!payload.userId || !payload.text) {
        return res.status(400).json({ error: "Missing required fields: userId, text" });
      }
      const { data: created, error } = await supabase
        .from("notifications")
        .insert([payload])
        .select()
        .single();
      if (error) {
        console.error("Notifications POST insert error");
        return res.status(400).json({ error: error.message || "Insert error" });
      }
      return res.status(201).json(created);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Notifications route exception");
    return res.status(400).json({ error: "Bad Request" });
  }
}
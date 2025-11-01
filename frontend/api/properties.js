import supabase from "./_lib/supabase.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { ownerId, statusPostingan, _sort, _order } = req.query || {};
      let query = supabase.from("properties").select("*");

      if (ownerId) query = query.eq("ownerId", String(ownerId));
      if (statusPostingan) query = query.eq("statusPostingan", String(statusPostingan));
      if (_sort) {
        const ascending = String(_order || "asc").toLowerCase() !== "desc";
        query = query.order(_sort, { ascending });
      }

      const { data, error } = await query;
      if (error) {
        console.error("Properties GET error");
        return res.status(400).json({ error: error.message || "Query error" });
      }
      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const now = new Date();
      const ddmmyyyy = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      const payload = {
        postedAt: body.postedAt || ddmmyyyy,
        ...body,
      };

      const { data: created, error } = await supabase
        .from("properties")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Properties POST insert error");
        return res.status(400).json({ error: error.message || "Insert error" });
      }
      return res.status(201).json(created);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Properties route exception");
    return res.status(400).json({ error: "Bad Request" });
  }
}
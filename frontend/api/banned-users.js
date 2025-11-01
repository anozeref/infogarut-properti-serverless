import supabase from "./_lib/supabase.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("banned", true);

      if (error) {
        return res.status(400).json({ error: error.message || "Query error" });
      }
      return res.status(200).json(data || []);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    return res.status(400).json({ error: "Bad Request" });
  }
}
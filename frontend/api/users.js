import supabase from "./_lib/supabase.js";

// Users API - stateless, minimal logging, consistent response shape { data, error }
// TODO: Migrate to Supabase Auth or hashed passwords; plaintext comparison kept temporarily to match existing client semantics.

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { username, password, email } = req.query ?? {};

      // Login: username + password
      if (username && password) {
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", String(username))
          .single();

        if (error) {
          // Minimal diagnostics; do not leak details
          console.error("Login select error");
        }

        if (!user || String(user.password) !== String(password)) {
          return res.status(200).json([]);
        }
 
        return res.status(200).json([user]);
      }

      // Preflight: username only
      if (username && !password) {
        const { data: rows, error } = await supabase
          .from("users")
          .select("id,username,email")
          .eq("username", String(username));

        if (error) {
          console.error("Username preflight error");
          return res.status(400).json({ error: error.message || "Query error" });
        }
 
        return res.status(200).json(rows ?? []);
      }

      // Preflight: email only
      if (email && !username) {
        const { data: rows, error } = await supabase
          .from("users")
          .select("id,username,email")
          .eq("email", String(email));

        if (error) {
          console.error("Email preflight error");
          return res.status(400).json({ error: error.message || "Query error" });
        }
 
        return res.status(200).json(rows ?? []);
      }

      // No recognized query params
      return res.status(200).json([]);
    }

    if (req.method === "POST") {
      const { username, email, password } = req.body ?? {};
      if (!username || !email || !password) {
        return res.status(400).json({ data: null, error: "Missing required fields: username, email, password" });
      }

      try {
        const { data: created, error } = await supabase
          .from("users")
          .insert([
            { username, email, password, created_at: new Date().toISOString() },
          ])
          .select()
          .single();

        if (error) {
          const msg = error.message || "Failed to create user";
          // Detect common duplicate conflicts (e.g., unique constraints)
          const isConflict = /duplicate key|already exists|exists|23505/i.test(msg);
          console.error("Insert error");
          return res.status(isConflict ? 409 : 400).json({ error: msg });
        }
 
        return res.status(201).json(created);
      } catch (e) {
        console.error("Insert exception");
        return res.status(400).json({ error: "Failed to create user" });
      }
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ data: null, error: "Method Not Allowed" });
  } catch (e) {
    console.error("Users route error");
    return res.status(400).json({ data: null, error: "Bad Request" });
  }
}
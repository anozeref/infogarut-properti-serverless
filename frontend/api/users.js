import supabase from "./_lib/supabase.js";

// Users API - stateless, minimal logging
// TODO: Migrate to Supabase Auth or hashed passwords.

export default async function handler(req, res) {
  try {
    const { id, unban, username, password, email } = req.query ?? {};

    // GET: by id (untuk rewrite /api/users/:id -> /api/users?id=:id)
    if (req.method === "GET" && id) {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", String(id))
        .single();

      if (error || !user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }
      return res.status(200).json(user);
    }

    // GET: login/preflight
    if (req.method === "GET") {
      // Login: username + password
      if (username && password) {
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", String(username))
          .single();

        if (error) {
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

      // Default
      return res.status(200).json([]);
    }

    // POST: create user
    if (req.method === "POST") {
      const { username: u, email: m, password: p } = req.body ?? {};
      if (!u || !m || !p) {
        return res.status(400).json({ error: "Missing required fields: username, email, password" });
      }

      try {
        const { data: created, error } = await supabase
          .from("users")
          .insert([{ username: u, email: m, password: p, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) {
          const msg = error.message || "Failed to create user";
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

    // PATCH: update user (termasuk unban via rewrite /api/users/:id/unban -> /api/users?id=:id&unban=1)
    if (req.method === "PATCH") {
      if (!id) {
        return res.status(400).json({ error: "Missing user id" });
      }

      // Unban flow
      if (String(unban || "") === "1" || String(unban || "").toLowerCase() === "true") {
        const { data: user, error: fetchErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", String(id))
          .single();

        if (fetchErr || !user) {
          return res.status(404).json({ error: "User tidak ditemukan" });
        }
        if (!user.banned) {
          return res.status(400).json({ error: "User ini tidak sedang diblokir." });
        }

        const patch = { banned: false, bannedAt: null };
        const { data: updated, error: updateErr } = await supabase
          .from("users")
          .update(patch)
          .eq("id", String(id))
          .select()
          .single();

        if (updateErr) {
          return res.status(400).json({ error: updateErr.message || "Gagal membuka blokir user" });
        }
        return res.status(200).json({ success: true, user: updated });
      }

      // Generic PATCH update
      const patch = req.body || {};
      if (Object.prototype.hasOwnProperty.call(patch, "id")) {
        delete patch.id;
      }
      if (!patch || Object.keys(patch).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update(patch)
        .eq("id", String(id))
        .select()
        .single();

      if (updateErr) {
        if ((updateErr.message || "").match(/PGRST116|Row not found/i)) {
          return res.status(404).json({ error: "User tidak ditemukan" });
        }
        return res.status(400).json({ error: updateErr.message || "Failed to update user" });
      }

      return res.status(200).json(updated);
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Users route error");
    return res.status(400).json({ error: "Bad Request" });
  }
}
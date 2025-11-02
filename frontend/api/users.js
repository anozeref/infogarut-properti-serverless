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

      // Default: GET list of users
      const { data: rows, error } = await supabase
        .from("users")
        .select("*");
      if (error) {
        console.error("Users list GET error");
        return res.status(400).json({ error: error.message || "Query error" });
      }
      return res.status(200).json(rows ?? []);
    }

    // POST: create user
    if (req.method === "POST") {
      const body = req.body ?? {};

      // Minimal non-sensitive logging: only keys (never log password values)
      try {
        console.info("users.create keys", Array.isArray(body) ? [] : Object.keys(body || {}));
      } catch (_) {}

      // Validation: enforce required string fields
      const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
      const { username, email, password } = body;
      if (!isNonEmptyString(username) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
        return res.status(422).json({ error: "Missing required fields: username, email, password" });
      }

      // Allowed columns: restrict to minimal required fields to avoid schema mismatch
      const ALLOWED_COLUMNS = ["username", "email", "password"];

      // Shape payload strictly to allowed columns, ignoring any extra client-sent fields
      const payload = {
        username: String(username).trim(),
        email: String(email).trim(),
        password: String(password),
      };

      // Defensive filtering to ensure only whitelisted keys are inserted
      const shaped = Object.fromEntries(Object.entries(payload).filter(([k]) => ALLOWED_COLUMNS.includes(k)));

      try {
        const { data: row, error } = await supabase
          .from("users")
          .insert([shaped])
          .select()
          .single();

        if (error) {
          const msg = String(error.message || "");
          const code = String(error.code || "");
          const isDuplicate = /duplicate key value violates unique constraint|already exists|exists|23505/i.test(msg) || code === "23505";
          const isRls = /row-level security policy|permission denied/i.test(msg) || code === "42501";

          // Non-sensitive error mapping
          const status = isDuplicate ? 409 : isRls ? 403 : 500;
          try { console.info("users.create status", status); } catch (_) {}

          if (isDuplicate) {
            return res.status(409).json({ error: "User already exists" });
          }
          if (isRls) {
            return res.status(403).json({ error: "Insufficient permissions" });
          }
          return res.status(500).json({ error: "Failed to create user", details: error.message });
        }

        return res.status(201).json({ data: row });
      } catch (e) {
        try { console.error("Insert exception"); } catch (_) {}
        return res.status(500).json({ error: "Failed to create user" });
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

    // PUT: update user (alias of PATCH for compatibility)
    if (req.method === "PUT") {
      if (!id) {
        return res.status(400).json({ error: "Missing user id" });
      }
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
    res.setHeader("Allow", ["GET", "POST", "PATCH", "PUT"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Users route error");
    return res.status(400).json({ error: "Bad Request" });
  }
}
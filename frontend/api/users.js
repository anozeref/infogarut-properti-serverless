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

      // Allowed columns expanded to include profile fields
      const ALLOWED_COLUMNS = ["username","email","password","nama","no_hp","kecamatan","desa","alamat","role","joinedAt","created_at"];
      
      // Shape payload with defaults and safe coercion
      const nowIso = new Date().toISOString();
      const shaped = {
        username: String(body.username || "").trim(),
        email: String(body.email || "").trim(),
        password: body.password,
        role: body.role || "user",
        joinedAt: body.joinedAt || nowIso,
        nama: body.nama ?? null,
        no_hp: body.no_hp ?? null,
        kecamatan: body.kecamatan ?? null,
        desa: body.desa ?? null,
        alamat: body.alamat ?? null,
        created_at: body.created_at || nowIso,
      };
      
      // Defensive filtering to ensure only whitelisted keys are inserted
      const filtered = Object.fromEntries(Object.entries(shaped).filter(([k]) => ALLOWED_COLUMNS.includes(k)));

      try {
        const { data: row, error } = await supabase
          .from("users")
          .insert([filtered])
          .select()
          .single();
      
        if (error) {
          const code = error?.code;
          const status = code === "23505" ? 409 : code === "42501" ? 403 : 400;
          try { console.error("users.create error", { path: "/api/users:POST", code, message: error?.message }); } catch (_) {}
          return res.status(status).json({ error: error?.message || "Insert failed", code });
        }
      
        return res.status(201).json(row);
      } catch (e) {
        const code = e?.code || e?.error;
        try { console.error("users.create exception", { path: "/api/users:POST", code, message: e?.message }); } catch (_) {}
        return res.status(400).json({ error: e?.message || "Insert failed", code });
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
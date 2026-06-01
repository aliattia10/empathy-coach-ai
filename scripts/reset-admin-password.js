/**
 * Force-set password for an admin user (e.g. nikki@admin.com) via service role.
 * Use when email is confirmed but sign-in returns 400 / "Invalid login credentials".
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/reset-admin-password.js nikki@admin.com "NewStrongPassword123!"
 *
 * Or:
 *   ADMIN_RESET_EMAIL=nikki@admin.com ADMIN_RESET_PASSWORD=... npm run admin:reset-password
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const email = process.argv[2] || process.env.ADMIN_RESET_EMAIL;
const password = process.argv[3] || process.env.ADMIN_RESET_PASSWORD;

async function listAllUsers(adminApi) {
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await adminApi.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < perPage) break;
    page += 1;
  }
  return all;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  if (!email || !password) {
    console.error(
      "Usage: node scripts/reset-admin-password.js <email> <password>\n" +
        "  or ADMIN_RESET_EMAIL + ADMIN_RESET_PASSWORD env vars.",
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const users = await listAllUsers(supabase.auth.admin);
  const target = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());

  if (!target) {
    console.error(`No auth user found for ${email} on project ${SUPABASE_URL}`);
    console.error("Create the user in this project's Authentication → Users first.");
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.updateUserById(target.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("updateUserById failed:", error.message);
    process.exit(1);
  }

  console.log(`OK: password updated and email confirmed for ${email} (id ${target.id})`);
  console.log(`Project: ${SUPABASE_URL}`);
  console.log("Nikki should sign in with this exact password (watch caps/spaces).");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

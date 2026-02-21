#!/usr/bin/env node
/**
 * create-auth-accounts.mjs
 *
 * Creates Better Auth accounts for all seeded MediLink users so you can log in
 * and test every portal (hospital, provider, admin) without going through the form.
 *
 * Usage:
 *   PORT=3002 node scripts/create-auth-accounts.mjs
 *
 * Prerequisites:
 *   - Dev server must be running (pnpm dev or PORT=3002 pnpm dev)
 *   - AUTH_SECRET and ADMIN_SETUP_SECRET must be in apps/web/.env.local
 *   - Convex must be running (npx convex dev) or cloud deployment active
 *
 * Accounts created (password: TestPassword@123):
 *   lan.tran@spmet.edu.vn  → hospital portal (hospital owner)
 *   duc.pham@spmet.edu.vn  → hospital portal (hospital staff)
 *   mai.vo@spmet.edu.vn    → hospital portal (hospital staff)
 *   minh.le@techmed.vn     → provider portal (provider owner)
 *   anh.hoang@techmed.vn   → provider portal (provider staff)
 *   admin@medilink.vn      → admin portal    (platform_admin)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load .env.local
function loadEnvLocal() {
  const envPath = resolve(ROOT, "apps/web/.env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("⚠️  Could not read apps/web/.env.local — relying on process env");
  }
}

loadEnvLocal();

const PORT = process.env.PORT ?? "3002";
const BASE_URL = `http://localhost:${PORT}`;
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const ADMIN_SECRET = process.env.ADMIN_SETUP_SECRET;
const PASSWORD = "TestPassword@123";
const TS = Date.now();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse Set-Cookie headers into a cookie string for subsequent requests */
function parseCookies(headers) {
  const setCookie = headers.getSetCookie?.() ?? [];
  return setCookie
    .map((c) => c.split(";")[0].trim())
    .join("; ");
}

/**
 * Step 1: Create a Better Auth account via sign-up API.
 * Returns cookie string from the response (session_token + convex_jwt).
 */
async function signUpUser({ name, email, password, callbackURL }) {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, callbackURL }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`signUp failed ${res.status}: ${text}`);
  }

  return parseCookies(res.headers);
}

/**
 * Step 2: Create an org in Convex via /api/org/create.
 * Returns { orgId, slug } and additional cookies (medilink-org-context).
 */
async function createOrg({ name, orgType, cookieHeader }) {
  const slug = `${slugify(name)}-${TS}`;
  const res = await fetch(`${BASE_URL}/api/org/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ name, slug, orgType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`createOrg failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  const newCookies = parseCookies(res.headers);
  const allCookies = [cookieHeader, newCookies].filter(Boolean).join("; ");
  return { ...data, allCookies };
}

/**
 * Step 3 (admin only): Grant platform_admin role via Convex HTTP endpoint.
 */
async function setPlatformAdmin(email) {
  if (!CONVEX_SITE_URL) throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL not set");
  if (!ADMIN_SECRET) throw new Error("ADMIN_SETUP_SECRET not set");

  const res = await fetch(`${CONVEX_SITE_URL}/api/admin/set-platform-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-setup-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ email, role: "platform_admin" }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`setPlatformAdmin failed ${res.status}: ${text}`);
  }
}

/** Create a single account end-to-end */
async function createAccount({ name, email, orgName, orgType, isAdmin = false }) {
  process.stdout.write(`  Creating ${email} ...`);

  // Step 1: sign up
  const callbackURL =
    isAdmin ? "/hospital/dashboard" :
    orgType === "hospital" ? "/hospital/dashboard" : "/provider/dashboard";

  let cookies;
  try {
    cookies = await signUpUser({ name, email, password: PASSWORD, callbackURL });
  } catch (err) {
    if (err.message.includes("409") || err.message.toLowerCase().includes("already")) {
      process.stdout.write(" ⚠️  already exists, skipping\n");
      return { email, status: "skipped" };
    }
    throw err;
  }

  // Step 2: create org (admin uses placeholder org)
  const { orgId, allCookies } = await createOrg({
    name: orgName,
    orgType: isAdmin ? "hospital" : orgType,
    cookieHeader: cookies,
  });

  // Step 3: admin role
  if (isAdmin) {
    await setPlatformAdmin(email);
    process.stdout.write(` ✓ admin portal (platform_admin) [org placeholder: ${orgId}]\n`);
  } else {
    process.stdout.write(` ✓ ${orgType} portal [orgId: ${orgId}]\n`);
  }

  return { email, status: "created", orgId, allCookies };
}

async function main() {
  console.log(`\n🔑  MediLink Account Provisioning`);
  console.log(`   Base URL : ${BASE_URL}`);
  console.log(`   Convex   : ${CONVEX_SITE_URL ?? "(not set)"}`);
  console.log(`   Password : ${PASSWORD}\n`);

  const accounts = [
    {
      name: "Dr. Trần Thị Lan",
      email: "lan.tran@spmet.edu.vn",
      orgName: "SPMET Healthcare School",
      orgType: "hospital",
    },
    {
      name: "Phạm Minh Đức",
      email: "duc.pham@spmet.edu.vn",
      orgName: "SPMET Healthcare School Staff",
      orgType: "hospital",
    },
    {
      name: "Võ Thị Mai",
      email: "mai.vo@spmet.edu.vn",
      orgName: "SPMET Healthcare Branch",
      orgType: "hospital",
    },
    {
      name: "Lê Văn Minh",
      email: "minh.le@techmed.vn",
      orgName: "TechMed Equipment Services",
      orgType: "provider",
    },
    {
      name: "Hoàng Đức Anh",
      email: "anh.hoang@techmed.vn",
      orgName: "TechMed Technical Team",
      orgType: "provider",
    },
    {
      name: "Nguyễn Văn Admin",
      email: "admin@medilink.vn",
      orgName: "Admin Placeholder Org",
      orgType: "hospital",
      isAdmin: true,
    },
  ];

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const account of accounts) {
    try {
      const result = await createAccount(account);
      if (result.status === "created") created++;
      else skipped++;
    } catch (err) {
      process.stdout.write(` ❌ FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊  Results: ${created} created, ${skipped} skipped (already exist), ${failed} failed`);
  console.log(`\n✅  Login credentials (all accounts):`);
  console.log(`   Password: ${PASSWORD}\n`);

  const summary = [
    ["lan.tran@spmet.edu.vn",  "hospital portal", "Hospital owner"],
    ["duc.pham@spmet.edu.vn",  "hospital portal", "Hospital staff"],
    ["mai.vo@spmet.edu.vn",    "hospital portal", "Hospital staff"],
    ["minh.le@techmed.vn",     "provider portal", "Provider owner"],
    ["anh.hoang@techmed.vn",   "provider portal", "Provider staff"],
    ["admin@medilink.vn",      "admin portal",    "Platform admin"],
  ];

  for (const [email, portal, role] of summary) {
    console.log(`   ${email.padEnd(30)} → ${portal.padEnd(18)} (${role})`);
  }

  console.log(`\n   Sign-in page: ${BASE_URL}/sign-in\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});

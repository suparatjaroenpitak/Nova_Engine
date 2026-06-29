-- Nova Engine — Neon PostgreSQL Init (run once after creating Neon project)
-- Paste this into Neon's SQL Editor: https://console.neon.tech → project → SQL Editor

-- 1. Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. The EF Core migration will create all tables on first API startup.
--    But if you want the schema upfront, run database/init/02-schema.sql contents here.

-- 3. Optional: create the admin user (API seeds this automatically if Seed__CreateAdmin=true)
--     But you can pre-seed:
-- INSERT INTO "Users" ("Id", "Email", "DisplayName", "PasswordHash", "Role", "EmailVerified", "IsActive", "CreatedAtUtc", "UpdatedAtUtc")
-- VALUES (gen_random_uuid(), 'admin@nova.local', 'Admin',
--         '$2a$11$...bcrypt_hash...', 'Admin', true, true, NOW(), NOW());

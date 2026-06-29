-- Nova Engine - Database Schema
-- This is a reference schema; EF Core manages migrations in production.

-- Users & Identity
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Email" CITEXT NOT NULL UNIQUE,
    "DisplayName" TEXT NOT NULL DEFAULT '',
    "PasswordHash" TEXT,
    "Role" TEXT NOT NULL DEFAULT 'User',
    "AvatarUrl" TEXT,
    "EmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ExternalLogins" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Provider" TEXT NOT NULL,
    "ProviderUserId" TEXT NOT NULL,
    "AccessToken" TEXT,
    "RefreshToken" TEXT,
    "ExpiresAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("Provider", "ProviderUserId")
);

CREATE TABLE IF NOT EXISTS "RefreshTokens" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "TokenHash" TEXT NOT NULL UNIQUE,
    "ExpiresAtUtc" TIMESTAMPTZ NOT NULL,
    "RevokedAtUtc" TIMESTAMPTZ,
    "ReplacedByTokenHash" TEXT,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID,
    "Action" TEXT NOT NULL,
    "EntityType" TEXT,
    "EntityId" TEXT,
    "Detail" TEXT,
    "IpAddress" TEXT,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS "Projects" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "OwnerId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "Visibility" TEXT NOT NULL DEFAULT 'Private',
    "EngineVersion" TEXT NOT NULL DEFAULT '1.0',
    "RenderPipeline" TEXT NOT NULL DEFAULT 'URP',
    "Is3D" BOOLEAN NOT NULL DEFAULT TRUE,
    "ThumbnailAssetId" TEXT,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProjectMembers" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Role" TEXT NOT NULL DEFAULT 'Editor',
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("ProjectId", "UserId")
);

-- Scenes
CREATE TABLE IF NOT EXISTS "Scenes" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL DEFAULT 'Untitled',
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "IsMain" BOOLEAN NOT NULL DEFAULT FALSE,
    "SettingsJson" JSONB NOT NULL DEFAULT '{}',
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GameObjects
CREATE TABLE IF NOT EXISTS "GameObjects" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL DEFAULT 'GameObject',
    "SceneId" UUID NOT NULL REFERENCES "Scenes"("Id") ON DELETE CASCADE,
    "ParentId" UUID REFERENCES "GameObjects"("Id") ON DELETE RESTRICT,
    "SiblingIndex" INT NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "Layer" INT NOT NULL DEFAULT 0,
    "Tag" TEXT,
    "PrefabSourceId" UUID,
    "PosX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "PosY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "PosZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "RotX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "RotY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "RotZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "RotW" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "SclX" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "SclY" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "SclZ" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gameobjects_scene ON "GameObjects"("SceneId", "ParentId", "SiblingIndex");

-- Components
CREATE TABLE IF NOT EXISTS "Components" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "GameObjectId" UUID NOT NULL REFERENCES "GameObjects"("Id") ON DELETE CASCADE,
    "Kind" VARCHAR(64) NOT NULL,
    "Enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "PropertiesJson" JSONB NOT NULL DEFAULT '{}',
    "Order" INT NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_components_gameobject ON "Components"("GameObjectId", "Order");

-- Assets
CREATE TABLE IF NOT EXISTS "Assets" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Name" TEXT NOT NULL,
    "Path" TEXT NOT NULL,
    "Kind" TEXT NOT NULL DEFAULT 'Unknown',
    "ContentType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "SizeBytes" BIGINT NOT NULL DEFAULT 0,
    "Sha256" TEXT,
    "StorageKey" TEXT NOT NULL,
    "ImportMetaJson" JSONB,
    "PreviewStorageKey" TEXT,
    "SourceImporter" TEXT,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("ProjectId", "Path")
);

CREATE TABLE IF NOT EXISTS "AssetImportJobs" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "AssetId" UUID NOT NULL REFERENCES "Assets"("Id") ON DELETE CASCADE,
    "Stage" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Queued',
    "HangfireJobId" TEXT,
    "Error" TEXT,
    "ResultJson" TEXT,
    "FinishedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scripts
CREATE TABLE IF NOT EXISTS "Scripts" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Name" TEXT NOT NULL,
    "FullyQualifiedClassName" TEXT NOT NULL,
    "Language" TEXT NOT NULL DEFAULT 'CSharp',
    "CurrentSource" TEXT NOT NULL,
    "CurrentVersion" INT NOT NULL DEFAULT 1,
    "Compiles" BOOLEAN NOT NULL DEFAULT FALSE,
    "ErrorCount" INT NOT NULL DEFAULT 0,
    "WarningCount" INT NOT NULL DEFAULT 0,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("ProjectId", "Name")
);

CREATE TABLE IF NOT EXISTS "ScriptVersions" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ScriptId" UUID NOT NULL REFERENCES "Scripts"("Id") ON DELETE CASCADE,
    "Version" INT NOT NULL,
    "Source" TEXT NOT NULL,
    "Compiles" BOOLEAN NOT NULL DEFAULT FALSE,
    "DiagnosticsJson" JSONB,
    "AssemblyHash" TEXT,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("ScriptId", "Version")
);

-- Packages
CREATE TABLE IF NOT EXISTS "Packages" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Name" TEXT NOT NULL,
    "Version" TEXT NOT NULL,
    "Source" TEXT NOT NULL DEFAULT 'registry',
    "RegistryUrl" TEXT,
    "GitUrl" TEXT,
    "LocalPath" TEXT,
    "Description" TEXT,
    "IsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("ProjectId", "Name")
);

CREATE TABLE IF NOT EXISTS "RegistryPackages" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL,
    "Slug" TEXT NOT NULL UNIQUE,
    "LatestVersion" TEXT NOT NULL,
    "Description" TEXT,
    "AuthorId" UUID,
    "StorageKey" TEXT,
    "Readme" TEXT,
    "Tags" JSONB NOT NULL DEFAULT '[]',
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GPU Jobs
CREATE TABLE IF NOT EXISTS "GpuJobs" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId" UUID,
    "UserId" UUID,
    "Type" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Queued',
    "Gpu" TEXT NOT NULL DEFAULT 'Auto',
    "Provider" TEXT NOT NULL DEFAULT 'LocalStub',
    "PayloadJson" JSONB NOT NULL DEFAULT '{}',
    "ResultJson" JSONB,
    "ResultStorageKey" TEXT,
    "Error" TEXT,
    "ProgressPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "StartedAtUtc" TIMESTAMPTZ,
    "FinishedAtUtc" TIMESTAMPTZ,
    "CreatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAtUtc" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gpujobs_project ON "GpuJobs"("ProjectId", "Status");
CREATE INDEX IF NOT EXISTS idx_gpujobs_status ON "GpuJobs"("Status");

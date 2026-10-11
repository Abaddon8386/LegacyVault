/*
    LegacyVault - V2: Upgrade V1 schema to the latest UUID Data Dictionary
    Database: Microsoft SQL Server
    Flyway version: V2

    Prerequisite:
      - V1__create_initial_schema.sql has been applied successfully.
      - Run this migration through Flyway, not by manually executing fragments.

    Changes:
      1. Add/backfill public_id on resource tables while retaining BIGINT PK/FK.
      2. Add users.deleted_at for soft deletion.
      3. Add beneficiaries.date_of_birth and beneficiaries.relationship_to_owner.
      4. Add legal_documents.current_verification_id and its FK after both tables exist.

    Notes:
      - UUIDs for existing records are backfilled with NEWID(). The application should
        assign UUID.randomUUID() for new resource records.
      - New beneficiary fields remain NULL-compatible for existing rows. Validate them
        in DTO/Service for new/updated beneficiary records according to business rules.
      - The V1 legal_verifications.asset_version_id column is retained for compatibility;
        this migration does not destructively drop existing data/columns.
      - Do not rename or edit this migration after it has been applied in a shared DB.
*/
SET XACT_ABORT ON;

/* Fail early if the expected V1 schema is not present. */
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
   OR OBJECT_ID(N'dbo.vaults', N'U') IS NULL
   OR OBJECT_ID(N'dbo.assets', N'U') IS NULL
   OR OBJECT_ID(N'dbo.asset_versions', N'U') IS NULL
   OR OBJECT_ID(N'dbo.trustees', N'U') IS NULL
   OR OBJECT_ID(N'dbo.beneficiaries', N'U') IS NULL
   OR OBJECT_ID(N'dbo.asset_allocations', N'U') IS NULL
   OR OBJECT_ID(N'dbo.dms_configs', N'U') IS NULL
   OR OBJECT_ID(N'dbo.legal_documents', N'U') IS NULL
   OR OBJECT_ID(N'dbo.legal_verifications', N'U') IS NULL
BEGIN
    THROW 51100, 'V2 requires the V1 LegacyVault schema. One or more required tables are missing.', 1;
END;

/* 1. users.public_id */
IF COL_LENGTH(N'dbo.users', N'public_id') IS NULL
    ALTER TABLE dbo.users ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.users SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.users ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.users') AND name = N'UX_users_public_id')
    CREATE UNIQUE INDEX UX_users_public_id ON dbo.users(public_id);

/* 2. vaults.public_id */
IF COL_LENGTH(N'dbo.vaults', N'public_id') IS NULL
    ALTER TABLE dbo.vaults ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.vaults SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.vaults ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.vaults') AND name = N'UX_vaults_public_id')
    CREATE UNIQUE INDEX UX_vaults_public_id ON dbo.vaults(public_id);

/* 3. assets.public_id */
IF COL_LENGTH(N'dbo.assets', N'public_id') IS NULL
    ALTER TABLE dbo.assets ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.assets SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.assets ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.assets') AND name = N'UX_assets_public_id')
    CREATE UNIQUE INDEX UX_assets_public_id ON dbo.assets(public_id);

/* 4. asset_versions.public_id */
IF COL_LENGTH(N'dbo.asset_versions', N'public_id') IS NULL
    ALTER TABLE dbo.asset_versions ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.asset_versions SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.asset_versions ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.asset_versions') AND name = N'UX_asset_versions_public_id')
    CREATE UNIQUE INDEX UX_asset_versions_public_id ON dbo.asset_versions(public_id);

/* 5. trustees.public_id */
IF COL_LENGTH(N'dbo.trustees', N'public_id') IS NULL
    ALTER TABLE dbo.trustees ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.trustees SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.trustees ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.trustees') AND name = N'UX_trustees_public_id')
    CREATE UNIQUE INDEX UX_trustees_public_id ON dbo.trustees(public_id);

/* 6. beneficiaries.public_id */
IF COL_LENGTH(N'dbo.beneficiaries', N'public_id') IS NULL
    ALTER TABLE dbo.beneficiaries ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.beneficiaries SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.beneficiaries ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.beneficiaries') AND name = N'UX_beneficiaries_public_id')
    CREATE UNIQUE INDEX UX_beneficiaries_public_id ON dbo.beneficiaries(public_id);

/* 7. asset_allocations.public_id */
IF COL_LENGTH(N'dbo.asset_allocations', N'public_id') IS NULL
    ALTER TABLE dbo.asset_allocations ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.asset_allocations SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.asset_allocations ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.asset_allocations') AND name = N'UX_asset_allocations_public_id')
    CREATE UNIQUE INDEX UX_asset_allocations_public_id ON dbo.asset_allocations(public_id);

/* 8. dms_configs.public_id */
IF COL_LENGTH(N'dbo.dms_configs', N'public_id') IS NULL
    ALTER TABLE dbo.dms_configs ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.dms_configs SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.dms_configs ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.dms_configs') AND name = N'UX_dms_configs_public_id')
    CREATE UNIQUE INDEX UX_dms_configs_public_id ON dbo.dms_configs(public_id);

/* 9. legal_documents.public_id */
IF COL_LENGTH(N'dbo.legal_documents', N'public_id') IS NULL
    ALTER TABLE dbo.legal_documents ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.legal_documents SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.legal_documents ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.legal_documents') AND name = N'UX_legal_documents_public_id')
    CREATE UNIQUE INDEX UX_legal_documents_public_id ON dbo.legal_documents(public_id);

/* 10. legal_verifications.public_id */
IF COL_LENGTH(N'dbo.legal_verifications', N'public_id') IS NULL
    ALTER TABLE dbo.legal_verifications ADD public_id UNIQUEIDENTIFIER NULL;
EXEC sys.sp_executesql N'UPDATE dbo.legal_verifications SET public_id = NEWID() WHERE public_id IS NULL;';
EXEC sys.sp_executesql N'ALTER TABLE dbo.legal_verifications ALTER COLUMN public_id UNIQUEIDENTIFIER NOT NULL;';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.legal_verifications') AND name = N'UX_legal_verifications_public_id')
    CREATE UNIQUE INDEX UX_legal_verifications_public_id ON dbo.legal_verifications(public_id);

/* 11. Soft delete on users. */
IF COL_LENGTH(N'dbo.users', N'deleted_at') IS NULL
    ALTER TABLE dbo.users ADD deleted_at DATETIME2 NULL;

/* 12. Beneficiary details. Nullable to preserve existing rows. */
IF COL_LENGTH(N'dbo.beneficiaries', N'date_of_birth') IS NULL
    ALTER TABLE dbo.beneficiaries ADD date_of_birth DATE NULL;

IF COL_LENGTH(N'dbo.beneficiaries', N'relationship_to_owner') IS NULL
    ALTER TABLE dbo.beneficiaries ADD relationship_to_owner NVARCHAR(100) NULL;

/* 13. Optional pointer to the current verification; add FK after both tables exist. */
IF COL_LENGTH(N'dbo.legal_documents', N'current_verification_id') IS NULL
    ALTER TABLE dbo.legal_documents ADD current_verification_id BIGINT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_legal_documents_current_verification')
BEGIN
    ALTER TABLE dbo.legal_documents WITH CHECK
        ADD CONSTRAINT FK_legal_documents_current_verification
        FOREIGN KEY (current_verification_id)
        REFERENCES dbo.legal_verifications(verification_id);
END;

/* End V2. Flyway records this migration in dbo.flyway_schema_history. */

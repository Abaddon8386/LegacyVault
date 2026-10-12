/*
 * Contract alignment for PS-19/PS-20/PS-22/PS-23.
 * V1/V2 are already published; make schema changes in a new migration.
 */

IF COL_LENGTH(N'dbo.trustees', N'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.trustees
        ADD updated_at DATETIME2 NOT NULL
            CONSTRAINT DF_trustees_updated_at DEFAULT SYSUTCDATETIME();
END;

IF COL_LENGTH(N'dbo.trustees', N'note') IS NULL
BEGIN
    ALTER TABLE dbo.trustees ADD note NVARCHAR(500) NULL;
END;

IF COL_LENGTH(N'dbo.beneficiaries', N'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.beneficiaries
        ADD updated_at DATETIME2 NOT NULL
            CONSTRAINT DF_beneficiaries_updated_at DEFAULT SYSUTCDATETIME();
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.dms_configs')
      AND name = N'IX_dms_configs_status_next_check_at'
)
BEGIN
    CREATE INDEX IX_dms_configs_status_next_check_at
        ON dbo.dms_configs(status, next_check_at)
        INCLUDE (dms_id, owner_user_id);
END;

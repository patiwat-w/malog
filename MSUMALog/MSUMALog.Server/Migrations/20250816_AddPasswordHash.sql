-- Add PasswordHash column (nullable). Adjust table name/schema if different.
ALTER TABLE [Users]
ADD [PasswordHash] NVARCHAR(256) NULL;

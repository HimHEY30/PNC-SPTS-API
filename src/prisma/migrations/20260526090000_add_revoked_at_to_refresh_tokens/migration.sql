ALTER TABLE `refresh_tokens`
ADD COLUMN `revoked_at` DATETIME(3) NULL;

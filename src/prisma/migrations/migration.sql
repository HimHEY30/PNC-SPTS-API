-- Alter Table auth_users
ALTER TABLE `auth_users` 
  ADD COLUMN `twitter_url` VARCHAR(191) NULL,
  ADD COLUMN `facebook_url` VARCHAR(191) NULL,
  ADD COLUMN `linkedin_url` VARCHAR(191) NULL,
  ADD COLUMN `pinterest_url` VARCHAR(191) NULL;

-- Create Table activity_timelines
CREATE TABLE `activity_timelines` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `event_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `action_title` VARCHAR(191) NOT NULL,
  `target_name` VARCHAR(191) NOT NULL,
  `target_url` VARCHAR(191) NULL,
  `category_type` VARCHAR(191) NOT NULL,
  `priority` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `activity_timelines_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `activity_timelines_user_id_idx` ON `activity_timelines` (`user_id`);

-- Create Table project_tasks
CREATE TABLE `project_tasks` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_subtasks_count` INTEGER NOT NULL DEFAULT 0,
  `total_subtasks_count` INTEGER NOT NULL DEFAULT 0,
  `comments_count` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Table shared_assets
CREATE TABLE `shared_assets` (
  `id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(191) NOT NULL,
  `category_tag` VARCHAR(191) NOT NULL,
  `storage_url` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Join Table _AuthUserToProjectTask
CREATE TABLE `_AuthUserToProjectTask` (
  `A` VARCHAR(191) NOT NULL,
  `B` VARCHAR(191) NOT NULL,
  UNIQUE INDEX `_AuthUserToProjectTask_AB_unique` (`A`, `B`),
  INDEX `_AuthUserToProjectTask_B_index` (`B`),
  CONSTRAINT `_AuthUserToProjectTask_A_fkey` FOREIGN KEY (`A`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_AuthUserToProjectTask_B_fkey` FOREIGN KEY (`B`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Join Table _AuthUserToSharedAsset
CREATE TABLE `_AuthUserToSharedAsset` (
  `A` VARCHAR(191) NOT NULL,
  `B` VARCHAR(191) NOT NULL,
  UNIQUE INDEX `_AuthUserToSharedAsset_AB_unique` (`A`, `B`),
  INDEX `_AuthUserToSharedAsset_B_index` (`B`),
  CONSTRAINT `_AuthUserToSharedAsset_A_fkey` FOREIGN KEY (`A`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_AuthUserToSharedAsset_B_fkey` FOREIGN KEY (`B`) REFERENCES `shared_assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

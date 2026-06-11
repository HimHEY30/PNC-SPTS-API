-- DropForeignKey
ALTER TABLE `FollowUpCase` DROP FOREIGN KEY `FollowUpCase_statusId_fkey`;

-- DropIndex
ALTER TABLE `FollowUpCase` DROP INDEX `FollowUpCase_statusId_idx`;

-- AlterTable
ALTER TABLE `FollowUpCase` DROP COLUMN `statusId`,
    ADD COLUMN `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN';

-- DropTable
DROP TABLE `FollowUpStatus`;

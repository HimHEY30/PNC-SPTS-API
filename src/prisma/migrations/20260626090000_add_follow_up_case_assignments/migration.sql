-- CreateTable
CREATE TABLE `follow_up_case_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `assignedByUserId` VARCHAR(191) NOT NULL,
    `assignedToUserId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `follow_up_case_assignments_caseId_idx`(`caseId`),
    INDEX `follow_up_case_assignments_assignedByUserId_idx`(`assignedByUserId`),
    INDEX `follow_up_case_assignments_assignedToUserId_idx`(`assignedToUserId`),
    INDEX `follow_up_case_assignments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NULL,
    `action` ENUM('CASE_ASSIGNED', 'CASE_ACCEPTED', 'CASE_REJECTED', 'CASE_COMPLETED') NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `previousStatus` VARCHAR(191) NULL,
    `newStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `audit_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `follow_up_case_assignments` ADD CONSTRAINT `follow_up_case_assignments_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `FollowUpCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow_up_case_assignments` ADD CONSTRAINT `follow_up_case_assignments_assignedByUserId_fkey` FOREIGN KEY (`assignedByUserId`) REFERENCES `auth_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow_up_case_assignments` ADD CONSTRAINT `follow_up_case_assignments_assignedToUserId_fkey` FOREIGN KEY (`assignedToUserId`) REFERENCES `auth_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `auth_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `auth_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

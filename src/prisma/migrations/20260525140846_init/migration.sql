-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `roleId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Permission_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` VARCHAR(191) NOT NULL,
    `hashed` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` VARCHAR(191) NOT NULL,
    `studentCode` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `placeOfBirth` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `profileImage` VARCHAR(191) NULL,
    `status` ENUM('active', 'suspended', 'graduated') NOT NULL DEFAULT 'active',
    `classId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Student_studentCode_key`(`studentCode`),
    UNIQUE INDEX `Student_email_key`(`email`),
    INDEX `Student_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teacher` (
    `id` VARCHAR(191) NOT NULL,
    `teacherCode` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Teacher_teacherCode_key`(`teacherCode`),
    UNIQUE INDEX `Teacher_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Class` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `batchYear` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Class_name_batchYear_key`(`name`, `batchYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Term` (
    `id` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('active', 'closed') NOT NULL DEFAULT 'active',

    UNIQUE INDEX `Term_academicYear_semester_key`(`academicYear`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subject` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `credit` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subject_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherSubject` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `termId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,

    INDEX `TeacherSubject_teacherId_idx`(`teacherId`),
    INDEX `TeacherSubject_subjectId_idx`(`subjectId`),
    INDEX `TeacherSubject_termId_idx`(`termId`),
    INDEX `TeacherSubject_classId_idx`(`classId`),
    UNIQUE INDEX `TeacherSubject_teacherId_subjectId_termId_classId_key`(`teacherId`, `subjectId`, `termId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpCase` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `openedByTeacherId` VARCHAR(191) NOT NULL,
    `termId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    `statusId` VARCHAR(191) NOT NULL,
    `openedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `FollowUpCase_studentId_idx`(`studentId`),
    INDEX `FollowUpCase_openedByTeacherId_idx`(`openedByTeacherId`),
    INDEX `FollowUpCase_termId_idx`(`termId`),
    INDEX `FollowUpCase_statusId_idx`(`statusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpCaseType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `FollowUpCaseType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpCaseTypeMap` (
    `id` VARCHAR(191) NOT NULL,
    `followUpCaseId` VARCHAR(191) NOT NULL,
    `followUpTypeId` VARCHAR(191) NOT NULL,

    INDEX `FollowUpCaseTypeMap_followUpCaseId_idx`(`followUpCaseId`),
    INDEX `FollowUpCaseTypeMap_followUpTypeId_idx`(`followUpTypeId`),
    UNIQUE INDEX `FollowUpCaseTypeMap_followUpCaseId_followUpTypeId_key`(`followUpCaseId`, `followUpTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpStatus` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `colorCode` VARCHAR(191) NULL,

    UNIQUE INDEX `FollowUpStatus_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpReport` (
    `id` VARCHAR(191) NOT NULL,
    `followUpCaseId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `reportDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `progressStatus` VARCHAR(191) NULL,
    `observation` VARCHAR(191) NULL,
    `nextAction` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FollowUpReport_followUpCaseId_idx`(`followUpCaseId`),
    INDEX `FollowUpReport_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `storageProvider` VARCHAR(191) NOT NULL DEFAULT 'local',
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FollowUpAttachment_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpRemoval` (
    `id` VARCHAR(191) NOT NULL,
    `followUpCaseId` VARCHAR(191) NOT NULL,
    `removedByTeacherId` VARCHAR(191) NOT NULL,
    `removalReason` VARCHAR(191) NULL,
    `removalDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FollowUpRemoval_followUpCaseId_idx`(`followUpCaseId`),
    INDEX `FollowUpRemoval_removedByTeacherId_idx`(`removedByTeacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EvaluationCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RatingScale` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minValue` DECIMAL(65, 30) NOT NULL,
    `maxValue` DECIMAL(65, 30) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `RatingScale_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentEvaluation` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `termId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `ratingScaleId` VARCHAR(191) NOT NULL,
    `score` DECIMAL(65, 30) NOT NULL,
    `comment` VARCHAR(191) NULL,
    `evaluatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentEvaluation_studentId_idx`(`studentId`),
    INDEX `StudentEvaluation_teacherId_idx`(`teacherId`),
    INDEX `StudentEvaluation_termId_idx`(`termId`),
    INDEX `StudentEvaluation_categoryId_idx`(`categoryId`),
    INDEX `StudentEvaluation_ratingScaleId_idx`(`ratingScaleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TutorAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `assignedByTeacherId` VARCHAR(191) NOT NULL,
    `assignedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `status` ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TutorAssignment_studentId_idx`(`studentId`),
    INDEX `TutorAssignment_teacherId_idx`(`teacherId`),
    INDEX `TutorAssignment_assignedByTeacherId_idx`(`assignedByTeacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `percentageWeight` DECIMAL(65, 30) NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `ScoreType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentScore` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `termId` VARCHAR(191) NOT NULL,
    `scoreTypeId` VARCHAR(191) NOT NULL,
    `scoreValue` DECIMAL(65, 30) NOT NULL,
    `maxScore` DECIMAL(65, 30) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentScore_studentId_idx`(`studentId`),
    INDEX `StudentScore_subjectId_idx`(`subjectId`),
    INDEX `StudentScore_teacherId_idx`(`teacherId`),
    INDEX `StudentScore_termId_idx`(`termId`),
    INDEX `StudentScore_scoreTypeId_idx`(`scoreTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PermissionToRole` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_PermissionToRole_AB_unique`(`A`, `B`),
    INDEX `_PermissionToRole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Teacher` ADD CONSTRAINT `Teacher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpCase` ADD CONSTRAINT `FollowUpCase_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpCase` ADD CONSTRAINT `FollowUpCase_openedByTeacherId_fkey` FOREIGN KEY (`openedByTeacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpCase` ADD CONSTRAINT `FollowUpCase_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpCase` ADD CONSTRAINT `FollowUpCase_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `FollowUpStatus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpCaseTypeMap` ADD CONSTRAINT `FollowUpCaseTypeMap_followUpCaseId_fkey` FOREIGN KEY (`followUpCaseId`) REFERENCES `FollowUpCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpCaseTypeMap` ADD CONSTRAINT `FollowUpCaseTypeMap_followUpTypeId_fkey` FOREIGN KEY (`followUpTypeId`) REFERENCES `FollowUpCaseType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpReport` ADD CONSTRAINT `FollowUpReport_followUpCaseId_fkey` FOREIGN KEY (`followUpCaseId`) REFERENCES `FollowUpCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpReport` ADD CONSTRAINT `FollowUpReport_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpAttachment` ADD CONSTRAINT `FollowUpAttachment_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `FollowUpReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpRemoval` ADD CONSTRAINT `FollowUpRemoval_followUpCaseId_fkey` FOREIGN KEY (`followUpCaseId`) REFERENCES `FollowUpCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpRemoval` ADD CONSTRAINT `FollowUpRemoval_removedByTeacherId_fkey` FOREIGN KEY (`removedByTeacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEvaluation` ADD CONSTRAINT `StudentEvaluation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEvaluation` ADD CONSTRAINT `StudentEvaluation_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEvaluation` ADD CONSTRAINT `StudentEvaluation_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEvaluation` ADD CONSTRAINT `StudentEvaluation_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `EvaluationCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEvaluation` ADD CONSTRAINT `StudentEvaluation_ratingScaleId_fkey` FOREIGN KEY (`ratingScaleId`) REFERENCES `RatingScale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutorAssignment` ADD CONSTRAINT `TutorAssignment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutorAssignment` ADD CONSTRAINT `TutorAssignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutorAssignment` ADD CONSTRAINT `TutorAssignment_assignedByTeacherId_fkey` FOREIGN KEY (`assignedByTeacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentScore` ADD CONSTRAINT `StudentScore_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentScore` ADD CONSTRAINT `StudentScore_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentScore` ADD CONSTRAINT `StudentScore_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentScore` ADD CONSTRAINT `StudentScore_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentScore` ADD CONSTRAINT `StudentScore_scoreTypeId_fkey` FOREIGN KEY (`scoreTypeId`) REFERENCES `ScoreType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

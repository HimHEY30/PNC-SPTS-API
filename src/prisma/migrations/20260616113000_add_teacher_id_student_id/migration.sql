-- Add teacher_id column to Teacher table (auto-increment sequential like T01, T02)
ALTER TABLE `Teacher` ADD COLUMN `teacher_id` VARCHAR(191) NULL;
ALTER TABLE `Teacher` ADD UNIQUE INDEX `Teacher_teacher_id_key`(`teacher_id`);

-- Add student_id column to Student table (auto-increment sequential like S01, S02)
ALTER TABLE `Student` ADD COLUMN `student_id` VARCHAR(191) NULL;
ALTER TABLE `Student` ADD UNIQUE INDEX `Student_student_id_key`(`student_id`);

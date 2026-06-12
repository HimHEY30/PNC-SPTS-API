import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const profileImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'profile-images');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Permissions('student.create')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async create(
    @Body() createData: CreateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createData.profileImage = `/uploads/profile-images/${file.filename}`;
    }
    return this.studentsService.create(createData);
  }

  @Get()
  @Permissions('student.read')
  async findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  @Permissions('student.read')
  async findOne(@Param('id') id: string) {
    const student = await this.studentsService.findOne(id);
    if (!student) {
      throw new NotFoundException({ error: 'STUDENT_NOT_FOUND' });
    }
    return student;
  }

  @Patch(':id')
  @Permissions('student.update')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateData.profileImage = `/uploads/profile-images/${file.filename}`;
    }
    const student = await this.studentsService.update(id, updateData);
    if (!student) {
      throw new NotFoundException({ error: 'STUDENT_NOT_FOUND' });
    }
    return student;
  }
}

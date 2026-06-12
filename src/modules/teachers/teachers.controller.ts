import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
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
import { Roles } from '@/common/decorators/roles.decorator';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

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

@Controller('teachers')
@Roles('SUPER_ADMIN', 'ADMIN')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Permissions('teacher.create')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async create(
    @Body() createTeacherDto: CreateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createTeacherDto.profileImage = `/uploads/profile-images/${file.filename}`;
    }
    // Parse boolean status if received as string from FormData
    if (typeof createTeacherDto.status === 'string') {
      createTeacherDto.status = (createTeacherDto.status as string) === 'true';
    }
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @Permissions('teacher.read')
  async findAll() {
    return this.teachersService.findAll();
  }

  @Get(':id')
  @Permissions('teacher.read')
  async findOne(@Param('id') id: string) {
    const teacher = await this.teachersService.findOne(id);
    if (!teacher) {
      throw new NotFoundException({ error: 'TEACHER_NOT_FOUND' });
    }
    return teacher;
  }

  @Patch(':id')
  @Permissions('teacher.update')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateTeacherDto.profileImage = `/uploads/profile-images/${file.filename}`;
    }
    // Parse boolean status if received as string from FormData
    if (typeof updateTeacherDto.status === 'string') {
      updateTeacherDto.status = (updateTeacherDto.status as string) === 'true';
    }
    const teacher = await this.teachersService.update(id, updateTeacherDto);
    if (!teacher) {
      throw new NotFoundException({ error: 'TEACHER_NOT_FOUND' });
    }
    return teacher;
  }

  @Delete(':id')
  @Permissions('teacher.delete')
  async remove(@Param('id') id: string) {
    const teacher = await this.teachersService.remove(id);
    if (!teacher) {
      throw new NotFoundException({ error: 'TEACHER_NOT_FOUND' });
    }
    return { success: true };
  }
}

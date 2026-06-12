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
import { TeachersService } from './teachers.service';

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
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Permissions('teacher.create')
  @UseInterceptors(FileInterceptor('image', { storage: profileImageStorage }))
  async create(
    @Body() createData: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createData.profileImage = `/uploads/profile-images/${file.filename}`;
    }
    // Parse boolean status if received as string from FormData
    if (typeof createData.status === 'string') {
      createData.status = createData.status === 'true';
    }
    return this.teachersService.create(createData);
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
    @Body() updateData: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateData.profileImage = `/uploads/profile-images/${file.filename}`;
    }
    // Parse boolean status if received as string from FormData
    if (typeof updateData.status === 'string') {
      updateData.status = updateData.status === 'true';
    }
    const teacher = await this.teachersService.update(id, updateData);
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

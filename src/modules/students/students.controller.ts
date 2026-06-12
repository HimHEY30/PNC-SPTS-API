import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Permissions('student.create')
  async create(@Body() createData: any) {
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
  async update(@Param('id') id: string, @Body() updateData: any) {
    const student = await this.studentsService.update(id, updateData);
    if (!student) {
      throw new NotFoundException({ error: 'STUDENT_NOT_FOUND' });
    }
    return student;
  }
}

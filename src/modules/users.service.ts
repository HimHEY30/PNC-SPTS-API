import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { UpdateUserDto } from './users/dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, roleId, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        ...rest,
        email,
        password: hashedPassword,
        role: {
          connect: { id: roleId },
        },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

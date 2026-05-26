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
    return this.prisma.authUser.create({
      data: {
        ...rest,
        email,
        password_hash: hashedPassword,
        roles: {
          create: {
            role: {
              connect: { id: roleId }
            }
          }
        },
      },
    });
  }

  findAll() {
    return this.prisma.authUser.findMany();
  }

  findOne(id: string) {
    return this.prisma.authUser.findUnique({
      where: { id },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.authUser.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.authUser.delete({
      where: { id },
    });
  }
}

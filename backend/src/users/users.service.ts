import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    const where: any = {};
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, createdById: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedById: string) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify(dto),
      },
    });

    return user;
  }

  async remove(id: string, deletedById: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
      },
    });

    return { message: 'User deactivated successfully' };
  }
}

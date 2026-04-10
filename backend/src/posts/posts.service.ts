import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(siteId?: string) {
    return this.prisma.post.findMany({
      where: { isActive: true, ...(siteId ? { siteId } : {}) },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto) {
    return this.prisma.post.create({
      data: dto,
      include: { site: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdatePostDto) {
    await this.findOne(id);
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.post.update({ where: { id }, data: { isActive: false } });
  }
}

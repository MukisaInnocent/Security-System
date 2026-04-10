import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'OPS_MANAGER', 'SUPERVISOR')
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPS_MANAGER', 'SUPERVISOR')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto, @CurrentUser('id') userId: string) {
    return this.usersService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.remove(id, userId);
  }
}

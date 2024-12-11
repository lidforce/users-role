import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserUtilsService } from '../utils/user-utils';

@Injectable()
export class UsersService {
  private userUtils: UserUtilsService;

  constructor(private prisma: PrismaService) {
    this.userUtils = new UserUtilsService(prisma);
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    return this.prisma.user.findMany({
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        login: true,
      },
    });
  }

  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async createUser(data: UserDto) {
    if (!data.roles || data.roles.length === 0) {
      throw new BadRequestException({
        success: false,
        errors: ['Пользователю должна быть назначена хотя бы одна роль'],
      });
    }

    await this.userUtils.validateRoles(data.roles);

    await this.userUtils.validateLoginUniqueness(data.login);

    const cleanedRoles = this.userUtils.cleanRoles(data.roles);

    const createdUser = await this.prisma.user.create({
      data: {
        name: data.name,
        login: data.login,
        password: data.password,
        roles: {
          create: cleanedRoles.map((roleId) => ({ roleId })),
        },
      },
    });

    return { success: true, user: createdUser };
  }

  async updateUser(userId: number, data: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    if (!Object.values(data).some((value) => value !== undefined)) {
      throw new BadRequestException({
        success: false,
        errors: ['Должно быть указано хотя бы одно поле для обновления'],
      });
    }

    if (data.login) {
      await this.userUtils.validateLoginUniqueness(data.login, userId);
    }

    const cleanedRoles = data.roles
      ? this.userUtils.cleanRoles(data.roles)
      : [];
    if (!this.userUtils.hasChanges(user, data, cleanedRoles)) {
      throw new BadRequestException({
        success: false,
        errors: ['Данные совпадают с текущими, изменений не найдено'],
      });
    }

    if (cleanedRoles.length) {
      await this.userUtils.validateRoles(cleanedRoles);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.login && { login: data.login }),
        ...(data.password && { password: data.password }),
        ...(cleanedRoles.length && {
          roles: {
            deleteMany: {},
            create: cleanedRoles.map((roleId) => ({ roleId })),
          },
        }),
      },
    });

    return { success: true };
  }

  async deleteUser(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Пользователь не найден');

      await this.prisma.userRole.deleteMany({ where: { userId } });
      await this.prisma.user.delete({ where: { id: userId } });

      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      throw error;
    }
  }
}

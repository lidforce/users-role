import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class UserUtilsService {
  constructor(private prisma: PrismaService) {}

  async validateRoles(roleIds: number[]): Promise<void> {
    const uniqueRoleIds = Array.from(new Set(roleIds));
    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueRoleIds } },
    });

    if (roles.length !== uniqueRoleIds.length) {
      const existingRoleIds = roles.map((role) => role.id);
      const missingRoleIds = uniqueRoleIds.filter(
        (roleId) => !existingRoleIds.includes(roleId),
      );
      throw new BadRequestException({
        success: false,
        errors: [`Роли с ID ${missingRoleIds.join(', ')} не существуют`],
      });
    }
  }

  async validateLoginUniqueness(
    login: string,
    excludeUserId?: number,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { login },
    });

    if (existingUser && existingUser.id !== excludeUserId) {
      throw new BadRequestException({
        success: false,
        errors: ['Логин уже занят другим пользователем'],
      });
    }
  }

  cleanRoles(roleIds: number[]): number[] {
    return Array.from(new Set(roleIds));
  }

  hasChanges(user, data, newRoles: number[]): boolean {
    const currentRoleIds = user.roles.map((userRole) => userRole.roleId);

    return (
      (data.name && data.name !== user.name) ||
      (data.login && data.login !== user.login) ||
      (data.password && data.password !== user.password) ||
      newRoles.length !== currentRoleIds.length ||
      newRoles.some((roleId) => !currentRoleIds.includes(roleId))
    );
  }
}

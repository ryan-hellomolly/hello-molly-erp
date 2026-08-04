import "server-only";
import { db } from "@/server/db";

export async function replaceUserRoles(actorId: string, userId: string, roleIds: string[]) {
  await db.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });
    if (roleIds.length) {
      await tx.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })) });
    }
    await tx.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
    await tx.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "AUTH_USER_ROLES_REPLACED",
        entityType: "User",
        entityId: userId,
        metadata: { roleIds },
      },
    });
  });
}
export async function replaceRolePermissions(
  actorId: string,
  roleId: string,
  permissionIds: string[],
) {
  await db.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
    const users = await tx.userRole.findMany({ where: { roleId }, select: { userId: true } });
    const userIds = users.map((x) => x.userId);
    if (userIds.length) {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { tokenVersion: { increment: 1 } },
      });
      await tx.session.updateMany({
        where: { userId: { in: userIds }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "AUTH_ROLE_PERMISSIONS_REPLACED",
        entityType: "Role",
        entityId: roleId,
        metadata: { permissionIds, affectedUsers: userIds.length },
      },
    });
  });
}

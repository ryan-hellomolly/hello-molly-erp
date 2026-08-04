import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const permissions = await Promise.all(
    ["system.health.read", "users.read", "users.manage", "roles.manage"].map((code) =>
      db.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: `Initial Phase 0 permission: ${code}` },
      }),
    ),
  );

  const adminRole = await db.role.upsert({
    where: { code: "SYSTEM_ADMIN" },
    update: {},
    create: {
      code: "SYSTEM_ADMIN",
      nameEn: "System administrator",
      nameZh: "系统管理员",
      isSystem: true,
    },
  });

  await Promise.all(
    permissions.map((permission) =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id },
      }),
    ),
  );

  if (process.env.SEED_ADMIN_PASSWORD) {
    const admin = await db.user.upsert({
      where: { email: "admin@hellomolly.com.au" },
      update: {},
      create: {
        email: "admin@hellomolly.com.au",
        displayName: "Local ERP Administrator",
        passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD, { type: argon2.argon2id }),
      },
    });

    await db.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  } else {
    console.info("SEED_ADMIN_PASSWORD is unset; no local administrator user was created.");
  }
}

main()
  .then(() => console.info("Seed completed."))
  .finally(() => db.$disconnect());

#!/usr/bin/env node

/**
 * ============================================================================
 * SCRIPT PARA CREAR O PROMOVER UN SUPER ADMIN
 * ============================================================================
 *
 * USO:
 *   node scripts/create-super-admin.js
 *
 * Este script te permite:
 *   1. Promover un usuario existente a SUPER_ADMIN (Opción 1)
 *   2. Crear un nuevo usuario SUPER_ADMIN desde cero (Opción 2)
 *   3. Crear un gimnasio de prueba + su admin (Opción 3)
 *
 * NO requiere que la app esté corriendo. Solo necesita acceso a la BD
 * configurada en el archivo de entorno (.env).
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function promoteExistingUser() {
  console.log('\n--- Promover usuario existente a SUPER_ADMIN ---\n');

  const email = await ask('Email del usuario existente: ');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    console.log(`❌ No existe un usuario con el email: ${email}`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN', gymId: null },
  });

  console.log('✅ Usuario promovido a Super Admin:');
  console.log(`   ID:    ${updated.id}`);
  console.log(`   Nombre: ${updated.name}`);
  console.log(`   Email:  ${updated.email}`);
  console.log(`   Rol:    ${updated.role}`);
}

async function createNewSuperAdmin() {
  console.log('\n--- Crear nuevo Super Admin ---\n');

  const name = await ask('Nombre completo: ');
  const email = await ask('Email: ');
  const password = await ask('Contraseña temporal: ');

  if (password.length < 6) {
    console.log('❌ La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`❌ Ya existe un usuario con el email: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin creado:');
  console.log(`   ID:    ${user.id}`);
  console.log(`   Nombre: ${user.name}`);
  console.log(`   Email:  ${user.email}`);
  console.log(`   Rol:    ${user.role}`);
  console.log(`\n🔗 El usuario puede iniciar sesión en: /auth/login`);
}

async function createTestGymWithAdmin() {
  console.log('\n--- Crear gimnasio de prueba + Admin ---\n');

  const gymName = await ask('Nombre del gimnasio: ') || 'Gimnasio de Prueba';
  const slug = await ask('Slug del gimnasio: ') || 'gym-prueba';
  const adminName = await ask('Nombre del admin: ') || 'Admin de Prueba';
  const adminEmail = await ask('Email del admin: ') || 'admin@gymprueba.com';
  const password = await ask('Contraseña del admin: ') || 'Temporal123!';

  if (password.length < 6) {
    console.log('❌ La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  const existingSlug = await prisma.gym.findUnique({ where: { slug } });
  if (existingSlug) {
    console.log(`❌ Ya existe un gimnasio con el slug: ${slug}`);
    return;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingEmail) {
    console.log(`❌ Ya existe un usuario con el email: ${adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const gym = await tx.gym.create({
      data: {
        name: gymName,
        slug,
      },
    });

    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        gymId: gym.id,
        isActive: true,
      },
    });

    return { gym, admin };
  });

  console.log('✅ Gimnasio y Admin creados:');
  console.log(`   Gimnasio: ${result.gym.name} (${result.gym.slug})`);
  console.log(`   Admin:    ${result.admin.email}`);
  console.log(`   Link:     /join/${result.gym.slug}`);
}

async function main() {
  console.log('============================================');
  console.log('  CREAR / PROMOVER SUPER ADMIN');
  console.log('============================================');
  console.log('\nOpciones:');
  console.log('  1) Promover usuario existente a SUPER_ADMIN');
  console.log('  2) Crear nuevo Super Admin desde cero');
  console.log('  3) Crear gimnasio de prueba + Admin');
  console.log('  4) Salir');

  const option = await ask('\nSeleccioná una opción (1-4): ');

  switch (option.trim()) {
    case '1':
      await promoteExistingUser();
      break;
    case '2':
      await createNewSuperAdmin();
      break;
    case '3':
      await createTestGymWithAdmin();
      break;
    case '4':
      console.log('👋 Chau!');
      break;
    default:
      console.log('❌ Opción inválida.');
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

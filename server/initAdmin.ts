import { db } from "./db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function initializeAdmin() {
  try {
    const adminPhone = '+998901234567';
    const adminPassword = 'admin123';

    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, adminPhone));

    if (existingAdmin.length > 0) {
      console.log('✅ Admin allaqachon mavjud');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [admin] = await db.insert(users).values({
      phoneNumber: adminPhone,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      email: 'admin@arabictest.uz',
    }).returning();

    console.log('✅ Admin foydalanuvchi yaratildi!');
    console.log('📱 Telefon: ' + adminPhone);
    console.log('🔐 Parol: ' + adminPassword);
    console.log('🆔 ID: ' + admin.id);
  } catch (error: any) {
    console.error('⚠️ Admin yaratishda xatolik:', error.message);
  }
}

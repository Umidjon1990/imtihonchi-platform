import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  console.log('🔑 Admin foydalanuvchi yaratish boshlandi...');

  try {
    const adminPhone = '+998901234567';
    const adminPassword = 'admin123';

    // Avval mavjud admin tekshiramiz
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, adminPhone));

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin allaqachon mavjud. Parolni yangilaymiz...');
      
      // Parolni hash qilamiz
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      // Parolni yangilaymiz
      await db
        .update(users)
        .set({ 
          passwordHash,
          role: 'admin'
        })
        .where(eq(users.phoneNumber, adminPhone));
      
      console.log('✅ Admin paroli yangilandi!');
      console.log('📱 Telefon: ' + adminPhone);
      console.log('🔐 Parol: ' + adminPassword);
      return;
    }

    // Parolni hash qilamiz
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Admin foydalanuvchi yaratamiz
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
    console.log('');
    console.log('⚡ Endi bu ma\'lumotlar bilan login qilishingiz mumkin!');
  } catch (error: any) {
    console.error('❌ Admin yaratishda xatolik:', error.message);
    process.exit(1);
  }
}

seedAdmin()
  .then(() => {
    console.log('✅ Jarayon tugadi');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Jarayonda xatolik:', error);
    process.exit(1);
  });

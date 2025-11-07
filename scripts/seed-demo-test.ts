import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { tests, testCategories, testSections, questions } from '../shared/schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function seedDemoTest() {
  console.log('🌱 Demo test yaratish boshlandi...');

  try {
    // 1. Kategoriya mavjudligini tekshiramiz
    const categories = await db.select().from(testCategories);
    let categoryId: string;
    
    if (categories.length === 0) {
      console.log('❌ Kategoriya topilmadi! Avval kategoriya yarating.');
      process.exit(1);
    } else {
      categoryId = categories[0].id;
      console.log(`✅ Kategoriya topildi: ${categories[0].name}`);
    }

    // 2. Demo test mavjudligini tekshiramiz
    const existingDemoTests = await db
      .select()
      .from(tests)
      .where(eq(tests.isDemo, true));

    if (existingDemoTests.length > 0) {
      console.log('✅ Demo test allaqachon mavjud!');
      console.log(`   ID: ${existingDemoTests[0].id}`);
      console.log(`   Published: ${existingDemoTests[0].isPublished}`);
      
      // Agar published bo'lmasa, uni published qilamiz
      if (!existingDemoTests[0].isPublished) {
        await db
          .update(tests)
          .set({ isPublished: true })
          .where(eq(tests.id, existingDemoTests[0].id));
        console.log('✅ Demo test published qilindi!');
      }
      return;
    }

    // 3. Demo test yaratamiz
    const [demoTest] = await db.insert(tests).values({
      title: 'DEMO - Og\'zaki Arab Tili Testi',
      description: 'Bu bepul demo test orqali platformamizni sinab ko\'ring. Natijalar bazaga saqlanmaydi.',
      categoryId: categoryId,
      teacherId: 'system', // System user
      price: 0,
      isDemo: true,
      isPublished: true,
      mainTestId: null,
    }).returning();

    console.log(`✅ Demo test yaratildi! ID: ${demoTest.id}`);

    // 4. Bo'lim yaratamiz
    const [section] = await db.insert(testSections).values({
      testId: demoTest.id,
      title: 'Og\'zaki Nutq',
      description: 'Arab tilida gaplashing',
      order: 1,
    }).returning();

    console.log(`✅ Bo'lim yaratildi! ID: ${section.id}`);

    // 5. Savollar yaratamiz
    const demoQuestions = [
      {
        sectionId: section.id,
        questionText: 'نفسك عن تحدث',
        questionTextTranslation: 'O\'zingiz haqingizda gapiring',
        questionType: 'speaking' as const,
        order: 1,
        preparationTime: 30,
        speakingTime: 60,
        audioUrl: null,
      },
      {
        sectionId: section.id,
        questionText: 'المفضلة؟ هوايتك ما',
        questionTextTranslation: 'Sevimli mashg\'ulotingiz nima?',
        questionType: 'speaking' as const,
        order: 2,
        preparationTime: 30,
        speakingTime: 60,
        audioUrl: null,
      },
    ];

    await db.insert(questions).values(demoQuestions);
    console.log(`✅ ${demoQuestions.length} ta savol yaratildi!`);

    console.log('\n🎉 Demo test muvaffaqiyatli yaratildi!');
    console.log('   /tests sahifasida ko\'rinishi kerak.');

  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

seedDemoTest();

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
      console.log('⚠️  Kategoriya topilmadi. Yangi kategoriya yaratilmoqda...');
      const [newCategory] = await db.insert(testCategories).values({
        name: 'CEFR OG\'ZAKI QISM',
        description: 'Arab tilida og\'zaki nutq ko\'nikmasini baholash',
      }).returning();
      categoryId = newCategory.id;
      console.log(`✅ Kategoriya yaratildi: ${newCategory.name}`);
    } else {
      categoryId = categories[0].id;
      console.log(`✅ Kategoriya topildi: ${categories[0].name}`);
    }

    // 2. Eski demo testlarni o'chiramiz (agar mavjud bo'lsa)
    const existingDemoTests = await db
      .select()
      .from(tests)
      .where(eq(tests.isDemo, true));

    if (existingDemoTests.length > 0) {
      console.log('⚠️  Eski demo test topildi. O\'chirilmoqda...');
      for (const oldTest of existingDemoTests) {
        // Avval test bilan bog'liq savol va section'larni o'chiramiz
        const sections = await db.select().from(testSections).where(eq(testSections.testId, oldTest.id));
        for (const section of sections) {
          await db.delete(questions).where(eq(questions.sectionId, section.id));
        }
        await db.delete(testSections).where(eq(testSections.testId, oldTest.id));
        // Testni o'chiramiz
        await db.delete(tests).where(eq(tests.id, oldTest.id));
        console.log(`✅ Eski demo test o'chirildi (ID: ${oldTest.id})`);
      }
    }

    // 3. Demo test yaratamiz
    const [demoTest] = await db.insert(tests).values({
      title: 'TEST 1',
      description: 'Bepul demo test - Arab tili og\'zaki nutq ko\'nikmasini baholash',
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
      instructions: 'Arab tilida javob bering. Har bir savol uchun tayyorgarlik va javob berish vaqti beriladi.',
      sectionNumber: 1,
      preparationTime: 30,
      speakingTime: 60,
      parentSectionId: null,
    }).returning();

    console.log(`✅ Bo'lim yaratildi! ID: ${section.id}`);

    // 5. Savollar yaratamiz (8 ta)
    const demoQuestions = [
      {
        sectionId: section.id,
        questionNumber: 1,
        questionText: 'نفسك عن تحدث (O\'zingiz haqingizda gapiring)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 2,
        questionText: 'المفضلة؟ هوايتك ما (Sevimli mashg\'ulotingiz nima?)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 3,
        questionText: 'تعيش؟ أين (Qayerda yashaysiz?)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 4,
        questionText: 'تدرس؟ أو تعمل ماذا (Nima ish qilasiz yoki o\'qiysiz?)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 5,
        questionText: 'الحرة؟ أوقاتك في تفعل ماذا (Bo\'sh vaqtingizda nima qilasiz?)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 6,
        questionText: 'المفضل؟ طعامك ما (Sevimli taomingiz nima?)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 7,
        questionText: 'عائلتك؟ عن أخبرنا (Oilangiz haqida gapiring)',
        preparationTime: 30,
        speakingTime: 60,
      },
      {
        sectionId: section.id,
        questionNumber: 8,
        questionText: 'المستقبلية؟ أحلامك ما (Kelajakdagi orzularingiz nima?)',
        preparationTime: 30,
        speakingTime: 60,
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

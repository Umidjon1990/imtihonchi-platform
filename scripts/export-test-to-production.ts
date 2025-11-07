import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { tests, testCategories, testSections, questions } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Development va Production database'lar
const DEV_DATABASE_URL = "postgresql://neondb_owner:npg_APK0sgYu6IJC@ep-mute-recipe-afhwt0wy.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const PROD_DATABASE_URL = process.env.DATABASE_URL!;

const devSql = neon(DEV_DATABASE_URL);
const devDb = drizzle(devSql);

const prodSql = neon(PROD_DATABASE_URL);
const prodDb = drizzle(prodSql);

async function exportTestToProduction() {
  console.log(`🌱 TEST 1 ni production'ga ko'chirish boshlandi...`);

  try {
    // 1. Development'dan testni o'qiymiz
    const testId = '8fe34d85-086c-4f9f-954c-f4b934101721';
    const [devTest] = await devDb.select().from(tests).where(eq(tests.id, testId));
    
    if (!devTest) {
      console.log(`❌ Development database'da test topilmadi!`);
      process.exit(1);
    }
    
    console.log(`✅ Development'dan test topildi: ${devTest.title}`);

    // 2. Production'da kategoriya borligini tekshiramiz
    const prodCategories = await prodDb.select().from(testCategories);
    let prodCategoryId: string;
    
    if (prodCategories.length === 0) {
      console.log('⚠️  Kategoriya topilmadi. Yangi kategoriya yaratilmoqda...');
      const [newCategory] = await prodDb.insert(testCategories).values({
        name: 'CEFR OG\'ZAKI QISM',
        description: 'Arab tilida og\'zaki nutq ko\'nikmasini baholash',
      }).returning();
      prodCategoryId = newCategory.id;
      console.log(`✅ Kategoriya yaratildi`);
    } else {
      prodCategoryId = prodCategories[0].id;
      console.log(`✅ Kategoriya topildi`);
    }

    // 3. Production'da eski demo testlarni o'chiramiz
    const existingDemoTests = await prodDb.select().from(tests).where(eq(tests.isDemo, true));
    if (existingDemoTests.length > 0) {
      console.log('⚠️  Eski demo test topildi. O\'chirilmoqda...');
      for (const oldTest of existingDemoTests) {
        const sections = await prodDb.select().from(testSections).where(eq(testSections.testId, oldTest.id));
        for (const section of sections) {
          await prodDb.delete(questions).where(eq(questions.sectionId, section.id));
        }
        await prodDb.delete(testSections).where(eq(testSections.testId, oldTest.id));
        await prodDb.delete(tests).where(eq(tests.id, oldTest.id));
        console.log(`✅ Eski demo test o'chirildi`);
      }
    }

    // 4. Production'ga yangi testni qo'shamiz
    const [prodTest] = await prodDb.insert(tests).values({
      title: 'TEST 1',
      description: devTest.description || 'Bepul demo test - Arab tili og\'zaki nutq ko\'nikmasini baholash',
      categoryId: prodCategoryId,
      teacherId: 'system',
      price: 0,
      isDemo: true,
      isPublished: true,
      mainTestId: null,
    }).returning();

    console.log(`✅ Production'da test yaratildi! ID: ${prodTest.id}`);

    // 5. Development'dan section'larni o'qiymiz
    const devSections = await devDb
      .select()
      .from(testSections)
      .where(eq(testSections.testId, testId))
      .orderBy(testSections.sectionNumber);

    console.log(`📋 ${devSections.length} ta bo'lim topildi`);

    // Section ID mapping (dev ID -> prod ID)
    const sectionIdMap: Record<string, string> = {};

    // 6. Section'larni production'ga ko'chiramiz
    for (const devSection of devSections) {
      const [prodSection] = await prodDb.insert(testSections).values({
        testId: prodTest.id,
        sectionNumber: devSection.sectionNumber,
        title: devSection.title,
        instructions: devSection.instructions,
        preparationTime: devSection.preparationTime,
        speakingTime: devSection.speakingTime,
        imageUrl: devSection.imageUrl, // Image URL'ni saqlaymiz (lekin file o'zi ko'chirilmaydi)
        parentSectionId: null, // Keyinroq yangilanadi
      }).returning();

      sectionIdMap[devSection.id] = prodSection.id;
      console.log(`✅ Bo'lim ko'chirildi: ${devSection.title}`);
    }

    // 7. Parent section ID'larni yangilaymiz
    for (const devSection of devSections) {
      if (devSection.parentSectionId) {
        const prodParentId = sectionIdMap[devSection.parentSectionId];
        if (prodParentId) {
          await prodDb
            .update(testSections)
            .set({ parentSectionId: prodParentId })
            .where(eq(testSections.id, sectionIdMap[devSection.id]));
          console.log(`✅ Parent section yangilandi: ${devSection.title}`);
        }
      }
    }

    // 8. Savollarni ko'chiramiz
    let totalQuestions = 0;
    for (const devSection of devSections) {
      const devQuestions = await devDb
        .select()
        .from(questions)
        .where(eq(questions.sectionId, devSection.id))
        .orderBy(questions.questionNumber);

      const prodSectionId = sectionIdMap[devSection.id];

      for (const devQuestion of devQuestions) {
        await prodDb.insert(questions).values({
          sectionId: prodSectionId,
          questionNumber: devQuestion.questionNumber,
          questionText: devQuestion.questionText,
          imageUrl: devQuestion.imageUrl,
          preparationTime: devQuestion.preparationTime,
          speakingTime: devQuestion.speakingTime,
          keyFactsPlus: devQuestion.keyFactsPlus,
          keyFactsMinus: devQuestion.keyFactsMinus,
          keyFactsPlusLabel: devQuestion.keyFactsPlusLabel,
          keyFactsMinusLabel: devQuestion.keyFactsMinusLabel,
          questionAudioUrl: devQuestion.questionAudioUrl,
        });
        totalQuestions++;
      }
    }

    console.log(`✅ ${totalQuestions} ta savol ko'chirildi!`);

    console.log('\n🎉 TEST 1 muvaffaqiyatli production\'ga ko\'chirildi!');
    console.log('   arabictest.uz/tests sahifasida ko\'rinishi kerak.');

  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

exportTestToProduction();

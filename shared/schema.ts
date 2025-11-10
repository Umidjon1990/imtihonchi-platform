import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  jsonb, 
  boolean,
  index 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (Email/Password + Phone/Password compatible)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phoneNumber: varchar("phone_number").unique(), // Phone number for phone/password auth
  passwordHash: varchar("password_hash"), // For email/password or phone/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default('student'), // admin, student
  sessionVersion: integer("session_version").notNull().default(0), // Incremented on role change to invalidate all sessions
  roleChangedAt: timestamp("role_changed_at"), // Last time role was changed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testCategories = pgTable("test_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tests = pgTable("tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  language: text("language").notNull().default('ar'), // ar (Arab), en (Ingliz)
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(false).notNull(),
  isDemo: boolean("is_demo").default(false).notNull(), // Demo test yoki yo'q
  mainTestId: varchar("main_test_id"), // Agar demo bo'lsa, qaysi asosiy testga tegishli
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testSections = pgTable("test_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull(),
  parentSectionId: varchar("parent_section_id"), // null for root sections, otherwise reference to parent section
  sectionNumber: integer("section_number").notNull(), // ordering within parent level
  title: text("title").notNull(),
  instructions: text("instructions"),
  preparationTime: integer("preparation_time").notNull(), // in seconds
  speakingTime: integer("speaking_time").notNull(), // in seconds
  imageUrl: text("image_url"), // Section-level image
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  questionAudioUrl: text("question_audio_url"), // Savol audiosi (o'qituvchi yozadi/yuklaydi)
  preparationTime: integer("preparation_time"), // override section timer if set
  speakingTime: integer("speaking_time"), // override section timer if set
  keyFactsPlus: text("key_facts_plus"), // Plus tomonlari (Bo'lim 3 uchun)
  keyFactsPlusLabel: text("key_facts_plus_label"), // Plus uchun custom label
  keyFactsMinus: text("key_facts_minus"), // Minus tomonlari (Bo'lim 3 uchun)
  keyFactsMinusLabel: text("key_facts_minus_label"), // Minus uchun custom label
});

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  testId: varchar("test_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  status: text("status").notNull().default('pending'), // pending, approved, rejected
  receiptUrl: text("receipt_url"), // URL to payment receipt image
  isDemoAccess: boolean("is_demo_access").default(false).notNull(), // Demo testga avtomatik berilgan access
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull(),
  studentId: varchar("student_id").notNull(),
  testId: varchar("test_id").notNull(),
  audioFiles: jsonb("audio_files"), // Legacy: kept for backwards compatibility, now optional
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: text("status").notNull().default('in_progress'), // in_progress, submitted, graded
  isDemo: boolean("is_demo").default(false).notNull(), // Demo submission (audio storage'ga yozilmaydi)
});

export const submissionAnswers = pgTable("submission_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull(),
  questionId: varchar("question_id").notNull(),
  audioUrl: text("audio_url").notNull(),
  transcript: text("transcript"), // AI transcription from Whisper
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

export const results = pgTable("results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().unique(),
  teacherId: varchar("teacher_id").notNull(),
  score: integer("score"),
  cefrLevel: text("cefr_level"), // A1, A2, B1, B2, C1, C2
  feedback: text("feedback"),
  studentNameOverride: text("student_name_override"), // O'qituvchi tomonidan kiritilgan ism (sertifikat uchun)
  certificateUrl: text("certificate_url"),
  gradedAt: timestamp("graded_at").defaultNow().notNull(),
});

// AI Evaluations from ChatGPT
export const aiEvaluations = pgTable("ai_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().unique(),
  vocabularyScore: integer("vocabulary_score"), // 0-100
  vocabularyFeedback: text("vocabulary_feedback"),
  grammarScore: integer("grammar_score"), // 0-100
  grammarFeedback: text("grammar_feedback"),
  coherenceScore: integer("coherence_score"), // 0-100
  coherenceFeedback: text("coherence_feedback"),
  overallFeedback: text("overall_feedback"),
  suggestedScore: integer("suggested_score"), // 0-100
  suggestedCefrLevel: text("suggested_cefr_level"), // A1, A2, B1, B2, C1, C2
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
});

// Platform Settings (global - single row)
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default('default'),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  contactAddress: text("contact_address"),
  telegramLink: varchar("telegram_link"),
  instagramLink: varchar("instagram_link"),
  youtubeLink: varchar("youtube_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas
export const upsertUserSchema = createInsertSchema(users).omit({ 
  createdAt: true, 
  updatedAt: true 
});

export const insertTestCategorySchema = createInsertSchema(testCategories).omit({ 
  id: true, 
  createdAt: true 
});

export const insertTestSchema = createInsertSchema(tests).omit({ 
  id: true, 
  createdAt: true 
});

export const insertTestSectionSchema = createInsertSchema(testSections).omit({ 
  id: true 
});

export const insertQuestionSchema = createInsertSchema(questions).omit({ 
  id: true 
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({ 
  id: true, 
  purchasedAt: true 
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({ 
  id: true, 
  submittedAt: true 
});

export const insertSubmissionAnswerSchema = createInsertSchema(submissionAnswers).omit({ 
  id: true, 
  answeredAt: true 
});

export const insertResultSchema = createInsertSchema(results).omit({ 
  id: true, 
  gradedAt: true 
});

export const insertAiEvaluationSchema = createInsertSchema(aiEvaluations).omit({ 
  id: true, 
  evaluatedAt: true 
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateSettingsSchema = insertSettingsSchema.partial();

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type TestCategory = typeof testCategories.$inferSelect;
export type InsertTestCategory = z.infer<typeof insertTestCategorySchema>;
export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;
// ✅ Extended Test type with categoryName for frontend audio filtering
export type TestWithCategory = Test & { categoryName?: string | null };
export type TestSection = typeof testSections.$inferSelect;
export type InsertTestSection = z.infer<typeof insertTestSectionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type SubmissionAnswer = typeof submissionAnswers.$inferSelect;
export type InsertSubmissionAnswer = z.infer<typeof insertSubmissionAnswerSchema>;
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type AiEvaluation = typeof aiEvaluations.$inferSelect;
export type InsertAiEvaluation = z.infer<typeof insertAiEvaluationSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

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

// User storage table (Replit Auth compatible)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default('student'), // admin, teacher, student
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
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testSections = pgTable("test_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull(),
  sectionNumber: integer("section_number").notNull(),
  title: text("title").notNull(),
  instructions: text("instructions"),
  preparationTime: integer("preparation_time").notNull(), // in seconds
  speakingTime: integer("speaking_time").notNull(), // in seconds
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  preparationTime: integer("preparation_time"), // override section timer if set
  speakingTime: integer("speaking_time"), // override section timer if set
});

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  testId: varchar("test_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  status: text("status").notNull().default('pending'), // pending, approved, rejected
  receiptUrl: text("receipt_url"), // URL to payment receipt image
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull(),
  studentId: varchar("student_id").notNull(),
  testId: varchar("test_id").notNull(),
  audioFiles: jsonb("audio_files").notNull(), // { sectionId: { questionId: audioUrl } }
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: text("status").notNull().default('submitted'), // submitted, graded
});

export const results = pgTable("results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().unique(),
  teacherId: varchar("teacher_id").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  certificateUrl: text("certificate_url"),
  gradedAt: timestamp("graded_at").defaultNow().notNull(),
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

export const insertResultSchema = createInsertSchema(results).omit({ 
  id: true, 
  gradedAt: true 
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type TestCategory = typeof testCategories.$inferSelect;
export type InsertTestCategory = z.infer<typeof insertTestCategorySchema>;
export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type TestSection = typeof testSections.$inferSelect;
export type InsertTestSection = z.infer<typeof insertTestSectionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

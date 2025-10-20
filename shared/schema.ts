import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  preparationTime: integer("preparation_time").notNull(),
  speakingTime: integer("speaking_time").notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  preparationTime: integer("preparation_time").notNull(),
  speakingTime: integer("speaking_time").notNull(),
});

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  testId: varchar("test_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  status: text("status").notNull(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull(),
  studentId: varchar("student_id").notNull(),
  testId: varchar("test_id").notNull(),
  audioFiles: jsonb("audio_files").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: text("status").notNull(),
});

export const results = pgTable("results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  certificateUrl: text("certificate_url"),
  gradedAt: timestamp("graded_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTestCategorySchema = createInsertSchema(testCategories).omit({ id: true, createdAt: true });
export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true });
export const insertTestSectionSchema = createInsertSchema(testSections).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, purchasedAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true, gradedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TestCategory = typeof testCategories.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type TestSection = typeof testSections.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Result = typeof results.$inferSelect;

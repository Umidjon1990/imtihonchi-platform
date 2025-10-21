import {
  users,
  testCategories,
  tests,
  testSections,
  questions,
  purchases,
  submissions,
  results,
  type User,
  type UpsertUser,
  type TestCategory,
  type InsertTestCategory,
  type Test,
  type InsertTest,
  type TestSection,
  type InsertTestSection,
  type Question,
  type InsertQuestion,
  type Purchase,
  type InsertPurchase,
  type Submission,
  type InsertSubmission,
  type Result,
  type InsertResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Test category operations
  getCategories(): Promise<TestCategory[]>;
  createCategory(category: InsertTestCategory): Promise<TestCategory>;
  updateCategory(id: string, category: Partial<InsertTestCategory>): Promise<TestCategory | undefined>;
  deleteCategory(id: string): Promise<void>;
  
  // Test operations
  getTests(categoryId?: string, teacherId?: string): Promise<Test[]>;
  getTestById(id: string): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: string): Promise<void>;
  
  // Test section operations
  getSectionsByTestId(testId: string): Promise<TestSection[]>;
  createSection(section: InsertTestSection): Promise<TestSection>;
  updateSection(id: string, section: Partial<InsertTestSection>): Promise<TestSection | undefined>;
  deleteSection(id: string): Promise<void>;
  
  // Question operations
  getQuestionsBySectionId(sectionId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<void>;
  
  // Purchase operations
  getPurchasesByStudent(studentId: string): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchaseById(id: string): Promise<Purchase | undefined>;
  getPendingPurchases(): Promise<Purchase[]>;
  updatePurchaseStatus(id: string, status: string): Promise<Purchase | undefined>;
  
  // Submission operations
  getSubmissionsByTest(testId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  getSubmissionsByTeacher(teacherId: string): Promise<any[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionById(id: string): Promise<Submission | undefined>;
  updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission | undefined>;
  
  // Result operations
  createResult(result: InsertResult): Promise<Result>;
  getResultBySubmissionId(submissionId: string): Promise<Result | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Test category operations
  async getCategories(): Promise<TestCategory[]> {
    return await db.select().from(testCategories).orderBy(testCategories.name);
  }

  async createCategory(category: InsertTestCategory): Promise<TestCategory> {
    const [newCategory] = await db.insert(testCategories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertTestCategory>): Promise<TestCategory | undefined> {
    const [updated] = await db
      .update(testCategories)
      .set(category)
      .where(eq(testCategories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(testCategories).where(eq(testCategories.id, id));
  }

  // Test operations
  async getTests(categoryId?: string, teacherId?: string): Promise<Test[]> {
    if (categoryId && teacherId) {
      return await db
        .select()
        .from(tests)
        .where(and(eq(tests.categoryId, categoryId), eq(tests.teacherId, teacherId)))
        .orderBy(desc(tests.createdAt));
    } else if (categoryId) {
      return await db
        .select()
        .from(tests)
        .where(eq(tests.categoryId, categoryId))
        .orderBy(desc(tests.createdAt));
    } else if (teacherId) {
      return await db
        .select()
        .from(tests)
        .where(eq(tests.teacherId, teacherId))
        .orderBy(desc(tests.createdAt));
    }
    
    return await db.select().from(tests).orderBy(desc(tests.createdAt));
  }

  async getTestById(id: string): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test;
  }

  async createTest(test: InsertTest): Promise<Test> {
    const [newTest] = await db.insert(tests).values(test).returning();
    return newTest;
  }

  async updateTest(id: string, testData: Partial<InsertTest>): Promise<Test | undefined> {
    const [updated] = await db.update(tests).set(testData).where(eq(tests.id, id)).returning();
    return updated;
  }

  async deleteTest(id: string): Promise<void> {
    await db.delete(tests).where(eq(tests.id, id));
  }

  // Test section operations
  async getSectionsByTestId(testId: string): Promise<TestSection[]> {
    return await db
      .select()
      .from(testSections)
      .where(eq(testSections.testId, testId))
      .orderBy(testSections.sectionNumber);
  }

  async createSection(section: InsertTestSection): Promise<TestSection> {
    const [newSection] = await db.insert(testSections).values(section).returning();
    return newSection;
  }

  async updateSection(id: string, sectionData: Partial<InsertTestSection>): Promise<TestSection | undefined> {
    const [updated] = await db.update(testSections).set(sectionData).where(eq(testSections.id, id)).returning();
    return updated;
  }

  async deleteSection(id: string): Promise<void> {
    // First delete all questions in this section
    await db.delete(questions).where(eq(questions.sectionId, id));
    // Then delete the section
    await db.delete(testSections).where(eq(testSections.id, id));
  }

  // Question operations
  async getQuestionsBySectionId(sectionId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.sectionId, sectionId))
      .orderBy(questions.questionNumber);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: string, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updated] = await db.update(questions).set(questionData).where(eq(questions.id, id)).returning();
    return updated;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Purchase operations
  async getPurchasesByStudent(studentId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.studentId, studentId))
      .orderBy(desc(purchases.purchasedAt));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async getPurchaseById(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async getPendingPurchases(): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.status, 'pending'))
      .orderBy(desc(purchases.purchasedAt));
  }

  async updatePurchaseStatus(id: string, status: string): Promise<Purchase | undefined> {
    const [updated] = await db
      .update(purchases)
      .set({ status })
      .where(eq(purchases.id, id))
      .returning();
    return updated;
  }

  // Submission operations
  async getSubmissionsByTest(testId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.testId, testId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByTeacher(teacherId: string): Promise<any[]> {
    // Get all tests by teacher
    const teacherTests = await db
      .select()
      .from(tests)
      .where(eq(tests.teacherId, teacherId));
    
    const testIds = teacherTests.map(t => t.id);
    
    if (testIds.length === 0) return [];
    
    // Get submissions for those tests with student info
    const results = await db
      .select({
        id: submissions.id,
        purchaseId: submissions.purchaseId,
        studentId: submissions.studentId,
        testId: submissions.testId,
        audioFiles: submissions.audioFiles,
        submittedAt: submissions.submittedAt,
        status: submissions.status,
        studentName: users.firstName,
        studentLastName: users.lastName,
        testTitle: tests.title,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .innerJoin(tests, eq(submissions.testId, tests.id))
      .where(inArray(submissions.testId, testIds))
      .orderBy(desc(submissions.submittedAt));
    
    return results;
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async getSubmissionById(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async updateSubmission(id: string, submissionData: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const [updated] = await db.update(submissions).set(submissionData).where(eq(submissions.id, id)).returning();
    return updated;
  }

  // Result operations
  async createResult(result: InsertResult): Promise<Result> {
    const [newResult] = await db.insert(results).values(result).returning();
    return newResult;
  }

  async getResultBySubmissionId(submissionId: string): Promise<Result | undefined> {
    const [result] = await db.select().from(results).where(eq(results.submissionId, submissionId));
    return result;
  }
}

export const storage = new DatabaseStorage();

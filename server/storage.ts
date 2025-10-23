import {
  users,
  testCategories,
  tests,
  testSections,
  questions,
  purchases,
  submissions,
  submissionAnswers,
  results,
  aiEvaluations,
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
  type SubmissionAnswer,
  type InsertSubmissionAnswer,
  type Result,
  type InsertResult,
  type AiEvaluation,
  type InsertAiEvaluation,
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
  getDemoTestsByMainTestId(mainTestId: string): Promise<Test[]>;
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
  getPurchaseByStudentAndTest(studentId: string, testId: string): Promise<Purchase | undefined>;
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
  completeSubmission(id: string): Promise<Submission | undefined>;
  
  // Submission Answer operations
  createSubmissionAnswer(answer: InsertSubmissionAnswer): Promise<SubmissionAnswer>;
  getSubmissionAnswers(submissionId: string): Promise<SubmissionAnswer[]>;
  updateSubmissionAnswerTranscript(id: string, transcript: string): Promise<SubmissionAnswer | undefined>;
  
  // Result operations
  createResult(result: InsertResult): Promise<Result>;
  getResultBySubmissionId(submissionId: string): Promise<Result | undefined>;
  
  // AI Evaluation operations
  createAiEvaluation(evaluation: InsertAiEvaluation): Promise<AiEvaluation>;
  getAiEvaluationBySubmissionId(submissionId: string): Promise<AiEvaluation | undefined>;
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

  async getDemoTestsByMainTestId(mainTestId: string): Promise<Test[]> {
    return await db.select().from(tests).where(
      and(
        eq(tests.isDemo, true),
        eq(tests.mainTestId, mainTestId)
      )
    );
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
    // Use transaction to ensure atomic cascade delete
    await db.transaction(async (tx) => {
      // Get all child sections recursively
      const childSections = await this.getChildSectionsRecursive(id);
      const allSectionIds = [id, ...childSections.map(s => s.id)];
      
      // Delete all questions in this section and its children
      if (allSectionIds.length > 0) {
        await tx.delete(questions).where(inArray(questions.sectionId, allSectionIds));
      }
      
      // Delete all child sections and the section itself
      if (allSectionIds.length > 0) {
        await tx.delete(testSections).where(inArray(testSections.id, allSectionIds));
      }
    });
  }

  private async getChildSectionsRecursive(parentId: string): Promise<TestSection[]> {
    const children = await db
      .select()
      .from(testSections)
      .where(eq(testSections.parentSectionId, parentId));
    
    let allChildren: TestSection[] = [...children];
    
    // Recursively get children of children
    for (const child of children) {
      const grandChildren = await this.getChildSectionsRecursive(child.id);
      allChildren = [...allChildren, ...grandChildren];
    }
    
    return allChildren;
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

  async getPurchaseByStudentAndTest(studentId: string, testId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.studentId, studentId),
          eq(purchases.testId, testId)
        )
      );
    return purchase;
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

  async completeSubmission(id: string): Promise<Submission | undefined> {
    const [updated] = await db.update(submissions)
      .set({ status: 'submitted' })
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  // Submission Answer operations
  async createSubmissionAnswer(answer: InsertSubmissionAnswer): Promise<SubmissionAnswer> {
    const [newAnswer] = await db.insert(submissionAnswers).values(answer).returning();
    return newAnswer;
  }

  async getSubmissionAnswers(submissionId: string): Promise<SubmissionAnswer[]> {
    const answers = await db.select()
      .from(submissionAnswers)
      .where(eq(submissionAnswers.submissionId, submissionId))
      .orderBy(submissionAnswers.answeredAt);
    return answers;
  }

  async updateSubmissionAnswerTranscript(id: string, transcript: string): Promise<SubmissionAnswer | undefined> {
    const [updated] = await db.update(submissionAnswers)
      .set({ transcript })
      .where(eq(submissionAnswers.id, id))
      .returning();
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

  // AI Evaluation operations
  async createAiEvaluation(evaluation: InsertAiEvaluation): Promise<AiEvaluation> {
    const [newEvaluation] = await db.insert(aiEvaluations).values(evaluation).returning();
    return newEvaluation;
  }

  async getAiEvaluationBySubmissionId(submissionId: string): Promise<AiEvaluation | undefined> {
    const [evaluation] = await db.select().from(aiEvaluations).where(eq(aiEvaluations.submissionId, submissionId));
    return evaluation;
  }
}

export const storage = new DatabaseStorage();

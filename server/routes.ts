import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertTestCategorySchema,
  insertTestSchema,
  insertTestSectionSchema,
  insertQuestionSchema,
  insertPurchaseSchema,
  insertSubmissionSchema,
  insertResultSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Foydalanuvchini olishda xatolik" });
    }
  });

  // Test category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Kategoriyalarni olishda xatolik" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const data = insertTestCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: error.message || "Kategoriya yaratishda xatolik" });
    }
  });

  // Test routes
  app.get("/api/tests", async (req, res) => {
    try {
      const { categoryId, teacherId } = req.query;
      const tests = await storage.getTests(
        categoryId as string | undefined,
        teacherId as string | undefined
      );
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Testlarni olishda xatolik" });
    }
  });

  app.get("/api/tests/:id", async (req, res) => {
    try {
      const test = await storage.getTestById(req.params.id);
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ message: "Testni olishda xatolik" });
    }
  });

  app.post("/api/tests", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat o'qituvchilar test yarata oladi" });
      }

      const data = insertTestSchema.parse({
        ...req.body,
        teacherId: req.user.claims.sub,
      });
      const test = await storage.createTest(data);
      res.json(test);
    } catch (error: any) {
      console.error("Error creating test:", error);
      res.status(400).json({ message: error.message || "Test yaratishda xatolik" });
    }
  });

  app.patch("/api/tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const test = await storage.getTestById(req.params.id);
      
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }
      
      if (test.teacherId !== req.user.claims.sub && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updateTest(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating test:", error);
      res.status(400).json({ message: error.message || "Testni yangilashda xatolik" });
    }
  });

  app.delete("/api/tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const test = await storage.getTestById(req.params.id);
      
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }
      
      if (test.teacherId !== req.user.claims.sub && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      await storage.deleteTest(req.params.id);
      res.json({ message: "Test o'chirildi" });
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ message: "Testni o'chirishda xatolik" });
    }
  });

  // Test section routes
  app.get("/api/tests/:testId/sections", async (req, res) => {
    try {
      const sections = await storage.getSectionsByTestId(req.params.testId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Bo'limlarni olishda xatolik" });
    }
  });

  app.post("/api/sections", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const data = insertTestSectionSchema.parse(req.body);
      const section = await storage.createSection(data);
      res.json(section);
    } catch (error: any) {
      console.error("Error creating section:", error);
      res.status(400).json({ message: error.message || "Bo'lim yaratishda xatolik" });
    }
  });

  app.patch("/api/sections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updateSection(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating section:", error);
      res.status(400).json({ message: error.message || "Bo'limni yangilashda xatolik" });
    }
  });

  // Question routes
  app.get("/api/sections/:sectionId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestionsBySectionId(req.params.sectionId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Savollarni olishda xatolik" });
    }
  });

  app.post("/api/questions", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const data = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(data);
      res.json(question);
    } catch (error: any) {
      console.error("Error creating question:", error);
      res.status(400).json({ message: error.message || "Savol yaratishda xatolik" });
    }
  });

  app.patch("/api/questions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updateQuestion(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating question:", error);
      res.status(400).json({ message: error.message || "Savolni yangilashda xatolik" });
    }
  });

  // Purchase routes
  app.get("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getPurchasesByStudent(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Xaridlarni olishda xatolik" });
    }
  });

  app.post("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPurchaseSchema.parse({
        ...req.body,
        studentId: req.user.claims.sub,
      });
      const purchase = await storage.createPurchase(data);
      res.json(purchase);
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      res.status(400).json({ message: error.message || "Xarid qilishda xatolik" });
    }
  });

  // Submission routes
  app.get("/api/submissions/student", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const submissions = await storage.getSubmissionsByStudent(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Topshiriqlarni olishda xatolik" });
    }
  });

  app.get("/api/submissions/test/:testId", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const submissions = await storage.getSubmissionsByTest(req.params.testId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Topshiriqlarni olishda xatolik" });
    }
  });

  app.post("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSubmissionSchema.parse({
        ...req.body,
        studentId: req.user.claims.sub,
      });
      const submission = await storage.createSubmission(data);
      res.json(submission);
    } catch (error: any) {
      console.error("Error creating submission:", error);
      res.status(400).json({ message: error.message || "Topshiriq yuborishda xatolik" });
    }
  });

  // Result routes
  app.post("/api/results", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat o'qituvchilar natija berishi mumkin" });
      }

      const data = insertResultSchema.parse({
        ...req.body,
        teacherId: req.user.claims.sub,
      });
      const result = await storage.createResult(data);
      
      // Update submission status to graded
      const submission = await storage.getSubmissionById(data.submissionId);
      if (submission) {
        await storage.updateSubmission(submission.id, { status: 'graded' });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error creating result:", error);
      res.status(400).json({ message: error.message || "Natija yaratishda xatolik" });
    }
  });

  app.get("/api/results/:submissionId", async (req, res) => {
    try {
      const result = await storage.getResultBySubmissionId(req.params.submissionId);
      if (!result) {
        return res.status(404).json({ message: "Natija topilmadi" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching result:", error);
      res.status(500).json({ message: "Natijani olishda xatolik" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import { Client } from "@replit/object-storage";
import { generateCertificate } from "./utils/certificate";
import { transcribeAudio, evaluateSpeaking } from "./utils/openai";
import { 
  insertTestCategorySchema,
  insertTestSchema,
  insertTestSectionSchema,
  insertQuestionSchema,
  insertPurchaseSchema,
  insertSubmissionSchema,
  insertSubmissionAnswerSchema,
  insertResultSchema,
  insertAiEvaluationSchema,
} from "@shared/schema";

// Initialize Replit Object Storage client
const objectStorage = new Client({ bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID });

// Configure multer for receipt uploads (memory storage)
const uploadReceipt = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Faqat JPG, JPEG, PNG formatdagi fayllar qabul qilinadi"));
    }
  },
});

// Configure multer for audio uploads (memory storage)
const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for audio
  fileFilter: (req, file, cb) => {
    const allowedTypes = /webm|mp3|wav|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetypeTest = allowedTypes.test(file.mimetype);
    const isAudio = file.mimetype.includes('audio') || file.mimetype.includes('webm');
    
    if (extname || mimetypeTest || isAudio) {
      cb(null, true);
    } else {
      cb(new Error("Faqat audio formatdagi fayllar qabul qilinadi"));
    }
  },
});

// Configure multer for section image uploads (memory storage)
const uploadSectionImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Faqat JPG, JPEG, PNG, GIF, WEBP formatdagi fayllar qabul qilinadi"));
    }
  },
});

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

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Foydalanuvchilarni olishda xatolik" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const { role } = req.body;
      if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: "Noto'g'ri rol" });
      }

      const updatedUser = await storage.updateUserRole(req.params.id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Rolni yangilashda xatolik" });
    }
  });

  // Get user by ID (for teachers reviewing submissions)
  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      // Only teachers and admins can view other users
      if (currentUser?.role !== 'teacher' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }
      
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

  app.patch("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const data = insertTestCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, data);
      if (!category) {
        return res.status(404).json({ message: "Kategoriya topilmadi" });
      }
      res.json(category);
    } catch (error: any) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: error.message || "Kategoriyani yangilashda xatolik" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      await storage.deleteCategory(req.params.id);
      res.json({ message: "Kategoriya o'chirildi" });
    } catch (error: any) {
      console.error("Error deleting category:", error);
      res.status(400).json({ message: error.message || "Kategoriyani o'chirishda xatolik" });
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
      
      // Validate parent section if provided
      if (data.parentSectionId) {
        const parentSection = await storage.getSectionsByTestId(data.testId);
        const parent = parentSection.find(s => s.id === data.parentSectionId);
        
        if (!parent) {
          return res.status(400).json({ message: "Parent bo'lim topilmadi" });
        }
        
        // Ensure parent belongs to the same test
        if (parent.testId !== data.testId) {
          return res.status(400).json({ message: "Parent bo'lim boshqa testga tegishli" });
        }
      }
      
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

  // Upload section image
  app.post("/api/upload-section-image", isAuthenticated, uploadSectionImage.single("file"), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to object storage
      const uniqueName = `section-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
      const objectKey = `.private/${uniqueName}`;
      await objectStorage.uploadFromBytes(objectKey, req.file.buffer);
      
      const url = `/api/section-images/${uniqueName}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading section image:", error);
      res.status(500).json({ message: error.message || "Rasm yuklashda xatolik" });
    }
  });

  // Get section image
  app.get("/api/section-images/:filename", async (req, res) => {
    try {
      // Security: prevent path traversal
      const basename = path.basename(req.params.filename);
      const objectKey = `.private/${basename}`;
      const result = await objectStorage.downloadAsBytes(objectKey);
      
      if (!result.ok) {
        return res.status(404).json({ message: "Rasm topilmadi" });
      }

      const [fileData] = result.value;

      // Determine content type from filename
      const ext = path.extname(basename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                         ext === '.gif' ? 'image/gif' :
                         ext === '.webp' ? 'image/webp' : 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.send(fileData);
    } catch (error: any) {
      console.error("Error getting section image:", error);
      res.status(500).json({ message: error.message || "Rasmni olishda xatolik" });
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

  app.delete("/api/questions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      res.status(400).json({ message: error.message || "Savolni o'chirishda xatolik" });
    }
  });

  app.delete("/api/sections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      await storage.deleteSection(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting section:", error);
      res.status(400).json({ message: error.message || "Bo'limni o'chirishda xatolik" });
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

  app.post("/api/upload-receipt", isAuthenticated, uploadReceipt.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to object storage
      const uniqueName = `receipt-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
      const objectKey = `.private/${uniqueName}`;
      await objectStorage.uploadFromBytes(objectKey, req.file.buffer);
      
      const url = `/api/receipts/${uniqueName}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: error.message || "Chek yuklashda xatolik" });
    }
  });

  app.get("/api/receipts/:filename", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin' && user?.role !== 'student') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const basename = path.basename(req.params.filename);
      const objectKey = `.private/${basename}`;
      const result = await objectStorage.downloadAsBytes(objectKey);
      
      if (!result.ok) {
        return res.status(404).json({ message: "Fayl topilmadi" });
      }

      const [fileData] = result.value;

      const ext = path.extname(basename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.send(fileData);
    } catch (error: any) {
      console.error("Error getting receipt:", error);
      res.status(500).json({ message: error.message || "Chekni olishda xatolik" });
    }
  });

  app.post("/api/upload-audio", isAuthenticated, uploadAudio.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to object storage - force .webm extension for MediaRecorder compatibility
      const uniqueName = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
      const objectKey = `.private/audio/${uniqueName}`;
      await objectStorage.uploadFromBytes(objectKey, req.file.buffer);
      
      const url = `/api/audio/${uniqueName}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      res.status(500).json({ message: error.message || "Audio yuklashda xatolik" });
    }
  });

  app.get("/api/audio/:filename", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const basename = path.basename(req.params.filename);
      const objectKey = `.private/audio/${basename}`;
      const result = await objectStorage.downloadAsBytes(objectKey);
      
      if (!result.ok) {
        return res.status(404).json({ message: "Fayl topilmadi" });
      }

      const [fileData] = result.value;

      const ext = path.extname(basename).toLowerCase();
      const contentType = ext === '.webm' ? 'audio/webm' : 
                         ext === '.mp3' ? 'audio/mpeg' :
                         ext === '.wav' ? 'audio/wav' :
                         ext === '.ogg' ? 'audio/ogg' : 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.send(fileData);
    } catch (error: any) {
      console.error("Error getting audio:", error);
      res.status(500).json({ message: error.message || "Audio olishda xatolik" });
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

  app.get("/api/purchases/pending", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const purchases = await storage.getPendingPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
      res.status(500).json({ message: "Pending xaridlarni olishda xatolik" });
    }
  });

  app.get("/api/purchases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const purchase = await storage.getPurchaseById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Xarid topilmadi" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      
      if (purchase.studentId !== req.user.claims.sub && user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      res.json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      res.status(500).json({ message: "Xaridni olishda xatolik" });
    }
  });

  app.patch("/api/purchases/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updatePurchaseStatus(req.params.id, 'approved');
      res.json(updated);
    } catch (error: any) {
      console.error("Error approving purchase:", error);
      res.status(400).json({ message: error.message || "Xaridni tasdiqlashda xatolik" });
    }
  });

  app.patch("/api/purchases/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updatePurchaseStatus(req.params.id, 'rejected');
      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting purchase:", error);
      res.status(400).json({ message: error.message || "Xaridni rad etishda xatolik" });
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

  app.get("/api/submissions/teacher", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const submissions = await storage.getSubmissionsByTeacher(user.id);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching teacher submissions:", error);
      res.status(500).json({ message: "Topshiriqlarni olishda xatolik" });
    }
  });

  app.get("/api/submissions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Check if user is the teacher or student
      const user = await storage.getUser(req.user.claims.sub);
      const test = await storage.getTestById(submission.testId);
      
      if (user?.id !== submission.studentId && 
          user?.id !== test?.teacherId && 
          user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      // Get student info
      const student = await storage.getUser(submission.studentId);
      
      res.json({
        ...submission,
        studentName: student?.firstName || "",
        studentLastName: student?.lastName || "",
      });
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ message: "Topshiriqni olishda xatolik" });
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
        status: 'in_progress', // Start with in_progress status
      });
      const submission = await storage.createSubmission(data);
      res.json(submission);
    } catch (error: any) {
      console.error("Error creating submission:", error);
      res.status(400).json({ message: error.message || "Topshiriq yuborishda xatolik" });
    }
  });

  // Submit answer for a single question
  app.post("/api/submissions/:id/answer", isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Verify user owns this submission
      if (submission.studentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      // Map audioFile to audioUrl for schema compatibility
      const { audioFile, ...rest } = req.body;
      const data = insertSubmissionAnswerSchema.parse({
        ...rest,
        audioUrl: audioFile,
      });
      
      const answer = await storage.createSubmissionAnswer({
        ...data,
        submissionId: req.params.id,
      });
      
      res.json(answer);
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      res.status(400).json({ message: error.message || "Javob yuborishda xatolik" });
    }
  });

  // Complete submission (mark as submitted)
  app.post("/api/submissions/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Verify user owns this submission
      if (submission.studentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.completeSubmission(req.params.id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error completing submission:", error);
      res.status(400).json({ message: error.message || "Topshiriqni yakunlashda xatolik" });
    }
  });

  // Get submission answers
  app.get("/api/submissions/:id/answers", isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      
      // Allow access for student who owns it, or teacher/admin
      if (submission.studentId !== req.user.claims.sub && 
          user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const answers = await storage.getSubmissionAnswers(req.params.id);
      res.json(answers);
    } catch (error: any) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Javoblarni olishda xatolik" });
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

      // Get submission and test info for certificate
      const submission = await storage.getSubmissionById(data.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      const student = await storage.getUser(submission.studentId);
      const test = await storage.getTestById(submission.testId);
      const teacher = await storage.getUser(req.user.claims.sub);

      // Get transcripts for certificate
      const submissionAnswers = await storage.getSubmissionAnswers(data.submissionId);
      const sections = await storage.getSectionsByTestId(submission.testId);
      
      // Get all questions for all sections (do this once, outside the loop)
      const allQuestions: any[] = [];
      for (const section of sections) {
        const sectionQuestions = await storage.getQuestionsBySectionId(section.id);
        allQuestions.push(...sectionQuestions);
      }
      
      // Build transcripts array with question details
      const transcripts: Array<{ questionNumber: number; questionText: string; transcript: string }> = [];
      
      for (const answer of submissionAnswers) {
        if (answer.transcript) {
          const question = allQuestions.find(q => q.id === answer.questionId);
          if (question) {
            transcripts.push({
              questionNumber: question.questionNumber,
              questionText: question.questionText,
              transcript: answer.transcript
            });
          }
        }
      }
      
      // Sort transcripts by question number
      transcripts.sort((a, b) => a.questionNumber - b.questionNumber);

      // Generate certificate
      let certificateUrl = '';
      try {
        // Use override name if provided, otherwise use student's database name
        const studentName = data.studentNameOverride 
          ? data.studentNameOverride 
          : `${student?.firstName || ''} ${student?.lastName || ''}`.trim();
        
        certificateUrl = await generateCertificate({
          studentName,
          testTitle: test?.title || '',
          score: data.score || 0,
          cefrLevel: data.cefrLevel || '',
          gradedAt: new Date(),
          teacherName: `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.trim(),
          feedback: data.feedback || undefined,
          transcripts: transcripts.length > 0 ? transcripts : undefined,
        });
      } catch (certError) {
        console.error("Certificate generation error:", certError);
        // Continue without certificate if generation fails
      }

      const result = await storage.createResult({
        ...data,
        certificateUrl,
      });
      
      // Update submission status to graded
      await storage.updateSubmission(submission.id, { status: 'graded' });
      
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

  // Certificate download endpoint
  app.get("/api/certificates/:filename", isAuthenticated, async (req: any, res) => {
    try {
      // Sanitize filename to prevent path traversal
      const filename = path.basename(req.params.filename);
      const objectKey = `.private/certificates/${filename}`;
      
      const result = await objectStorage.downloadAsBytes(objectKey);
      
      if (!result.ok) {
        return res.status(404).json({ message: "Sertifikat topilmadi" });
      }

      const [fileData] = result.value;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileData);
    } catch (error) {
      console.error("Error serving certificate:", error);
      res.status(500).json({ message: "Sertifikatni yuklashda xatolik" });
    }
  });

  // AI Evaluation routes
  // Transcribe all audio answers for a submission
  app.post("/api/submissions/:id/transcribe", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat o'qituvchilar transkripsiya qila oladi" });
      }

      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Get all audio answers
      const answers = await storage.getSubmissionAnswers(req.params.id);
      
      if (answers.length === 0) {
        return res.status(400).json({ message: "Audio javoblar topilmadi" });
      }

      // Transcribe each audio file
      const transcriptionPromises = answers.map(async (answer) => {
        try {
          // Skip if already transcribed
          if (answer.transcript) {
            return { answerId: answer.id, transcript: answer.transcript, skipped: true };
          }

          // Extract filename from URL
          const audioUrl = answer.audioUrl;
          const filename = audioUrl.split('/').pop() || 'audio.webm';
          const objectKey = `.private/audio/${filename}`;

          // Download audio from object storage
          const downloadResult = await objectStorage.downloadAsBytes(objectKey);
          
          if (!downloadResult.ok) {
            console.error(`Failed to download audio: ${filename}`);
            return { answerId: answer.id, error: "Audio yuklab olinmadi" };
          }

          const [audioBuffer] = downloadResult.value;

          // Transcribe using Whisper
          const { text } = await transcribeAudio(audioBuffer, filename);

          // Update answer with transcript
          await storage.updateSubmissionAnswerTranscript(answer.id, text);

          return { answerId: answer.id, transcript: text };
        } catch (error: any) {
          console.error(`Transcription error for answer ${answer.id}:`, error);
          return { answerId: answer.id, error: error.message };
        }
      });

      const results = await Promise.all(transcriptionPromises);
      
      res.json({ 
        message: "Transkripsiya yakunlandi", 
        results,
        total: answers.length,
        transcribed: results.filter(r => r.transcript).length,
      });
    } catch (error: any) {
      console.error("Error transcribing:", error);
      res.status(500).json({ message: "Transkripsiya xatolik" });
    }
  });

  // Evaluate submission using ChatGPT
  app.post("/api/submissions/:id/ai-evaluate", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat o'qituvchilar baholashi mumkin" });
      }

      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Check if already evaluated
      const existingEvaluation = await storage.getAiEvaluationBySubmissionId(req.params.id);
      if (existingEvaluation) {
        return res.json(existingEvaluation);
      }

      // Get test to determine language
      const test = await storage.getTestById(submission.testId);
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }

      // Get all transcripts
      const answers = await storage.getSubmissionAnswers(req.params.id);
      const transcripts = answers
        .filter(a => a.transcript)
        .map(a => a.transcript as string);

      if (transcripts.length === 0) {
        return res.status(400).json({ 
          message: "Avval '1. Audio → Matn' tugmasini bosing",
          needsTranscription: true
        });
      }

      // Evaluate using GPT-4o with test language
      const testLanguage = (test.language === 'en' || test.language === 'ar') ? test.language : 'ar';
      const evaluation = await evaluateSpeaking(transcripts, testLanguage);

      // Save evaluation
      const saved = await storage.createAiEvaluation({
        submissionId: req.params.id,
        ...evaluation,
      });

      res.json(saved);
    } catch (error: any) {
      console.error("Error evaluating:", error);
      res.status(500).json({ message: error.message || "AI baholash xatolik" });
    }
  });

  // Get AI evaluation for a submission
  app.get("/api/submissions/:id/ai-evaluation", isAuthenticated, async (req: any, res) => {
    try {
      const evaluation = await storage.getAiEvaluationBySubmissionId(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "AI baholash topilmadi" });
      }
      res.json(evaluation);
    } catch (error) {
      console.error("Error fetching AI evaluation:", error);
      res.status(500).json({ message: "AI baholashni olishda xatolik" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

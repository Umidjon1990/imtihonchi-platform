import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupPassport } from "./passport";
import { adminAuth } from "./firebaseAdmin";
import { getUserId } from "./authHelpers";
import bcrypt from "bcrypt";
import { pool } from "./db";
import { uploadToObjectStorage, getObjectStorageUrl, downloadFromObjectStorage, generateFilename, getFilePath, ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import path from "path";
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
  updateSettingsSchema,
} from "@shared/schema";

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
  // Setup Passport serialization (required for all auth methods)
  setupPassport();
  
  // Setup Replit Auth
  await setupAuth(app);

  // Google OAuth routes temporarily disabled
  // app.get('/auth/google', (req, res, next) => {
  //   const protocol = req.protocol;
  //   const host = req.get('host');
  //   const callbackURL = `${protocol}://${host}/auth/google/callback`;
  //   
  //   passport.authenticate('google', {
  //     scope: ['profile', 'email'],
  //     callbackURL: callbackURL,
  //   } as any)(req, res, next);
  // });

  // app.get('/auth/google/callback',
  //   passport.authenticate('google', { failureRedirect: '/' }),
  //   (req, res) => {
  //     // Successful authentication, redirect to dashboard
  //     res.redirect('/');
  //   }
  // );

  // Google logout route
  app.get('/auth/google/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  // Firebase Phone Auth endpoint
  app.post('/api/auth/firebase', async (req: Request, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "ID token kerak" });
      }

      // Verify Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;
      const uid = decodedToken.uid;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Telefon raqam topilmadi" });
      }

      // Create or update user in database
      await storage.upsertUser({
        id: uid,
        email: phoneNumber, // Use phone as email for now
        firstName: phoneNumber.slice(0, 13), // Use phone as first name
        lastName: "",
        profileImageUrl: "",
      });

      // Fetch full user data including sessionVersion
      const dbUser = await storage.getUser(uid);
      if (!dbUser) {
        return res.status(500).json({ message: "Foydalanuvchi yaratishda xatolik" });
      }

      // Create session with full user data including sessionVersion
      const user = {
        id: dbUser.id,
        email: dbUser.email,
        phoneNumber: phoneNumber,
        role: dbUser.role,
        sessionVersion: dbUser.sessionVersion ?? 0, // IMPORTANT: Include version for session invalidation
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      };

      // Log the user in via Passport session
      req.login(user, (err) => {
        if (err) {
          console.error("Session yaratishda xatolik:", err);
          return res.status(500).json({ message: "Session yaratishda xatolik" });
        }
        res.json({ success: true, user });
      });
    } catch (error: any) {
      console.error("Firebase auth xatolik:", error);
      res.status(401).json({ message: "Autentifikatsiya xatosi: " + error.message });
    }
  });

  // Email/Password Registration
  app.post('/api/register', async (req: Request, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi shart" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Parol kamida 6 belgidan iborat bo'lishi kerak" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.upsertUser({
        email,
        passwordHash,
        firstName,
        lastName,
        profileImageUrl: "",
        role: 'student', // Default role for new registrations
      });

      // Create session with full user object
      req.login(newUser, (err) => {
        if (err) {
          console.error("Session yaratishda xatolik:", err);
          return res.status(500).json({ message: "Session yaratishda xatolik" });
        }
        res.json({ success: true, user: newUser });
      });
    } catch (error: any) {
      console.error("Registration xatolik:", error);
      res.status(500).json({ message: "Ro'yxatdan o'tishda xatolik: " + error.message });
    }
  });

  // Email/Password Login
  app.post('/api/login', async (req: Request, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email va parol kiritilishi shart" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
      }

      // Check if user has password (not a Replit Auth user)
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Bu akkaunt Replit orqali yaratilgan. Replit bilan kiring." });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
      }

      // Create session with full user object
      req.login(user, (err) => {
        if (err) {
          console.error("Session yaratishda xatolik:", err);
          return res.status(500).json({ message: "Session yaratishda xatolik" });
        }
        res.json({ success: true, user });
      });
    } catch (error: any) {
      console.error("Login xatolik:", error);
      res.status(500).json({ message: "Kirishda xatolik: " + error.message });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: Request, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout xatolik:", err);
        return res.status(500).json({ message: "Chiqishda xatolik" });
      }
      res.json({ success: true });
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res) => {
    try {
      // Support both Replit Auth and Firebase Auth
      const userId = (req.user as any)?.id || getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Foydalanuvchini olishda xatolik" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: Request, res) => {
    try {
      const userId = (req.user as any)?.id || getUserId(req);
      const currentUser = await storage.getUser(userId);
      
      // Admin-only access
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat admin foydalanuvchilarga ruxsat berilgan" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Foydalanuvchilarni olishda xatolik" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: Request, res) => {
    try {
      const userId = (req.user as any)?.id || getUserId(req);
      const currentUser = await storage.getUser(userId);
      
      // Admin-only access
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat admin foydalanuvchilarga ruxsat berilgan" });
      }
      
      const { role } = req.body;
      if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: "Noto'g'ri rol" });
      }

      const updatedUser = await storage.updateUserRole(req.params.id, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }
      
      // IMPORTANT: Invalidate all sessions for this user
      // This forces them to re-login and get the new role
      try {
        // 1. Delete PostgreSQL sessions (for Replit Auth users)
        const searchPattern = `%"id":"${req.params.id}"%`;
        const deleteResult = await pool.query(
          'DELETE FROM sessions WHERE sess::text LIKE $1',
          [searchPattern]
        );
        console.log(`Deleted ${deleteResult.rowCount || 0} session(s) for user ${req.params.id} after role change to ${role}`);
        
        // 2. Revoke Firebase refresh tokens (for Firebase Auth users)
        // This invalidates all Firebase ID tokens issued before this point
        try {
          await adminAuth.revokeRefreshTokens(req.params.id);
          console.log(`Revoked Firebase refresh tokens for user ${req.params.id}`);
        } catch (firebaseError: any) {
          // Firebase may fail if user doesn't exist in Firebase Auth
          // This is fine - user might be Replit Auth only
          if (firebaseError?.code !== 'auth/user-not-found') {
            console.error("Error revoking Firebase tokens:", firebaseError);
          }
        }
        
        console.log(`Successfully invalidated all sessions for user ${req.params.id} (sessionVersion=${updatedUser.sessionVersion})`);
      } catch (sessionError) {
        console.error("Error invalidating user sessions:", sessionError);
        // Don't fail the request if session invalidation fails
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Rolni yangilashda xatolik" });
    }
  });

  // Get user by ID (for teachers reviewing submissions)
  app.get('/api/users/:id', isAuthenticated, async (req: Request, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await storage.getUser(userId);
      // Only teachers and admins can view other users
      if (currentUser?.role !== 'admin') {
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

  app.post("/api/categories", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
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

  app.patch("/api/categories/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
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

  app.delete("/api/categories/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
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

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settingsData = await storage.getSettings();
      res.json(settingsData || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Sozlamalarni olishda xatolik" });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const data = updateSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSettings(data);
      res.json(updatedSettings);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(400).json({ message: error.message || "Sozlamalarni yangilashda xatolik" });
    }
  });

  // Test routes
  // Get demo test (public endpoint)
  app.get("/api/demo-test", async (req, res) => {
    try {
      const demoTests = await storage.getTests(undefined, undefined);
      const demoTest = demoTests.find(t => t.isDemo);
      
      if (!demoTest) {
        return res.status(404).json({ message: "Demo test topilmadi" });
      }
      
      res.json(demoTest);
    } catch (error) {
      console.error("Error fetching demo test:", error);
      res.status(500).json({ message: "Demo testni olishda xatolik" });
    }
  });

  app.get("/api/tests", async (req, res) => {
    try {
      const user = req.user as any;
      const isAdmin = user?.role === 'admin';
      const isTeacher = user?.role === 'teacher';
      
      // Admin va teacher barcha testlarni ko'radi
      if (isAdmin || isTeacher) {
        const { categoryId, teacherId } = req.query;
        const tests = await storage.getTests(
          categoryId as string | undefined,
          teacherId as string | undefined
        );
        return res.json(tests);
      }
      
      // Student va guest faqat published testlarni ko'radi
      const tests = await storage.getPublishedTests();
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

  app.post("/api/tests", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat adminlar test yarata oladi" });
      }

      const data = insertTestSchema.parse({
        ...req.body,
        teacherId: getUserId(req),
      });
      const test = await storage.createTest(data);
      res.json(test);
    } catch (error: any) {
      console.error("Error creating test:", error);
      res.status(400).json({ message: error.message || "Test yaratishda xatolik" });
    }
  });

  app.patch("/api/tests/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      const test = await storage.getTestById(req.params.id);
      
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }
      
      if (test.teacherId !== getUserId(req) && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updateTest(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating test:", error);
      res.status(400).json({ message: error.message || "Testni yangilashda xatolik" });
    }
  });

  app.delete("/api/tests/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      const test = await storage.getTestById(req.params.id);
      
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }
      
      if (test.teacherId !== getUserId(req) && user?.role !== 'admin') {
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

  app.post("/api/sections", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
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

  app.patch("/api/sections/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
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
  app.post("/api/upload-section-image", isAuthenticated, uploadSectionImage.single("file"), async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to Object Storage
      const filename = generateFilename(req.file.originalname, 'section-');
      const filePath = getFilePath('image', filename);
      await uploadToObjectStorage(filePath, req.file.buffer, req.file.mimetype);
      
      const url = `/api/section-images/${filename}`;
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
      const filePath = getFilePath('image', basename);
      
      // Get URL from Object Storage
      const signedUrl = await getObjectStorageUrl(filePath);
      
      // Redirect to signed URL
      res.redirect(signedUrl);
    } catch (error: any) {
      console.error("Error getting section image:", error);
      res.status(404).json({ message: "Rasm topilmadi" });
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

  app.post("/api/questions", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
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

  app.patch("/api/questions/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const updated = await storage.updateQuestion(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating question:", error);
      res.status(400).json({ message: error.message || "Savolni yangilashda xatolik" });
    }
  });

  app.delete("/api/questions/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      res.status(400).json({ message: error.message || "Savolni o'chirishda xatolik" });
    }
  });

  app.delete("/api/sections/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
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
  app.get("/api/purchases", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = getUserId(req);
      const purchases = await storage.getPurchasesByStudent(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Xaridlarni olishda xatolik" });
    }
  });

  app.post("/api/upload-receipt", isAuthenticated, uploadReceipt.single("file"), async (req: Request, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to Object Storage
      const filename = generateFilename(req.file.originalname, 'receipt-');
      const filePath = getFilePath('receipt', filename);
      await uploadToObjectStorage(filePath, req.file.buffer, req.file.mimetype);
      
      const url = `/api/receipts/${filename}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: error.message || "Chek yuklashda xatolik" });
    }
  });

  app.get("/api/receipts/:filename", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'student') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const basename = path.basename(req.params.filename);
      const filePath = getFilePath('receipt', basename);
      
      // Get URL from Object Storage
      const signedUrl = await getObjectStorageUrl(filePath);
      
      // Redirect to signed URL
      res.redirect(signedUrl);
    } catch (error: any) {
      console.error("Error getting receipt:", error);
      res.status(404).json({ message: "Chekni olishda xatolik" });
    }
  });

  // Upload question audio (for teachers creating questions)
  app.post("/api/upload-question-audio", isAuthenticated, uploadAudio.single("file"), async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat adminlar savol audiosi yuklashi mumkin" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to Object Storage
      const filename = `question-audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
      const filePath = getFilePath('question-audio', filename);
      await uploadToObjectStorage(filePath, req.file.buffer, req.file.mimetype || 'audio/webm');
      
      const url = `/api/question-audio/${filename}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading question audio:", error);
      res.status(500).json({ message: error.message || "Savol audiosini yuklashda xatolik" });
    }
  });

  // Get question audio (public - for students taking tests)
  app.get("/api/question-audio/:filename", async (req: Request, res) => {
    try {
      const basename = path.basename(req.params.filename);
      const filePath = getFilePath('question-audio', basename);
      
      // Get URL from Object Storage
      const signedUrl = await getObjectStorageUrl(filePath);
      
      if (!signedUrl) {
        return res.status(404).json({ message: "Audio topilmadi" });
      }
      
      // Redirect to the signed URL
      res.redirect(signedUrl);
    } catch (error) {
      console.error("Error getting question audio:", error);
      res.status(500).json({ message: "Audiodni olishda xatolik" });
    }
  });

  app.post("/api/upload-audio", isAuthenticated, uploadAudio.single("file"), async (req: Request, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Fayl tanlanmagan" });
      }
      
      // Upload to Object Storage - force .webm extension for MediaRecorder compatibility
      const filename = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
      const filePath = getFilePath('audio', filename);
      await uploadToObjectStorage(filePath, req.file.buffer, 'audio/webm');
      
      const url = `/api/audio/${filename}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      res.status(500).json({ message: error.message || "Audio yuklashda xatolik" });
    }
  });

  app.get("/api/audio/:filename", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (!user) {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const basename = path.basename(req.params.filename);
      const filePath = getFilePath('audio', basename);
      
      // Get URL from Object Storage
      const signedUrl = await getObjectStorageUrl(filePath);
      
      // Redirect to signed URL
      res.redirect(signedUrl);
    } catch (error: any) {
      console.error("Error getting audio:", error);
      res.status(404).json({ message: "Audio topilmadi" });
    }
  });

  app.post("/api/purchases", isAuthenticated, async (req: Request, res) => {
    try {
      const data = insertPurchaseSchema.parse({
        ...req.body,
        studentId: getUserId(req),
      });
      const purchase = await storage.createPurchase(data);
      res.json(purchase);
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      res.status(400).json({ message: error.message || "Xarid qilishda xatolik" });
    }
  });

  app.get("/api/purchases/pending", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const purchases = await storage.getPendingPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
      res.status(500).json({ message: "Pending xaridlarni olishda xatolik" });
    }
  });

  app.get("/api/purchases/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const purchase = await storage.getPurchaseById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Xarid topilmadi" });
      }

      const user = await storage.getUser(getUserId(req));
      
      if (purchase.studentId !== getUserId(req) && user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      res.json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      res.status(500).json({ message: "Xaridni olishda xatolik" });
    }
  });

  app.patch("/api/purchases/:id/approve", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      // Approve the main purchase
      const updated = await storage.updatePurchaseStatus(req.params.id, 'approved');
      
      // Check if test has a demo version
      const purchase = await storage.getPurchaseById(req.params.id);
      if (purchase) {
        const demoTests = await storage.getDemoTestsByMainTestId(purchase.testId);
        
        // Auto-create approved purchases for all demo tests
        for (const demoTest of demoTests) {
          // Check if student already has demo access
          const existingDemoPurchase = await storage.getPurchaseByStudentAndTest(
            purchase.studentId, 
            demoTest.id
          );
          
          if (!existingDemoPurchase) {
            await storage.createPurchase({
              studentId: purchase.studentId,
              testId: demoTest.id,
              status: 'approved', // Auto-approve demo
              receiptUrl: null, // Demo doesn't need receipt
              isDemoAccess: true, // Mark as auto-granted demo access
            });
          }
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error approving purchase:", error);
      res.status(400).json({ message: error.message || "Xaridni tasdiqlashda xatolik" });
    }
  });

  app.patch("/api/purchases/:id/reject", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
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
  app.get("/api/submissions/student", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = getUserId(req);
      const submissions = await storage.getSubmissionsByStudent(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Topshiriqlarni olishda xatolik" });
    }
  });

  app.get("/api/submissions/admin", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const submissions = await storage.getSubmissionsByTeacher(user.id);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching admin submissions:", error);
      res.status(500).json({ message: "Topshiriqlarni olishda xatolik" });
    }
  });

  app.get("/api/submissions/:id", isAuthenticated, async (req: Request, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Check if user is the teacher or student
      const user = await storage.getUser(getUserId(req));
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

  app.get("/api/submissions/test/:testId", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const submissions = await storage.getSubmissionsByTest(req.params.testId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Topshiriqlarni olishda xatolik" });
    }
  });

  app.post("/api/submissions", isAuthenticated, async (req: Request, res) => {
    try {
      // Check if test is a demo test
      const test = await storage.getTestById(req.body.testId);
      const isDemo = test?.isDemo || false;
      
      const data = insertSubmissionSchema.parse({
        ...req.body,
        studentId: getUserId(req),
        status: 'in_progress', // Start with in_progress status
        isDemo, // Mark as demo if test is demo
      });
      const submission = await storage.createSubmission(data);
      res.json(submission);
    } catch (error: any) {
      console.error("Error creating submission:", error);
      res.status(400).json({ message: error.message || "Topshiriq yuborishda xatolik" });
    }
  });

  // Submit answer for a single question
  app.post("/api/submissions/:id/answer", isAuthenticated, async (req: Request, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Verify user owns this submission
      if (submission.studentId !== getUserId(req)) {
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
  app.post("/api/submissions/:id/complete", isAuthenticated, async (req: Request, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      // Verify user owns this submission
      if (submission.studentId !== getUserId(req)) {
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
  app.get("/api/submissions/:id/answers", isAuthenticated, async (req: Request, res) => {
    try {
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      const user = await storage.getUser(getUserId(req));
      
      // Allow access for student who owns it, or teacher/admin
      if (submission.studentId !== getUserId(req) && 
          user?.role !== 'admin') {
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
  app.post("/api/results", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat adminlar natija berishi mumkin" });
      }

      const data = insertResultSchema.parse({
        ...req.body,
        teacherId: getUserId(req),
      });

      // Get submission and test info for certificate
      const submission = await storage.getSubmissionById(data.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Topshiriq topilmadi" });
      }

      const student = await storage.getUser(submission.studentId);
      const test = await storage.getTestById(submission.testId);
      const teacher = await storage.getUser(getUserId(req));

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
      const transcripts: Array<{ 
        questionNumber: number; 
        questionText: string; 
        transcript: string;
        sectionNumber: number;
      }> = [];
      
      for (const answer of submissionAnswers) {
        if (answer.transcript) {
          const question = allQuestions.find(q => q.id === answer.questionId);
          if (question) {
            // Find section to get section number
            const section = sections.find(s => s.id === question.sectionId);
            transcripts.push({
              questionNumber: question.questionNumber,
              questionText: question.questionText,
              transcript: answer.transcript,
              sectionNumber: section?.sectionNumber ?? 0
            });
          }
        }
      }
      
      // Sort transcripts by section number first, then question number
      transcripts.sort((a, b) => {
        if (a.sectionNumber !== b.sectionNumber) {
          return a.sectionNumber - b.sectionNumber;
        }
        return a.questionNumber - b.questionNumber;
      });

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
  app.get("/api/certificates/:filename", isAuthenticated, async (req: Request, res) => {
    try {
      // Sanitize filename to prevent path traversal
      const filename = path.basename(req.params.filename);
      const filePath = getFilePath('certificate', filename);
      
      // Download from Object Storage
      const fileData = await downloadFromObjectStorage(filePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileData);
    } catch (error) {
      console.error("Error serving certificate:", error);
      res.status(404).json({ message: "Sertifikat topilmadi" });
    }
  });

  // AI Evaluation routes
  // Transcribe all audio answers for a submission
  app.post("/api/submissions/:id/transcribe", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat adminlar transkripsiya qila oladi" });
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
          const filePath = getFilePath('audio', filename);

          // Download audio from Object Storage
          const audioBuffer = await downloadFromObjectStorage(filePath);

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
  app.post("/api/submissions/:id/ai-evaluate", isAuthenticated, async (req: Request, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Faqat adminlar baholashi mumkin" });
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
  app.get("/api/submissions/:id/ai-evaluation", isAuthenticated, async (req: Request, res) => {
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

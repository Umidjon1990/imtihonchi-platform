import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // For production, you should use a service account key
  // For development/testing, we can use the project ID
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || "arabictest-86f32",
  });
}

export const adminAuth = admin.auth();

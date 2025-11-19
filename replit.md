# ArabicTest - Arab Tili Bilimini Baholash Platformasi

## Overview
ArabicTest is a CEFR-standardized Arabic language proficiency assessment platform. It enables students to test their Arabic skills across four core competencies (reading, listening, writing, speaking). Administrators create tests, grade them with AI assistance, manage payments, and have full system control. The platform aims to serve students learning Arabic and individuals seeking language assessment. It supports a comprehensive evaluation experience from test creation to AI-powered grading and certificate generation.

## User Preferences
I prefer simple language and detailed explanations. I want an iterative development approach. Ask before making major changes. Do not make changes to the `server/replitAuth.ts` and `server/objectStorage.ts` files.

## System Architecture
The platform is built with a modern web stack, featuring React + TypeScript for the frontend, Express + TypeScript + Drizzle ORM for the backend, and PostgreSQL for the database. Authentication is handled via local Phone + Password authentication. File storage utilizes Replit Object Storage. Payment processing is managed manually via Telegram. The design adheres to Material Design principles, ensuring a professional educational platform aesthetic with a dark mode default and specific typography (Inter for UI, JetBrains Mono for timers).

**Key Features & Technical Implementations:**
- **Authentication System:** Phone number + password authentication. Admin creates all student accounts manually. Students contact admin via Telegram to register and receive login credentials.
- **Role-Based Access Control:** Admin and Student roles (Teacher functionality merged into Admin). Admin creates tests, grades submissions, manages users, and manually approves test access. Students purchase and take tests. Guest users can browse and take free demo tests.
- **Admin User Management:** Admin can create students (POST `/api/admin/create-student`), update passwords (PATCH `/api/admin/update-student-password/:id`), and delete students (DELETE `/api/admin/delete-student/:id`). All user management is manual via admin panel.
- **Simplified Registration Flow:** No self-registration. Students visit public test catalog → click "Buy Test" → redirected to Telegram → admin creates their account with login credentials → admin manually assigns test access.
- **Dynamic Test Structure:** Tests are composed of categories, sections, and questions. Sections can include image uploads, and speaking questions support configurable preparation and speaking timers with automatic progression.
- **AI-Powered Assessment:** GPT-4o is used for Arabic language evaluation, providing detailed feedback and recommendations.
- **Audio Recording & Storage:** Utilizes MediaRecorder API for audio capture, with files uploaded to Replit Object Storage.
- **Manual Payment System via Telegram:** Students contact admin on Telegram for payment. Admin manually approves test access after receiving payment confirmation.
- **PDF Certificate Generation:** Generates multi-page PDF certificates including CEFR levels, AI analysis, and transcription, with full Arabic font and RTL support.
- **Demo Test System:** Allows guest users to take a free practice test with local audio storage to experience the platform.
- **Settings Management:** Admin-managed platform settings for contact information and social media links (especially Telegram link for registration/payment).
- **Security:** Return URL validation for login flows to prevent open redirect vulnerabilities.
- **API Design:** Backend APIs return JSON in camelCase format for consistency with the frontend.
- **Audio Restriction:** Audio playback and upload is restricted to Listening category tests only. Reading tests display text without audio to avoid wasting Eleven Labs tokens.

## Recent Changes (November 2025)
- **Phone-based Authentication:** Migrated from Replit Auth (OIDC) and Firebase Phone Auth to local Phone + Password authentication.
- **Admin-Only User Creation:** Disabled self-registration. Admin creates all student accounts manually via admin panel or API.
- **Simplified Payment Flow:** Removed Stripe integration. All payments handled manually via Telegram.
- **Database Schema Updates:** Phone number is now required and unique. Email is optional. Password hash is required.
- **Admin API Endpoints:** Added create student, update password, and delete student endpoints.

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **Authentication:** Local Phone + Password (Replit Auth and Firebase disabled)
- **File Storage:** Replit Object Storage
- **Payments:** Manual via Telegram (Stripe disabled)
- **AI Services:** OpenAI's GPT-4o for language evaluation
- **Frontend Framework:** React
- **UI Component Library:** Shadcn UI
- **Database ORM:** Drizzle ORM
```
# ArabicTest - Arab Tili Bilimini Baholash Platformasi

## Overview
ArabicTest is a CEFR-standardized Arabic language proficiency assessment platform. It enables students to test their Arabic skills across four core competencies (reading, listening, writing, speaking). Administrators create tests, grade them with AI assistance, manage payments, and have full system control. The platform aims to serve students learning Arabic and individuals seeking language assessment. It supports a comprehensive evaluation experience from test creation to AI-powered grading and certificate generation.

## User Preferences
I prefer simple language and detailed explanations. I want an iterative development approach. Ask before making major changes. Do not make changes to the `server/replitAuth.ts` and `server/objectStorage.ts` files.

## System Architecture
The platform is built with a modern web stack, featuring React + TypeScript for the frontend, Express + TypeScript + Drizzle ORM for the backend, and PostgreSQL for the database. Authentication is handled via Replit Auth (OIDC), and file storage utilizes Replit Object Storage. Stripe is integrated for payments. The design adheres to Material Design principles, ensuring a professional educational platform aesthetic with a dark mode default and specific typography (Inter for UI, JetBrains Mono for timers).

**Key Features & Technical Implementations:**
- **Role-Based Access Control:** Admin and Student roles (Teacher functionality merged into Admin). Admin creates tests, grades submissions, approves payments. Students purchase and take tests. Guest users can browse and take free demo tests.
- **Dynamic Test Structure:** Tests are composed of categories, sections, and questions. Sections can include image uploads, and speaking questions support configurable preparation and speaking timers with automatic progression.
- **AI-Powered Assessment:** GPT-4o is used for Arabic language evaluation, providing detailed feedback and recommendations.
- **Audio Recording & Storage:** Utilizes MediaRecorder API for audio capture, with files uploaded to Replit Object Storage.
- **Manual Payment System:** Supports receipt uploads by students and approval/rejection by admins.
- **PDF Certificate Generation:** Generates multi-page PDF certificates including CEFR levels, AI analysis, and transcription, with full Arabic font and RTL support.
- **Demo Test System:** Allows guest users to take a free practice test with local audio storage to experience the platform.
- **Settings Management:** Admin-managed platform settings for contact information and social media links.
- **Security:** Return URL validation for login flows to prevent open redirect vulnerabilities.
- **API Design:** Backend APIs return JSON in camelCase format for consistency with the frontend.

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **Authentication:** Replit Auth (OIDC)
- **File Storage:** Replit Object Storage
- **Payments:** Stripe
- **AI Services:** OpenAI's GPT-4o for language evaluation
- **Frontend Framework:** React
- **UI Component Library:** Shadcn UI
- **Database ORM:** Drizzle ORM
```
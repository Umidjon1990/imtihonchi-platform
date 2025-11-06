# ArabicTest - Arab Tili Bilimini Baholash Platformasi

## Loyiha Haqida

ArabicTest - CEFR standartlariga asoslangan arab tili bilimini baholash platformasi. Platforma o'quvchilarga arab tilini to'rt asosiy ko'nikma (o'qish, tinglash, yozish, gapirish) bo'yicha sinash, o'qituvchilarga testlar yaratish va AI yordamida baholash, va adminlarga butun tizimni boshqarish imkoniyatini beradi.

**Asosiy Xususiyatlar:**
- 📖 **O'qish (Reading)** - Matnlarni tushunish va tahlil qilish
- 🎧 **Tinglash (Listening)** - Audio materiallarni eshitib tushunish
- ✍️ **Yozish (Writing)** - Yozma ishlar yaratish va grammatika
- 🎤 **Gapirish (Speaking)** - Og'zaki nutq ko'nikmalari (audio yozuv)

**Target Auditoriya:** Arab tilini o'rganuvchi o'quvchilar, tilni baholashni xohlaydigan shaxslar

## Texnologiyalar

- **Frontend**: React + TypeScript + Wouter + TanStack Query + Shadcn UI
- **Backend**: Express + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: Replit Auth (OIDC)
- **File Storage**: Replit Object Storage
- **Payments**: Stripe
- **Design System**: Material Design principles bilan professional ta'lim platformasi

## Arxitektura

### Database Schema

- `users` - Foydalanuvchilar (Replit Auth bilan sinxronlangan, role: admin/teacher/student)
- `test_categories` - Test kategoriyalari
- `tests` - Testlar (o'qituvchilar tomonidan yaratilgan)
- `test_sections` - Test bo'limlari (har bir test 3 bo'limga ega)
- `questions` - Savollar (har bir bo'limda bir nechta savol)
- `purchases` - Talabalar tomonidan sotib olingan testlar (manual to'lov)
- `submissions` - Topshirilgan testlar (status: in_progress/submitted/graded)
- `submission_answers` - Har bir savol uchun alohida audio javob
- `results` - O'qituvchilar tomonidan berilgan natijalar va sertifikatlar

### Backend API Endpoints

**Auth**:
- `GET /api/auth/user` - Joriy foydalanuvchini olish (protected)
- `GET /api/login` - Login boshlash
- `GET /api/logout` - Logout

**Categories** (Admin only):
- `GET /api/categories` - Barcha kategoriyalar
- `POST /api/categories` - Yangi kategoriya yaratish

**Tests**:
- `GET /api/tests?categoryId=&teacherId=` - Testlar ro'yxati
- `GET /api/tests/:id` - Bitta test
- `POST /api/tests` - Yangi test yaratish (teacher/admin)
- `PATCH /api/tests/:id` - Testni yangilash (teacher/admin)
- `DELETE /api/tests/:id` - Testni o'chirish (teacher/admin)

**Sections & Questions**:
- `GET /api/tests/:testId/sections` - Test bo'limlari
- `POST /api/sections` - Yangi bo'lim (teacher/admin)
- `PATCH /api/sections/:id` - Bo'limni yangilash (teacher/admin)
- `GET /api/sections/:sectionId/questions` - Bo'lim savollari
- `POST /api/questions` - Yangi savol (teacher/admin)
- `PATCH /api/questions/:id` - Savolni yangilash (teacher/admin)

**Purchases** (Manual Payment):
- `GET /api/purchases` - Foydalanuvchining xaridlari
- `POST /api/purchases` - Yangi xarid (chek yuklash bilan)
- `PATCH /api/purchases/:id/status` - To'lovni tasdiqlash/rad etish (teacher/admin)
- `POST /api/upload-receipt` - Chek yuklash
- `GET /api/receipt/:filename` - Chekni ko'rish

**Submissions**:
- `GET /api/submissions/student` - Talabaning topshiriqlari
- `GET /api/submissions/test/:testId` - Test bo'yicha topshiriqlar (teacher/admin)
- `POST /api/submissions` - Yangi topshiriq yaratish (status: in_progress)
- `POST /api/submissions/:id/answer` - Har bir savol uchun javob yuklash
- `POST /api/submissions/:id/complete` - Topshiriqni yakunlash (status: submitted)
- `GET /api/submissions/:id/answers` - Topshiriq javoblarini olish
- `POST /api/upload-audio` - Audio faylni object storage'ga yuklash
- `GET /api/audio/:filename` - Audio faylni tinglash

**Results**:
- `POST /api/results` - Natija berish (teacher/admin)
- `GET /api/results/:submissionId` - Topshiriq natijasi

## Rollar va Vazifalari

### Admin
- Kategoriyalarni yaratish va boshqarish
- Barcha testlarni ko'rish va boshqarish
- Foydalanuvchilarni boshqarish (keyingi bosqichda)

### O'qituvchi
- Testlar yaratish va tahrirlash
- Har bir bo'lim va savol uchun timer sozlash
- Bo'lim 1.2 va Bo'lim 2 uchun rasm yuklash
- Talabalarning topshiriqlarini baholash
- Natijalar va sertifikatlar berish

### Talaba
- Testlarni ko'rish va sotib olish
- Sotib olingan testlarni topshirish (audio yozuv bilan)
- Natijalar va sertifikatlarni ko'rish

## Test Tuzilmasi (CEFR Og'zaki)

### Bo'lim 1: Shaxsiy ma'lumotlar va hayot (6 savol)
- Har bir savol: 5 soniya tayyorgarlik + 30 soniya gapirish
- 1.2 savolida rasm yuklash

### Bo'lim 2: Vaziyatga asoslangan savol (1 savol)
- 1 daqiqa tayyorgarlik + 2 daqiqa gapirish
- Rasm yuklash (vaziyat tasviri)

### Bo'lim 3: Muhokama savoli (1 savol)
- 1 daqiqa tayyorgarlik + 2 daqiqa gapirish
- Key faktlar (Plus/Minus tomonlar) sozlanadi
- Har bir savol uchun custom label (masalan: "Afzalliklari", "Kamchiliklari")

## Muhim Xususiyatlar

### API Response Format
- Backend API'lar **camelCase** formatda JSON qaytaradi (frontend bilan mos)
- `apiRequest` funksiyasi avtomatik ravishda `res.json()` qaytaradi

## Deployment

**✅ Replit Platform** - Asosiy deployment environment
- **Authentication**: Replit Auth (OIDC) - `server/replitAuth.ts`
- **Storage**: Replit Object Storage - `server/objectStorage.ts`
- **Database**: Neon PostgreSQL (Replit integration)
- **Routes**: `/api/login`, `/api/logout`, `/api/callback`
- **Auth Pattern**: `isAuthenticated` middleware, `req.user.claims.sub`

## Joriy Holat

✅ **Bajarilgan (Replit Environment)**:
1. Replit Auth integratsiyasi (OIDC)
2. Database schema va migratsiyalar
3. Backend API endpointlari (CRUD)
4. Frontend auth va role-based routing
5. Landing sahifasi
6. Student Dashboard (real API bilan bog'langan)
7. Teacher Dashboard (test yaratish, tahrirlash)
8. Object Storage integratsiyasi (rasm yuklash)
9. Test topshirish interfeysi:
   - MediaRecorder API bilan audio yozuv
   - Har bo'lim uchun sozlanadigan timer
   - Real-time progress tracking
   - Savollar orasida navigatsiya
   - Audio fayllarni Object Storage ga yuklash
10. Manual to'lov tizimi:
    - Chek yuklash (talaba)
    - To'lovni tasdiqlash/rad etish (o'qituvchi)
    - Status tracking (pending/approved/rejected)
11. Key faktlar tizimi (Bo'lim 3):
    - Plus/Minus tomonlar (content)
    - Custom labellar har bir savol uchun
    - Dinamik ko'rsatish TakeTest da
12. Mikrofon test bosqichi:
    - Test boshlanishidan oldin mikrofon tekshirish
    - O'zbekcha sample matn bilan audio yozish
    - Playback bilan tekshirish
    - Tasdiqlashdan keyin asosiy testga o'tish
13. Avtomatik progression tizimi:
    - Ikki fazali timer: Tayyorgarlik va Gapirish
    - Katta, ko'zga ko'rinadigan timer display (120px-160px)
    - Tayyorgarlik vaqti tugagach avtomatik recording boshlanadi
    - Gapirish vaqti tugagach avtomatik keyingi savolga o'tiladi
    - Fazalarga qarab rangli timer (primary/green/red)
    - **Flat list yondashuvi**: Barcha savollar bitta ro'yxatda (globalQuestionIndex)
    - **Ref-based state management**: `globalQuestionIndexRef` va `flatQuestionListRef` 
      ishlatib useEffect double-trigger muammosini hal qilindi
    - Hech qaysi savol skip qilinmaydi - barcha 8 savol ketma-ket ko'rsatiladi
14. Avtomatik yuklash tizimi (Progressive Submission):
    - Test boshlanishida submission yaratiladi (status: in_progress)
    - Har savol tugagach darhol audio yuklash background'da
    - Har savol uchun alohida submission_answers jadvali yozuvi
    - Oxirgi savol tugagach submission complete qilinadi (status: submitted)
    - Frontend freeze muammosini hal qiladi
15. O'qituvchi audio tinglash tizimi:
    - ReviewSubmission sahifasida har savol uchun audio player
    - submission_answers API'dan ma'lumot olish
    - Har savol uchun alohida audio ko'rsatish
    - Progress tracking (javob berilgan savollar soni)
16. **3 sahifali PDF sertifikat**:
    - **Sahifa 1 (landscape):** Sertifikat - CEFR darajasi, ball, talaba ismi, o'qituvchi imzosi
    - **Sahifa 2 (portrait):** Talaba gaplari - barcha savollar va ularning transcriptlari (Whisper tomonidan)
    - **Sahifa 3 (landscape):** AI izohlar va tavsiyalar - GPT-4o tahlili
    - **Arabic font support:** Noto Sans Arabic ishlatiladi (Nix store'dan)
    - **RTL support:** `features: ['rtla']` bilan Arabic matn to'g'ri ko'rsatiladi
    - **Font fallback:** Graceful degradation - agar Arabic font topilmasa Helvetica ishlatiladi
    - **Overflow handling:** Ko'p sahifaga o'tganda border va title avtomatik qayta chiziladi
    - **Backend:** Barcha submission answers va question details olish va PDF'ga uzatish
17. **AI Baholash Tizimi (Fixed)**:
    - Backend: Drizzle ORM snake_case dan camelCase'ga mapping
    - Frontend: `apiRequest` to'g'ri JSON qaytaradi (Response obyekt emas)
    - GPT-4o arab tilida to'g'ri baholash
    - Feedback textarea'da to'liq AI tahlil ko'rsatiladi
    - Sertifikatda AI feedback to'g'ri saqlanadi
18. **Demo Test Tizimi**:
    - **Schema**: `tests.isDemo`, `tests.mainTestId`, `purchases.isDemoAccess`, `submissions.isDemo`
    - **Avtomatik access**: Asosiy test sotib olinganda demo test ham beriladi
    - **localStorage audio**: Demo testda audio server'ga yuklanmaydi (localStorage'da saqlanadi)
    - **Bir marta**: Demo test faqat 1 marta topshiriladi, qayta kirib bo'lmaydi
    - **UI badges**: Student Dashboard'da sariq "📱 DEMO" badge'lar ko'rsatiladi
    - **O'qituvchiga ko'rinmaydi**: Demo submission'lar teacher dashboard'da chiqmaydi
    - **AI baholanmaydi**: Demo test uchun transcription va AI evaluation chaqirilmaydi
    - **Tekin amaliyot**: Talabalar asosiy testdan oldin platformani sinab ko'rishlari mumkin
19. **Mobil Rasm Yuklash**:
    - **Yaxshilangan UI**: Hidden file input + katta tugma (mobil uchun oson)
    - **Kamera/Galereya**: Mobil qurilmalarda native picker avtomatik kamera va galereya tanlovini ko'rsatadi
    - **Visual feedback**: Fayl tanlanganda toast notification
    - **EditTest.tsx**: Bo'lim uchun rasm yuklash mobil-optimized
20. **TakeTest UI Optimization**:
    - **Rasm joylashuvi**: Savol ostida darhol ko'rsatiladi (savol → rasm → timer)
    - **Compact timer**: 60px-80px (120px-160px o'rniga) - ekranda hammasi ko'rinadi
    - **Birlashtirilgan karta**: Timer va audio javob holati bitta kartada
    - **Waveform ichida**: Canvas va audio status timer ramkasi ichida
    - **Kichik elementlar**: Audio holati, alert, va playerlar kichikroq o'lchamlarda

⏳ **Navbatda**:
- Admin panel (kategoriyalar, foydalanuvchilar)

## Dizayn Yo'riqnomalar

- **Ranglar**: To'q havo ko'k (210° 80% 55%) asosiy rang, dark mode default
- **Tipografiya**: Inter (interfeys), JetBrains Mono (timerlar)
- **Komponentlar**: Shadcn UI kutubxonasi
- **Til**: Barcha interfeys va xabarlar o'zbek tilida

## Muhim Eslatmalar

- Barcha API yo'nalishlari role-based authentication bilan himoyalangan
- Timer sozlamalari har bir savol uchun alohida (override) bo'lishi mumkin
- Audio fayllar object storage da saqlanadi
- Sertifikatlar PDF formatida yaratiladi va object storage da saqlanadi

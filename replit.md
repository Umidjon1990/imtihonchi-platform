# Imtihonchi - CEFR Og'zaki Baholash Platformasi

## Loyiha Haqida

Imtihonchi - CEFR og'zaki baholash platformasi bo'lib, uchta asosiy rol (Admin, O'qituvchi, Talaba) bilan ishlaydi. Platforma o'qituvchilarga sozlanadigan timerlar va rasm yuklash imkoniyati bilan test yaratish, talabalarga testlarni sotib olish va audio yozuv bilan topshirish, va adminlarga butun tizimni boshqarish imkoniyatini beradi.

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

## Joriy Holat

✅ **Bajarilgan**:
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

⏳ **Navbatda**:
- O'qituvchi baholash tizimi (audio tinglab natija berish)
- Admin panel (kategoriyalar, foydalanuvchilar)
- Sertifikat generatsiyasi

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

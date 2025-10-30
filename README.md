# 🎓 Imtihonchi - CEFR Og'zaki Baholash Platformasi

Arab tilida CEFR og'zaki baholash platformasi - o'qituvchilar, talabalar va adminlar uchun.

## 🌟 Xususiyatlar

### 👨‍🎓 Talabalar uchun
- ✅ **Bepul Demo Test** - Platformani sinab ko'rish
- ✅ **Manual To'lov** - Chek yuklash orqali test sotib olish
- ✅ **Audio Yozuv** - Mikrofon bilan javoblar yozish
- ✅ **Natijalar** - CEFR darajasi va PDF sertifikat

### 👨‍🏫 O'qituvchilar uchun
- ✅ **Test Yaratish** - 3 bo'limli CEFR testlari
- ✅ **Timer Sozlash** - Har savol uchun tayyorgarlik va gapirish vaqti
- ✅ **Rasm Yuklash** - Bo'lim 1.2 va Bo'lim 2 uchun
- ✅ **AI Baholash** - Whisper (transkriptsiya) + GPT-4o (tahlil)
- ✅ **PDF Sertifikat** - 3 sahifali professional sertifikat
- ✅ **To'lovlarni Tasdiqlash** - Talabalar chekini ko'rib tasdiqlash

### 👨‍💼 Adminlar uchun
- ✅ **Kategoriyalar** - Test kategoriyalarini boshqarish
- ✅ **Foydalanuvchilar** - (Keyingi versiya)

## 🛠️ Texnologiyalar

- **Frontend:** React + TypeScript + Wouter + TanStack Query + Shadcn UI
- **Backend:** Express + TypeScript + Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **Auth:** Replit Auth (OIDC) - Railway uchun Clerk/Auth0 kerak
- **Storage:** Replit Object Storage - Railway uchun S3/R2 kerak
- **AI:** OpenAI (Whisper + GPT-4o)
- **PDF:** PDFKit

## 📦 O'rnatish

### 1. Repository clone qilish
```bash
git clone https://github.com/USERNAME/imtihonchi.git
cd imtihonchi
```

### 2. Dependencies o'rnatish
```bash
npm install
```

### 3. Environment variables
`.env` fayl yarating va `.env.example` dan nusxa oling:
```bash
cp .env.example .env
```

Kerakli qiymatlarni kiriting:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret key (min 32 characters)
- `OPENAI_API_KEY` - OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key

### 4. Database setup
```bash
npm run db:push
```

### 5. Development server
```bash
npm run dev
```

App http://localhost:5000 da ochiladi.

## 🚀 Production Deploy

### Replit Deployments (Tavsiya)
1. Replit'da **Deploy** tugmasini bosing
2. **Autoscale** tanlang
3. Deploy!

### Railway (Alternative)
1. GitHub'ga push qiling
2. Railway'da project yarating
3. Environment variables qo'shing
4. PostgreSQL database qo'shing
5. Deploy!

**Batafsil:** `DEPLOYMENT.md` faylini ko'ring.

## 📚 Test Tuzilmasi

### Bo'lim 1: Shaxsiy ma'lumotlar (6 savol)
- Har savol: 5s tayyorgarlik + 30s gapirish
- 1.2 savolida rasm

### Bo'lim 2: Vaziyat (1 savol)
- 1 daqiqa tayyorgarlik + 2 daqiqa gapirish
- Rasm (vaziyat tasviri)

### Bo'lim 3: Muhokama (1 savol)
- 1 daqiqa tayyorgarlik + 2 daqiqa gapirish
- Key faktlar (Plus/Minus)

## 🎯 PDF Sertifikat

3 sahifali professional sertifikat:
1. **Sahifa 1:** CEFR darajasi, ball, imzo
2. **Sahifa 2:** AI tahlili va tavsiyalar (GPT-4o)
3. **Sahifa 3:** Barcha javoblar transkriptsiyasi (Whisper)

## 🔐 Authentication

**Replit (Default):**
- Replit Auth (OIDC)
- Faqat Replit'da ishlaydi

**Railway uchun:**
- Clerk (https://clerk.com) - Tavsiya
- Auth0 (https://auth0.com)
- NextAuth.js

## 📁 File Storage

**Replit (Default):**
- Replit Object Storage
- Faqat Replit'da ishlaydi

**Railway uchun:**
- AWS S3
- Cloudflare R2 (Arzonroq!)

## 🗄️ Database Schema

- `users` - Foydalanuvchilar (role: admin/teacher/student)
- `test_categories` - Test kategoriyalari
- `tests` - Testlar
- `test_sections` - Test bo'limlari
- `questions` - Savollar
- `purchases` - Xaridlar (manual to'lov)
- `submissions` - Topshirilgan testlar
- `submission_answers` - Har savol uchun javob
- `results` - Natijalar va sertifikatlar

## 📝 API Endpoints

**Auth:**
- `GET /api/auth/user` - Current user
- `GET /api/login` - Login
- `GET /api/logout` - Logout

**Tests:**
- `GET /api/tests` - Testlar ro'yxati
- `POST /api/tests` - Yangi test (teacher/admin)
- `GET /api/tests/:id` - Bitta test

**Purchases:**
- `GET /api/purchases` - Xaridlar
- `POST /api/purchases` - Yangi xarid
- `POST /api/upload-receipt` - Chek yuklash

**Submissions:**
- `GET /api/submissions/student` - Talaba topshiriqlari
- `POST /api/submissions` - Yangi topshiriq
- `POST /api/submissions/:id/answer` - Javob yuklash
- `POST /api/upload-audio` - Audio yuklash

**Results:**
- `POST /api/results` - Natija berish (teacher/admin)
- `GET /api/results/:submissionId` - Natija olish

## 🎨 Design

- **Ranglar:** To'q havo ko'k (210° 80% 55%)
- **Dark Mode:** Default
- **Font:** Inter (interfeys), JetBrains Mono (timerlar)
- **Components:** Shadcn UI
- **Til:** O'zbek

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome!

## 📞 Support

Savollar uchun: [GitHub Issues](https://github.com/USERNAME/imtihonchi/issues)

---

**Made with ❤️ for CEFR Arabic Speaking Assessment**

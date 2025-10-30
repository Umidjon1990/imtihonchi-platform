# 🚂 Railway Deployment - Bosqichma-bosqich Qo'llanma

## ✅ Migration Status

**COMPLETED:**
- Backend auth: Replit Auth → Clerk (`@clerk/express` package)
- Backend storage: Replit Object Storage → Cloudflare R2
- Frontend auth: ClerkProvider, SignIn/SignUp UI
- User sync: Clerk users auto-synced to database
- All routes updated with Clerk middleware

**PENDING:**
- Railway deployment testing (follow this guide)
- Production credentials setup

---

## Part 1: Clerk Auth Setup (15 daqiqa)

### 1. Clerk Account Yaratish

1. **https://clerk.com** ga o'ting
2. **Sign up** tugmasini bosing (GitHub bilan)
3. **Create Application** → Name: "Imtihonchi"
4. **Configure**:
   - Enable **Email** authentication
   - Enable **Google** social login (optional)
   - **Primary language:** Uzbek (yoki English)

### 2. Clerk API Keys Olish

Dashboard'da **API Keys** bo'limiga o'ting:

```
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Bularni yozib qo'ying - keyin Railway'ga qo'shamiz.

### 3. User Roles Sozlash (Muhim!)

Clerk dashboard'da:
1. **User & Authentication** → **Metadata**
2. **Public metadata** qo'shing har bir user uchun:
   ```json
   {
     "role": "student"
   }
   ```

**Rollar:**
- `admin` - Administrator
- `teacher` - O'qituvchi
- `student` - Talaba (default)

**Birinchi admin yaratish:**
1. O'zingiz ro'yxatdan o'ting
2. Clerk dashboard'da **Users** → Sizning profilingiz
3. **Metadata** → **Public metadata:**
   ```json
   {
     "role": "admin"
   }
   ```

---

## Part 2: Cloudflare R2 Setup (20 daqiqa)

### 1. Cloudflare Account

1. **https://dash.cloudflare.com** ga o'ting
2. Sign up / Login
3. **R2 Object Storage** → **Create bucket**
   - Bucket name: `imtihonchi-files`
   - Location: Automatic

### 2. R2 API Token Yaratish

1. **R2** → **Manage R2 API Tokens**
2. **Create API token**:
   - Token name: `imtihonchi-railway`
   - Permissions: **Object Read & Write**
   - R2 bucket: `imtihonchi-files`
3. **Create** → Quyidagilar ko'rsatiladi:

```
Access Key ID: xxxxxxxxxxxx
Secret Access Key: yyyyyyyyyyyy
Endpoint: https://xxxxxxxx.r2.cloudflarestorage.com
```

**⚠️ MUHIM:** Secret Key faqat 1 marta ko'rsatiladi! Yozib qo'ying!

### 3. Public URL (Optional)

Custom domain qo'shish:
1. R2 bucket → **Settings** → **Public access**
2. **Allow Access** → Domain qo'shing
3. DNS CNAME record:
   ```
   files.your-domain.com → bucket.r2.cloudflarestorage.com
   ```

---

## Part 3: GitHub Push

### 1. Git Init

```bash
git init
git add .
git commit -m "Railway deployment ready - Clerk + R2"
```

### 2. GitHub Repository

1. **https://github.com/new** ga o'ting
2. Repository name: `imtihonchi-platform`
3. **Create repository**

### 3. Push

```bash
git remote add origin https://github.com/USERNAME/imtihonchi-platform.git
git branch -M main
git push -u origin main
```

✅ **GitHub'ga yuklandi!**

---

## Part 4: Railway Deployment

### 1. New Project

1. **https://railway.app** ga kiring
2. **New Project** → **Deploy from GitHub repo**
3. Repository tanlang: `imtihonchi-platform`

### 2. PostgreSQL Database

1. **New** → **Database** → **PostgreSQL**
2. Database avtomatik yaratiladi
3. `DATABASE_URL` avtomatik qo'shiladi

### 3. Environment Variables

Railway dashboard'da **Variables** tab:

```bash
# Node Environment
NODE_ENV=production

# Database (avtomatik qo'shiladi)
# DATABASE_URL=postgresql://...

# Clerk Auth
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Cloudflare R2
R2_ENDPOINT=https://xxxxxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=yyyyyyyyyyyy
R2_BUCKET_NAME=imtihonchi-files
R2_PUBLIC_URL=https://files.your-domain.com (optional)

# Session Secret (Random 32+ character string)
SESSION_SECRET=super-secret-key-min-32-characters-here-change-this

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_test_... # yoki sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_test_... # yoki pk_live_...
```

### 4. Build Settings

**Settings** → **Build**:
- Build Command: `npm install && npm run db:push && npm run build`
- Start Command: `npm run start`

### 5. Deploy!

Railway avtomatik deploy qiladi. **Deployments** tab'da progress ko'ring.

---

## Part 5: Database Migration

Railway deploy qilgandan keyin:

```bash
# Local database'dan schema export qilish (optional)
npm run db:push

# Railway database'ni initialize qilish
# (Build command'da avtomatik qilinadi)
```

---

## Part 6: Testing

### 1. Railway URL

Deploy tugagach, Railway sizga URL beradi:
```
https://imtihonchi-platform-production.up.railway.app
```

### 2. Birinchi Login

1. URL'ni oching
2. **Sign Up** / **Sign In** (Clerk)
3. Clerk dashboard'da sizga **admin** role bering
4. Refresh qiling
5. Admin panel ko'rinadi!

### 3. File Upload Test

1. O'qituvchi sifatida test yarating
2. Rasm yuklang (Cloudflare R2'ga yuklanadi)
3. Talaba sifatida test topshiring
4. Audio yozuv (R2'ga saqlanadi)
5. ✅ Hammasi ishlaydi!

---

## 🎯 Checklist

**Clerk:**
- [ ] Clerk account yaratildi
- [ ] Application yaratildi
- [ ] API keys olindi
- [ ] Role metadata sozlandi
- [ ] Birinchi admin yaratildi

**Cloudflare R2:**
- [ ] R2 bucket yaratildi
- [ ] API token yaratildi
- [ ] Credentials yozib qo'yildi
- [ ] (Optional) Custom domain sozlandi

**GitHub:**
- [ ] Repository yaratildi
- [ ] Kod push qilindi

**Railway:**
- [ ] Project yaratildi
- [ ] PostgreSQL qo'shildi
- [ ] Barcha env vars qo'shildi
- [ ] Build settings to'g'ri
- [ ] Deploy muvaffaqiyatli

**Testing:**
- [ ] App ochildi
- [ ] Login ishladi
- [ ] Admin panel ko'rinadi
- [ ] File upload ishladi
- [ ] Audio yozuv ishladi

---

## 💰 Narxlar (Oylik)

**Clerk:**
- Free plan: 10,000 users gacha
- Pro plan: $25/month (ko'proq features)

**Cloudflare R2:**
- Storage: $0.015/GB (~$0.20-0.50/month taxminan)
- Egress: $0 (BEPUL!)

**Railway:**
- Starter: ~$5-10/month (database bilan)
- Pro: $20/month + usage

**Jami: ~$5-15/month** (Starter plan bilan)

---

## 🆘 Muammolar

### Deploy Failed
```bash
# Railway logs'ni tekshiring
# Deployments → View Logs
```

### Clerk Auth Not Working
- `CLERK_PUBLISHABLE_KEY` to'g'ri ekanligini tekshiring
- `CLERK_SECRET_KEY` to'g'ri ekanligini tekshiring
- Railway domain Clerk'da allowed list'da borligini tekshiring

### R2 Upload 403
- API token permissions'ni tekshiring
- Bucket name to'g'ri ekanligini tekshiring
- Endpoint URL to'g'ri ekanligini tekshiring

### Database Connection Error
- `DATABASE_URL` environment variable borligini tekshiring
- PostgreSQL service ishlab turganligini tekshiring

---

## 📚 Keyingi Qadamlar

1. **Custom Domain** - Railway'ga custom domain qo'shish
2. **SSL Certificate** - Railway avtomatik beradi
3. **Monitoring** - Railway metrics'ni kuzatish
4. **Backups** - Database backups sozlash
5. **Production Stripe Keys** - Test keys'dan production'ga o'tish

---

**Omad! Railway deployment muvaffaqiyatli bo'lsin! 🚀**

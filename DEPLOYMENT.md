# 🚀 Railway Deployment Qo'llanmasi

## Bosqichma-bosqich yo'riqnoma

### 1️⃣ GitHub'ga Push Qilish

```bash
# Git repository yaratish (agar yo'q bo'lsa)
git init

# Barcha o'zgarishlarni qo'shish
git add .

# Commit qilish
git commit -m "Initial commit - Imtihonchi CEFR Platform"

# GitHub'da yangi repository yarating (https://github.com/new)
# Keyin:
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### 2️⃣ Railway'da Project Yaratish

1. **Railway.app** ga kiring (https://railway.app)
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Repository'ni tanlang
4. Project nomi: `imtihonchi-platform`

---

### 3️⃣ PostgreSQL Database Qo'shish

1. Railway dashboard'da **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Database avtomatik yaratiladi
3. `DATABASE_URL` avtomatik environment variable'ga qo'shiladi

---

### 4️⃣ Environment Variables O'rnatish

Railway dashboard'da **Variables** bo'limiga quyidagilarni qo'shing:

```bash
# Database (avtomatik qo'shiladi)
DATABASE_URL=postgresql://...

# Session Secret (random string)
SESSION_SECRET=your-super-secret-key-min-32-characters-long

# OpenAI API Key (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Stripe Keys (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... yoki sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_test_... yoki pk_live_...

# Replit Auth (OIDC) - Railway uchun
# Option 1: O'z auth sistemaingizni qo'shing (Clerk, Auth0, etc)
# Option 2: Replit Auth'ni saqlab qolish (faqat development)
ISSUER_URL=https://replit.com
CLIENT_ID=your-replit-client-id
CLIENT_SECRET=your-replit-client-secret
REDIRECT_URI=https://your-domain.railway.app/api/auth/callback

# Object Storage - S3 yoki Cloudflare R2
# Railway'da Replit Object Storage ishlamaydi!
AWS_ACCESS_KEY_ID=your-s3-access-key
AWS_SECRET_ACCESS_KEY=your-s3-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=imtihonchi-files

# Public paths
PUBLIC_OBJECT_SEARCH_PATHS=public
PRIVATE_OBJECT_DIR=private

# Production mode
NODE_ENV=production
```

---

### 5️⃣ Build Settings

Railway avtomatik detect qiladi, lekin tekshiring:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

**Port:** Railway avtomatik PORT environment variable beradi

---

### 6️⃣ Object Storage Migration (Replit → S3/R2)

**Muammo:** Replit Object Storage Railway'da ishlamaydi!

**Yechim:** S3 yoki Cloudflare R2'ga o'tish kerak.

#### Option 1: AWS S3

1. AWS console'da S3 bucket yarating
2. IAM user yarating (programmatic access)
3. Bucket policy qo'shing (public read for 'public/' folder)
4. Environment variables qo'shing

#### Option 2: Cloudflare R2 (Arzonroq!)

1. Cloudflare dashboard'da R2 bucket yarating
2. API token yarating
3. Environment variables qo'shing

**Code o'zgarishlar kerak:**
- `server/routes.ts`: `@replit/object-storage` o'rniga AWS SDK
- Upload endpoints: S3'ga yuklash

---

### 7️⃣ Database Migration

```bash
# Local'da migration yaratish
npm run db:push

# Railway'da avtomatik migration uchun:
# Build command'ga qo'shing:
npm install && npm run db:push && npm run build
```

**Yoki:**

Railway dashboard'da manual SQL run qilish mumkin.

---

### 8️⃣ Replit Auth → Alternative Auth

**Muammo:** Replit Auth faqat Replit'da ishlaydi!

**Yechimlar:**

#### Option 1: Clerk (Tavsiya)
```bash
npm install @clerk/clerk-sdk-node @clerk/clerk-react
```

#### Option 2: Auth0
```bash
npm install @auth0/auth0-react
```

#### Option 3: NextAuth.js
```bash
npm install next-auth
```

**Code o'zgarishlar:**
- `server/auth.ts`: Clerk/Auth0 integration
- `client/src/hooks/useAuth.tsx`: Clerk/Auth0 hooks

---

### 9️⃣ Domain Settings (Optional)

1. Railway dashboard'da **Settings** → **Domains**
2. Custom domain qo'shing
3. DNS CNAME record yarating:
   ```
   CNAME: your-domain.com → your-app.railway.app
   ```

---

### 🔟 Deploy!

Railway avtomatik deploy qiladi har push'da.

**Manual deploy:**
Railway dashboard'da **"Deploy"** tugmasini bosing.

---

## ⚠️ Muhim O'zgarishlar Kerak!

### 1. Object Storage Code
```typescript
// OLD (Replit)
import { Client } from '@replit/object-storage';

// NEW (S3)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
```

### 2. Auth Code
```typescript
// OLD (Replit OIDC)
import { Strategy as OpenIDStrategy } from 'passport-openid';

// NEW (Clerk/Auth0)
import { ClerkProvider } from '@clerk/clerk-react';
```

### 3. Environment Detection
```typescript
// Check if running on Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
```

---

## 📊 Taxminiy Narxlar (Railway)

**Starter Plan (Hobby):**
- $5/month base
- PostgreSQL: $5-10/month
- Bandwidth: $0.10/GB
- **Jami:** ~$10-20/month (traffic bo'yicha)

**Pro Plan:**
- $20/month per seat
- Unlimited projects
- Priority support

---

## 🆘 Muammolar va Yechimlar

### Deploy Failed
- Logs tekshiring: Railway dashboard → **Deployments** → **Logs**
- Build command to'g'ri ekanligini tekshiring

### Database Connection Error
- `DATABASE_URL` to'g'ri o'rnatilganligini tekshiring
- Railway PostgreSQL ishlab turganligini tekshiring

### Environment Variables Missing
- Barcha kerakli variables qo'shilganligini tekshiring
- Typo yo'qligini tekshiring

### Object Storage 403/404
- S3 bucket policy to'g'ri ekanligini tekshiring
- AWS credentials to'g'ri ekanligini tekshiring

---

## ✅ Checklist

- [ ] GitHub repository yaratildi
- [ ] Railway project yaratildi
- [ ] PostgreSQL database qo'shildi
- [ ] Barcha environment variables o'rnatildi
- [ ] Object Storage (S3/R2) sozlandi
- [ ] Auth sistema tanlandi (Clerk/Auth0)
- [ ] Build va start commands to'g'ri
- [ ] Database migration qilindi
- [ ] Deploy muvaffaqiyatli
- [ ] App ochildi va ishlayapti!

---

**Omad! Railway deployment muvaffaqiyatli bo'lsin! 🚀**

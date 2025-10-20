# Dizayn Ko'rsatmalari: Imtihonchi Test Platformasi

## Dizayn Yondashuvi

**Tanlangan Yondashuv**: Material Design System  
**Sabab**: Ta'lim platformalari uchun aniq, professional va funksional dizayn talab etiladi. Material Design ma'lumotlarni ko'rsatish, formalar va murakkab interfeyslarda ajoyib ishlaydi.

**Asosiy Tamoyillar**:
- Aniqlik va tushunarlik - foydalanuvchilar vazifalarni tez bajarishi kerak
- Professional ko'rinish - ishonch va kredibillik yaratish
- Izchillik - barcha panellarda bir xil dizayn tili
- Foydalanish qulayligi - intuitiv navigatsiya va aniq vizual ierarxiya

## Rang Pallitasi

**Asosiy Ranglar (Qorong'i Rejim)**:
- **Birlamchi rang**: 220 85% 60% (Professional ko'k - ishonch va bilimni bildiradi)
- **Ikkilamchi rang**: 200 70% 50% (Ochiq ko'k - interaktiv elementlar uchun)
- **Fon ranglari**: 
  - Asosiy fon: 220 15% 12%
  - Karta/panel foni: 220 15% 16%
  - Hover holati: 220 15% 20%
- **Matn ranglari**:
  - Asosiy matn: 0 0% 95%
  - Ikkilamchi matn: 0 0% 70%
  - Zaif matn: 0 0% 50%
- **Holat ranglari**:
  - Muvaffaqiyat: 142 70% 45% (yashil)
  - Ogohlantirish: 45 90% 55% (sariq)
  - Xato: 0 70% 55% (qizil)
  - Ma'lumot: 200 85% 60% (ko'k)

**Ochiq Rejim** (ixtiyoriy kelajakda):
- Birlamchi: 220 90% 50%
- Fon: 0 0% 98%
- Matn: 220 15% 20%

## Tipografiya

**Shrift Oilalari**:
- Sarlavhalar: **Inter** (600, 700 og'irligi) - zamonaviy, professional
- Asosiy matn: **Inter** (400, 500 og'irligi) - o'qish uchun qulay
- Monospace (kod/timerlar): **JetBrains Mono** - aniq, raqamlar uchun

**Matn O'lchamlari**:
- H1 (Sahifa sarlavhasi): text-4xl md:text-5xl (36-48px), font-bold
- H2 (Bo'lim sarlavhasi): text-2xl md:text-3xl (24-30px), font-semibold
- H3 (Karta sarlavhasi): text-xl (20px), font-semibold
- Asosiy matn: text-base (16px), font-normal
- Kichik matn: text-sm (14px)
- Timer/Raqamlar: text-3xl md:text-5xl, font-bold, monospace

## Layout Tizimi

**Tailwind Spacing Birliklari**: Platformada **4, 6, 8, 12, 16** birliklaridan foydalaniladi
- Kichik bo'shliq: p-4, gap-4, m-4
- O'rta bo'shliq: p-6, gap-6, m-6
- Katta bo'shliq: p-8, gap-8
- Juda katta: p-12, p-16

**Grid Tizimi**:
- Mobil: Bitta ustun (grid-cols-1)
- Planshet: 2 ustun (md:grid-cols-2)
- Desktop: 3 ustun kattaroq ekranlar uchun (lg:grid-cols-3)

**Container O'lchamlari**:
- To'liq kenglik: max-w-7xl (1280px)
- Formalar: max-w-2xl (672px)
- Matn kontenti: max-w-4xl (896px)

## Komponent Kutubxonasi

### 1. Navigatsiya Komponentlari

**Bosh Navbar**:
- Balandlik: h-16
- Sticky pozitsiya: sticky top-0 z-50
- Logo chap tomonda, navigatsiya markazda, profil o'ng tomonda
- Fon: bg-[220_15%_16%] backdrop-blur-lg
- Border pastda: border-b border-white/10

**Sidebar (Admin/O'qituvchi panellari)**:
- Kenglik: w-64, mobilda yashirin
- To'liq balandlik: h-screen
- Menyu elementlari: p-3, rounded-lg, hover:bg-white/10
- Faol holat: bg-primary/20, border-l-4 border-primary
- Ikonkalar: Heroicons (outline va solid)

**Tab Navigatsiyasi** (Test bo'limlari uchun):
- Gorizontal tabs: flex gap-2
- Har bir tab: px-6 py-3, rounded-t-lg
- Faol tab: bg-primary text-white
- Nofaol tab: bg-white/5 text-white/70

### 2. Formalar va Kiritish

**Input Maydonlari**:
- Balandlik: h-12
- Padding: px-4
- Border: border border-white/20
- Focus holati: ring-2 ring-primary/50, border-primary
- Fon: bg-white/5
- Placeholder: placeholder:text-white/40
- Uzbekcha label ustida: text-sm font-medium mb-2

**Textarea** (Savollar uchun):
- Min balandlik: min-h-32
- Xuddi input kabi styling
- Resize: resize-none yoki resize-y

**Select/Dropdown**:
- Input bilan bir xil stil
- Chevron ikoni o'ng tomonda
- Variantlar hover: bg-white/10

**Audio Yozuv Interfeysi**:
- Katta dumaloq tugma: w-20 h-20, rounded-full
- Yozish holati: bg-red-500, pulse animatsiya
- Kutish holati: bg-white/10
- Waveform visualizer: h-12, barlar bilan
- Timer ko'rsatgichi: text-3xl, monospace, markazda

### 3. Ma'lumotlarni Ko'rsatish

**Kartalar**:
- Fon: bg-[220_15%_16%]
- Border: border border-white/10
- Radius: rounded-xl
- Padding: p-6
- Shadow: shadow-lg
- Hover: hover:border-white/20, transition-all

**Test Kartasi** (O'quvchi uchun):
- Rasm yuqorida: aspect-video, rounded-t-xl
- Mazmun: p-6
- Narx: text-2xl font-bold text-primary
- "Sotib olish" tugma pastda: w-full

**Natijalar Jadvali**:
- Sarlavha: bg-white/5, font-semibold
- Qatorlar: border-b border-white/10
- Hover: hover:bg-white/5
- Padding: px-6 py-4

**Dashboard Statistika Kartalari**:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Ikon: w-12 h-12, rounded-full, bg-primary/20
- Raqam: text-3xl font-bold
- Label: text-sm text-white/70

### 4. Tugmalar

**Asosiy Tugma**:
- Primary: bg-primary hover:bg-primary/90
- Padding: px-6 py-3
- Radius: rounded-lg
- Font: font-medium
- Transition: transition-all duration-200
- Shadow: shadow-md hover:shadow-lg

**Ikkilamchi Tugma**:
- Variant: border border-white/20 bg-transparent
- Hover: bg-white/10

**Xavfli Tugma** (O'chirish):
- bg-red-500 hover:bg-red-600

**Ikon Tugma**:
- w-10 h-10, rounded-lg
- bg-white/5 hover:bg-white/10

### 5. Modal va Overleylar

**Modal**:
- Fon overlay: bg-black/50 backdrop-blur-sm
- Kontent: bg-[220_15%_16%], max-w-2xl
- Padding: p-8
- Border: border border-white/10
- Animation: scale va fade-in

**Dropdown Menu**:
- bg-[220_15%_18%]
- Shadow: shadow-2xl
- Border: border border-white/10
- Elementlar: px-4 py-2, hover:bg-white/10

### 6. Timer va Progress Komponentlari

**Countdown Timer**:
- Juda katta: text-5xl md:text-6xl
- Monospace: font-mono font-bold
- Rang: oxirgi 10 soniyada qizil rangga o'tish
- Markazlashtirilgan, aniq ko'rinish

**Progress Bar**:
- Balandlik: h-2
- Fon: bg-white/10
- To'ldirilgan qism: bg-primary
- Radius: rounded-full
- Smooth transition

**Bo'lim Indikatori**:
- Doiralar: w-10 h-10
- Tugallangan: bg-green-500
- Faol: bg-primary, ring-4 ring-primary/30
- Kutilayotgan: bg-white/10
- Chiziq: border-t-2 border-white/20

## Rasmlar

**Hero Rasm**: Yo'q - bu utility platforma, dashboardga yo'naltirilgan

**Test Kartalari Rasmlari**:
- Har bir test uchun 16:9 aspect ratio banner rasm
- Test mavzusini aks ettiruvchi vizual (speaking, CEFR, ta'lim)
- Placeholder: gradient background bilan ikon

**Bo'lim 1.2 Rasm** (Test ichida):
- Katta ko'rinish: max-w-3xl
- Border va shadow: rounded-lg shadow-xl
- CEFR og'zaki testiga mos rasmlar (odamlar, joylar, holatlar)

## Animatsiya

**Minimal Animatsiya** - Faqat zarur joylar:
- Timer countdown: Smooth raqam o'zgarishi
- Audio recording: Pulse effekt yozish vaqtida
- Tugma hover: Rang va shadow o'zgarishi (200ms)
- Modal ochilishi: Fade va scale (300ms)
- Page transition: Fade (150ms)

**Animatsiya ishlatilmaydigan joylar**:
- Scroll effektlar
- Parallax
- Murakkab hover effektlar

## Accessibility

- Barcha formalar label bilan
- Focus holatlari aniq ko'rinadi (ring-2 ring-primary)
- Kontrast nisbati WCAG AA standartiga mos
- Keyboard navigatsiyasi barcha elementlarda
- Screen reader uchun aria-labels
- Qorong'i rejim default - barcha inputlar consistent

**Muhim**: Platforma o'zbekcha tilida bo'ladi, barcha matnlar va xabarlar o'zbek tilida yozilishi kerak.
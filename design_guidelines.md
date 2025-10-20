# Imtihonchi: CEFR Og'zaki Baholash Platformasi - Dizayn Ko'rsatmalari

## Dizayn Yondashuvi

**Tanlangan Sistema**: Material Design System
**Sabab**: Ta'lim platformalari uchun aniq, professional va funksional dizayn. Material Design ma'lumotlarni ko'rsatish, murakkab formalar va dashboard interfeyslarda mukammal ishlaydi.

**Dizayn Tamoyillari**:
- **Aniqlik**: Har bir element o'z vazifasini tez va tushunarli bajaradi
- **Professional ko'rinish**: Kredibillik va ishonch yaratuvchi vizual til
- **Izchillik**: Talaba, o'qituvchi va admin panellarida yagona dizayn tili
- **Accessibility**: Qorong'i va och rejimlarda mukammal o'qilishi

## Rang Pallitasi

### Qorong'i Rejim (Dark Mode - Default)
- **Birlamchi rang**: 210 80% 55% (To'q havo ko'k - professional va ishonchli)
- **Birlamchi hover**: 210 80% 65%
- **Ikkilamchi rang**: 200 60% 50% (Interaktiv elementlar)
- **Fon ranglari**:
  - Asosiy fon: 215 20% 11%
  - Karta/panel: 215 18% 15%
  - Hover holat: 215 18% 19%
  - Input fon: 215 15% 13%
- **Matn**:
  - Asosiy: 0 0% 98%
  - Ikkilamchi: 0 0% 75%
  - Zaif: 0 0% 55%
- **Chegaralar**: 0 0% 100% (10% opacity)

### Och Rejim (Light Mode)
- **Birlamchi rang**: 210 85% 45%
- **Birlamchi hover**: 210 85% 40%
- **Fon ranglari**:
  - Asosiy: 0 0% 99%
  - Karta/panel: 0 0% 100%
  - Hover: 210 20% 96%
  - Input fon: 0 0% 98%
- **Matn**:
  - Asosiy: 215 25% 15%
  - Ikkilamchi: 215 15% 40%
  - Zaif: 0 0% 55%
- **Chegaralar**: 215 15% 20% (15% opacity)

### Holat Ranglari (Ikkala rejim uchun)
- **Muvaffaqiyat**: 142 65% 45% (dark) / 142 70% 40% (light)
- **Ogohlantirish**: 45 85% 50% (dark) / 45 90% 45% (light)
- **Xato**: 0 65% 55% (dark) / 0 70% 50% (light)
- **Ma'lumot**: 200 80% 60% (dark) / 200 85% 50% (light)

## Tipografiya

**Shriftlar** (Google Fonts CDN orqali):
- **Inter**: Barcha interfeys matnlari uchun (weights: 400, 500, 600, 700)
- **JetBrains Mono**: Timerlar, kod va raqamlar uchun (weights: 400, 700)

**Matn Ierarxiyasi**:
- **H1** (Sahifa sarlavha): text-4xl lg:text-5xl, font-bold, tracking-tight
- **H2** (Bo'lim sarlavha): text-2xl lg:text-3xl, font-semibold
- **H3** (Karta sarlavha): text-xl, font-semibold
- **Body**: text-base (16px), font-normal, leading-relaxed
- **Small**: text-sm (14px)
- **Caption**: text-xs (12px)
- **Timer/Raqamlar**: text-4xl lg:text-6xl, font-mono font-bold

## Layout Tizimi

**Spacing Birliklari**: 4, 6, 8, 12, 16, 20, 24
- Minimal: p-4, gap-4
- Standart: p-6, gap-6
- Kengaytirilgan: p-8, gap-8
- Katta: p-12 yoki p-16
- Bo'lim padding: py-20 lg:py-24

**Container Kengliklar**:
- Dashboard/asosiy: max-w-7xl (1280px)
- Formalar/modals: max-w-2xl (672px)
- Test sahifalari: max-w-4xl (896px)
- Matn kontenti: max-w-prose

**Grid Tizimi**:
- Mobil: grid-cols-1
- Planshet: md:grid-cols-2
- Desktop: lg:grid-cols-3 yoki lg:grid-cols-4 (statistika uchun)

## Komponent Kutubxonasi

### Navigatsiya

**Bosh Navbar**:
- Sticky top navbar: h-16, backdrop-blur-lg
- Logo chap (h-8), navigatsiya linklar markaz, profil/menu o'ng
- Border pastda (1px, opacity 0.1)
- Mobile: hamburger menu, full-height drawer

**Sidebar** (Admin/O'qituvchi):
- w-64, fixed left, full-height
- Logo tepada, menyu elementlari p-3 rounded-lg
- Faol: border-l-4 border-primary, birlamchi fon rangi bilan
- Ikonlar: Heroicons (24px)

**Breadcrumbs** (Test navigatsiya):
- flex gap-2, text-sm
- Separator: "/" yoki chevron
- Faol sahifa: font-medium birlamchi rangda

### Kartalar

**Standart Karta**:
- rounded-xl, border (1px, opacity 0.1)
- p-6, shadow-sm hover:shadow-md
- Transition: 200ms

**Test Kartasi** (Talabalar uchun):
- Banner rasm tepada: aspect-video, rounded-t-xl, object-cover
- Mazmun: p-6
- Sarlavha: text-xl font-semibold mb-2
- Tavsif: text-sm zaif matn mb-4
- Metainfo: flex gap-4 (davomiyligi, savollar soni)
- Narx: text-2xl font-bold birlamchi rang
- CTA tugma pastda: w-full

**Statistika Kartasi** (Dashboard):
- Ikon yuqorida: w-12 h-12 rounded-full birlamchi fon (20% opacity)
- Raqam: text-3xl font-bold
- Label: text-sm zaif matn
- Trend indikatori: o'sish/kamayish strelka bilan

### Formalar

**Input Maydonlari**:
- h-12, px-4, rounded-lg
- Border: 1px, focus: ring-2 ring-primary (50% opacity)
- Label: text-sm font-medium mb-2
- Error holat: border-red-500, text-red-500
- Disabled: opacity-50, cursor-not-allowed

**Textarea**:
- min-h-32, resize-y
- Input styling bilan bir xil

**Select/Dropdown**:
- Native select yoki custom dropdown
- Chevron ikoni o'ngda
- Hover: background change

**Audio Recording Interface**:
- Katta dumaloq tugma: w-24 h-24 rounded-full
- Recording: bg-red-500, pulse animatsiya
- Waveform: h-16, dynamic bars
- Timer: text-4xl font-mono text-center

### Tugmalar

**Primary**:
- bg-primary hover:bg-primary-hover
- px-6 py-3 rounded-lg font-medium
- shadow-sm hover:shadow transition-all 200ms

**Secondary**:
- border (1px) bg-transparent hover:bg-hover
- px-6 py-3 rounded-lg

**Danger** (O'chirish):
- bg-red-500 hover:bg-red-600
- Matn oq

**Icon Button**:
- w-10 h-10 rounded-lg
- Hover: background o'zgarishi

**Button on Images** (Hero):
- backdrop-blur-md bg-white/10
- border border-white/20
- Hover holatlari o'z-o'zidan ishlaydi

### Jadvallar

**Responsive Table**:
- Sarlavha: font-semibold, background slight
- Qatorlar: border-b (opacity 0.1)
- Padding: px-6 py-4
- Hover: background change
- Mobil: Stack yoki gorizontal scroll

### Modal/Dialog

**Modal Overlay**:
- bg-black/60 backdrop-blur-sm
- Centered content: max-w-2xl
- Kontent: rounded-xl p-8 border shadow-2xl
- Yopish: X tugma o'ng-tepada
- Animation: fade va scale 300ms

### Timer va Progress

**Countdown Timer**:
- text-5xl lg:text-6xl font-mono font-bold
- Oxirgi 60 soniya: sariq rang
- Oxirgi 10 soniya: qizil rang, pulse
- Markazlashtirilgan

**Progress Bar**:
- h-2 rounded-full
- Background: zaif fon
- Fill: birlamchi rang
- Smooth transition

**Bo'lim Navigatsiya** (Test ichida):
- Gorizontal dots/circles: w-10 h-10
- Tugallangan: green-500 tick belgisi bilan
- Faol: birlamchi rang, ring-4
- Keyingi: zaif fon

## Rasmlar

**Hero Rasm**: Yo'q - bu utility/dashboard platforma

**Test Banner Rasmlari**:
- Har bir test kartasida 16:9 banner
- Professional ta'lim muhiti rasmlari (sinf, talabalar, interviewer)
- Alt text har doim mavjud

**Test Ichidagi Rasmlar** (Bo'lim 1.2):
- CEFR og'zaki testga mos situatsion rasmlar
- max-w-3xl, rounded-lg shadow-lg
- Responsive: scale down mobilda

## Animatsiya

**Minimal va Maqsadli**:
- Timer: smooth raqam transition
- Audio recording: pulse effect (2s cycle)
- Button/Card hover: 200ms ease
- Modal: fade va scale 300ms
- Page transition: fade 150ms
- Progress bar: smooth width change

**Foydalanilmaydigan**:
- Scroll animatsiyalar
- Parallax
- Complex hover effects
- Auto-playing carousels

## Accessibility

- WCAG AA kontrast nisbatlari (4.5:1 matn uchun)
- Focus holatlar: ring-2 ring-primary aniq ko'rinadi
- Keyboard navigation barcha interaktiv elementlarda
- Aria labels va roles to'g'ri foydalanilgan
- Screen reader uchun optimizatsiya
- Dark va light mode toggle oson topiladi
- Barcha matnlar va xabarlar o'zbek tilida

## Rol-ga Asoslangan Farqlar

**Talaba Interface**: Sodda navigatsiya, katta CTA tugmalar, aniq ko'rsatmalar, minimal distraktsiya

**O'qituvchi Panel**: Ko'proq vositalar, filtrlar, export imkoniyatlari, detallashtirilgan jadvallar

**Admin Dashboard**: To'liq boshqaruv interfeysi, murakkab ma'lumotlar vizualizatsiyasi, tizim sozlamalari

Barcha rollar bir xil dizayn tilidan foydalanadi, lekin murakkablik darajasi farq qiladi.
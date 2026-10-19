# نظام تقييم جودة الأقسام — الواجهة الأمامية

فرونت إند جاهز للنشر على **Vercel**، متصل بـ **Supabase** (الباك اند + المصادقة + RLS).

بُني بـ Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + `@supabase/ssr`.
الواجهة **عربي RTL بالكامل** وبتعمل على الموبايل والديسكتوب.

---

## 1. المتطلبات

- Node.js 20 أو أحدث
- مشروع Supabase يكون عليه **السكيما متطبّقة** (من ملفات `01_schema.sql` / `03_migrate.sql`)
- حساب Vercel (مجاني كافي)

---

## 2. تشغيل محلي

```bash
npm install
cp .env.example .env.local     # وحطّ بيانات مشروعك
npm run dev                    # http://localhost:3000
```

### متغيرات البيئة

| المتغير | منين تجيبه | ملاحظات |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | مثل `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public key | **safe تتعرض للمتصفح** — الحماية كلها من الـ RLS |

> مفيش أي secret في السيرفر. الـ anon key آمن لأنه الـ RLS في القاعدة هو اللي بيمنع الوصول.
> `service_role` key **متتحطش** في الواجهة أبداً.
>
> ✅ `.env.local` في المشروع ده **متظبّط على مشروعك بالفعل**:
> `https://wuesmodyepbuqgjaujfc.supabase.co` + الـ publishable key بتاعك.
> (الـ publishable key آمن للتعرض — هو البديل الجديد للـ anon key.)
> لو هتنشر الـ repo على GitHub، `.env.local` مش هينفع يتعمل commit (في `.gitignore`)،
> بس اعمل `vercel env add` للنسخ. لو عايز تشيله من أي نسخة بتوزّعها: `rm .env.local`.

---

## 3. النشر على Vercel

### الطريقة الأولى — من GitHub (الأسهل)
1. ارفع المجلد على GitHub (repo جديد).
2. من Vercel → **Add New → Project** → اختار الـ repo.
3. Vercel هيكتشف Next.js لوحده. تأكد:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (تلقائي)
4. **Settings → Environment Variables** → ضيف الـ vars بالاسم (بالتسميتين: Production + Preview).
5. **Deploy**.

### الطريقة التانية — من الـ CLI
```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

> **مهم:** بعد إضافة env vars اعمل **Redeploy** (مش بس restart) عشان تتقرأ.

### Domain
`Settings → Domains` → ضيف الدومين بتاعك (من الدومين، SSL بيتعمل تلقائي).

---

## 4. الصفحات

| الصفحة | المسار | الوصف |
|---|---|---|
| تسجيل الدخول | `/login` | دخول + حساب جديد (بيبدأ بدور «مشاهد») |
| لوحة التحكم | `/` | إحصائيات + آخر التقييمات + آخر النشاطات |
| الأقسام | `/departments` | إضافة/تعديل/حذف الأقسام + ربط المعايير بكل قسم |
| المعايير | `/criteria` | إضافة/تعديل/حذف المعايير + فلترة بالتصنيف |
| التقييمات | `/assessments` | قائمة + إنشاء تقييم جديد |
| تفاصيل التقييم | `/assessments/[id]` | تسجيل النتائج (ملتزم/جزئي/غير ملتزم/N/A) + الدرجة |
| المستخدمون | `/users` | إدارة الحسابات والأدوار والأقسام (للمشرفين) |
| سجل التدقيق | `/audit` | كل عملية تعديل مع الفرق قبل/بعد (للمشرفين) |

---

## 5. كيف الصلاحيات شغالة؟

مفيش permission logic متكرر في الواجهة — **القرار النهائي في Supabase**:

1. الواجهة بتجيب `profiles.role` بتاع اليوزر وبتخفي الأزرار غير المسموحة (UX).
2. كل عملية كتابة بتبقى **Server Action** بتمشي بـ `supabase.rpc()` أو `insert/update/delete` وبsession اليوزر.
3. Supabase بيمرّر الطلب على الـ **RLS** اللي بنيناه في السكيما. لو الدور مش مخوّل → الطلب مرفوض regardless أي كلام في الواجهة.
4. الأخطاء بتترجم لرسائل عربية واضحة (عبر `friendlyError` في `app/actions.ts`).

**يعني:** لو حد عدّل من الـ DevTools أو من PostgREST مباشرة، القاعدة هترفضه.

---

## 6. بنية المشروع

```
app/
├── layout.tsx              # RTL + خط Cairo + globals
├── login/page.tsx          # صفحة الدخول
├── actions.ts              # كل الـ Server Actions (مصادقة + CRUD)
├── (app)/                  # المنطقة المحمية (middleware بيحرسها)
│   ├── layout.tsx          # الشريط الجانبي + حماية اليوزر
│   ├── page.tsx            # لوحة التحكم
│   ├── departments/  criteria/  assessments/  users/  audit/
├── globals.css             # Tailwind 4 + ألوان النظام
components/
├── ui.tsx                  # Button, Card, Modal, Toast, Toggle, Badge...
├── AppNav.tsx              # الشريط الجانبي
├── DepartmentsManager.tsx  # CRUD الأقسام + ربط المعايير
├── CriteriaManager.tsx     # CRUD المعايير
├── AssessmentsList.tsx     # قائمة + إنشاء تقييم
├── AssessmentEditor.tsx    # تسجيل النتائج والدرجات
├── UsersManager.tsx        # إدارة المستخدمين
└── AuditLogTable.tsx       # سجل التدقيق
lib/
├── supabase/{client,server,middleware}.ts   # عملاء Supabase
├── database.types.ts       # أنواع قاعدة البيانات (typed)
└── types.ts                # الأنواع المشتركة
middleware.ts               # تجديد الجلسة + حماية المسارات
```

---

## 7. ملاحظات مهمة

- **الخط:** Cairo عبر `next/font/google` — بيتحمّل وقت الـ build، فمفيش طلبات خارجية من المتصفح.
- **الجلسة:** بتتخزّن في cookies (مش localStorage) عشان الـ Server Components يشتغلوا بنفس الجلسة.
- **الـ middleware:** بيحدّث الجلسة في كل request وبيحوّل أي زائر لصفحة الدخول. لو الـ env vars ناقصة أو في مشكلة شبكة، هيحوّل لصفحة الدخول بدل ما يطير.
- **الملف `.env.local`** مش بيتنشر — لا تحطّ أي secrets في كود الـ frontend.
- لو غيّرت اسم أي جدول أو عمود في Supabase، حدّث `lib/database.types.ts` معاه (الأنواع complete بالـ TypeScript).

---

## 8. أوامر مفيدة

```bash
npm run dev         # تطوير
npm run build       # بناء production + فحص الأنواع
npm run start       # تشغيل نسخة الـ production محلي
npm run typecheck   # فحص الأنواع بس
npm run lint        # lint
```

---

## 9. ملاحظات خاصة بمشروعك (اتأكدت منها بالفحص الفعلي)

| الإعداد | الحالة عندك | الأثر |
|---|---|---|
| تأكيد الإيميل (Email confirmations) | **مفعّل** | اليوزرز اللي بتعملها من صفحة المستخدمين **بتدخل فوراً** (السكربت بيفترض `email_confirmed_at`)، بس أي حد يعمل حساب بنفسه لازم يأكّد إيميله الأول |
| حد إرسال الإيميلات | **2-3 إيميل/ساعة** (المستوى المجاني) | متعتمدش على الـ self-signup لفريق كبير — اعمل اليوزرز من صفحة المستخدمين (الأدمن) |
| الـ schema في القاعدة | ✅ **متطبّقة** (الجداول الـ8 موجودة) | — |
| اليوزرز الافتراضية | ❌ **لسه مش موجودة** | شغّل `02_users.sql` (النسخة المصلّحة) في Supabase SQL Editor |

---

## 10. حل المشاكل

| المشكلة | الحل |
|---|---|
| `Supabase env vars ناقصة` | ضيف `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY` في `.env.local` وفي Vercel |
| الدخول مش شغال | اتأكد إن `email_confirmed_at` متظبطة (السكربت بيعملها) وإن الإيميل مكررش |
| `new row violates row-level security policy` | اليوزر مش ليه الدور المطلوب — غيّر الرول من صفحة المستخدمين (مدير النظام) |
| `function gen_salt(unknown) does not exist` | في الباك اند: `pgcrypto` لازم تكون في `extensions` — استخدم `public.hash_password()` بدل `crypt()` |
| الصفحات فاضية | شغّل `99_selftest.sql` في Supabase SQL Editor للتأكد إن القاعدة سليمة |
| التعديلات مش بتظهر | بعد تغيير في القاعدة اعمل Redeploy (أو restart السيرفر) |

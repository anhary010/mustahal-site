# نادي مستهل — صفحة الأعمال

صفحة ثابتة واحدة (`index.html` + `img/`)، بلا خطوة بناء. افتح `index.html` مباشرة أو انشرها على GitHub Pages.

- النشر: كل دفعة إلى `main` تنشر تلقائيًا عبر `.github/workflows/pages.yml` (Settings → Pages → Source: GitHub Actions).
- تعديل المحتوى: البطاقات في `index.html` داخل `<div class="events" id="events">`، وصور كل بطاقة في كائن `G` أسفل الصفحة.
- إضافة صور: ضعها في `img/` بعرض ≤ 1400px، ثم أضف اسمها إلى قائمة البطاقة في `G`.

المعاينة محليًا:
```bash
python3 -m http.server 8080
```

## المنصات الداخلية (نفس الموقع)
- `platform/` منصة الأعضاء: الأفكار والتصويت، التفعيلات والمهام، النقاط، الأعضاء. الرابط: `/mustahal-site/platform/` (و`#admin` للإدارة).
- `attendance/` حضور الطلاب: الفريق يسجّل، والطلاب يرون ترتيب الشهر. الرابط: `/mustahal-site/attendance/`.
- `rsvp/` صفحة تسجيل عامة للطلاب (الاسم وتأكيد الحضور) تكتب في ورقة «تسجيل الحضور» بالجدول نفسه. الفعاليات تُعرّف في `EVENTS` داخل الصفحة وتُفتح بـ `?e=<المفتاح>` (الحالية: `apple`). الرابط: `/mustahal-site/rsvp/?e=apple`
- البيانات في Google Sheet عبر Apps Script (`backend/Code.gs`). خطوات الربط مرة واحدة:
  1. افتح https://script.google.com → مشروع جديد → الصق محتوى `backend/Code.gs` وغيّري `TEAM_PIN` و`ADMIN_PIN`.
  2. شغّل `setup()` مرة (ينشئ جدول «منصة مستهل — البيانات» ويزرع الأعضاء والتفعيلات الحالية).
  3. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → انسخ رابط `/exec`.
  4. ضع الرابط في `js/config.js` ثم ادفع التعديل. الصفحتان تعملان مباشرة.
- **الحالة الآن (25 نوفمبر 2026):** الربط تم. مشروع Apps Script: https://script.google.com/home/projects/11d51bovzyNl9i8vZxEZg8lY5SFwhlRMRJ12QbcuGHBKdZdFFq9Q90tlL/edit (النشر الحالي: منصة مستهل v3) · جدول البيانات: https://docs.google.com/spreadsheets/d/1uuPXWuXl3ALKFHposYfagSAdw7oPqrQSt_NMoL1khig
- لتغيير الرمزين لاحقًا: عدّل `TEAM_PIN` و`ADMIN_PIN` في المحرر ثم Deploy → Manage deployments → ✎ → Version: New version → Deploy (الرابط يبقى نفسه).
- الصلاحيات: رمز الأعضاء للدخول والإضافة والتصويت، ورمز الإدارة (أنهار ومحمد) للاعتماد والتحقق والإغلاق والنشر.

# نادي مستهل — صفحة الأعمال

صفحة ثابتة واحدة (`index.html` + `img/`)، بلا خطوة بناء. افتحي `index.html` مباشرة أو انشريها على GitHub Pages.

- النشر: كل دفعة إلى `main` تنشر تلقائيًا عبر `.github/workflows/pages.yml` (Settings → Pages → Source: GitHub Actions).
- تعديل المحتوى: البطاقات في `index.html` داخل `<div class="events" id="events">`، وصور كل بطاقة في كائن `G` أسفل الصفحة.
- إضافة صور: ضعيها في `img/` بعرض ≤ 1400px، ثم أضيفي اسمها إلى قائمة البطاقة في `G`.

المعاينة محليًا:
```bash
python3 -m http.server 8080
```

## المنصات الداخلية (نفس الموقع)
- `platform/` منصة الأعضاء: الأفكار والتصويت، التفعيلات والمهام، النقاط، الأعضاء. الرابط: `/mustahal-site/platform/` (و`#admin` للإدارة).
- `attendance/` حضور الطلاب: الفريق يسجّل، والطلاب يرون ترتيب الشهر. الرابط: `/mustahal-site/attendance/`.
- البيانات في Google Sheet عبر Apps Script (`backend/Code.gs`). خطوات الربط مرة واحدة:
  1. افتحي https://script.google.com → مشروع جديد → الصقي محتوى `backend/Code.gs` وغيّري `TEAM_PIN` و`ADMIN_PIN`.
  2. شغّلي `setup()` مرة (ينشئ جدول «منصة مستهل — البيانات» ويزرع الأعضاء والتفعيلات الحالية).
  3. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → انسخي رابط `/exec`.
  4. ضعي الرابط في `js/config.js` ثم ادفعي التعديل. الصفحتان تعملان مباشرة.
- الصلاحيات: رمز الأعضاء للدخول والإضافة والتصويت، ورمز الإدارة (أنهار ومحمد) للاعتماد والتحقق والإغلاق والنشر.

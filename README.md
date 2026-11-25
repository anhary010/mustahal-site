# نادي مستهل — صفحة الأعمال

صفحة ثابتة واحدة (`index.html` + `img/`)، بلا خطوة بناء. افتحي `index.html` مباشرة أو انشريها على GitHub Pages.

- النشر: كل دفعة إلى `main` تنشر تلقائيًا عبر `.github/workflows/pages.yml` (Settings → Pages → Source: GitHub Actions).
- تعديل المحتوى: البطاقات في `index.html` داخل `<div class="events" id="events">`، وصور كل بطاقة في كائن `G` أسفل الصفحة.
- إضافة صور: ضعيها في `img/` بعرض ≤ 1400px، ثم أضيفي اسمها إلى قائمة البطاقة في `G`.

المعاينة محليًا:
```bash
python3 -m http.server 8080
```

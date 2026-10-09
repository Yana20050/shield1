# SHIELD — сайт охоронної компанії (десктопна версія)

Статичний сайт: HTML + CSS + JavaScript. Без збірки, без Node, без бази даних.
Адаптивний: на ширині понад 768px показується десктопна версія, на вужчих екранах — мобільна.

## Запуск локально
```
cd shield-site
python3 -m http.server 8935
# відкрити http://localhost:8935/
```
Для продакшну — просто завантажити всю папку на будь-який хостинг (Nginx/Apache/Netlify/GitHub Pages) у корінь домену.
Точка входу: `index.html`.

## Структура
- `index.html` — вся розмітка (секції: hero, послуги, переваги, AJAX, ціни, про SHIELD, партнери, відгуки, FAQ, форма, футер)
- `styles.css` — усі стилі (змінні кольорів і радіусів на початку файлу `:root`)
- `script.js` — акордеони, майстер підбору комплекту AJAX, мобільне меню, форма, автопрокрутка каруселей на мобільній
- `animations.js` — анімації при прокрутці (GSAP + ScrollTrigger)
- `animations.css`, `shiny-button.css/js` — допоміжні ефекти
- `media/` — зображення, відео, логотипи партнерів

## Зовнішні залежності (підключаються з CDN, потрібен інтернет)
- GSAP 3.12.5 + ScrollTrigger (cdnjs.cloudflare.com)
- Шрифти Inter та Space Grotesk (Google Fonts)

## Що потрібно налаштувати / знати
1. **Форма «Залишити заявку»** (`#consultationForm`, `script.js`, блок «Consultation form submit») поки що **нікуди не відправляє дані** — лише показує повідомлення про успіх. Потрібно підключити бекенд, e-mail-сервіс, CRM або Telegram-бота.
2. **Месенджери в шапці** (`index.html`, блок `.header-actions` та `.nav-socials`): актуальні посилання:
   - Telegram: `https://t.me/Shield_Ukraine_007`
   - WhatsApp: `https://wa.me/380980079007`
   - Viber: `viber://chat?number=%2B380980079007`
3. **Магазин**: https://totalshield.com.ua (кнопка в шапці та в блоці AJAX).
4. **Контакти у футері** (телефони, e-mail) — у `index.html`, блок `<footer>`.
5. **Кеш**: до CSS/JS підключено параметр `?v=...` (напр. `styles.css?v=20261002s`). Після змін файлів змінюйте значення, щоб браузери підтягнули нову версію.
6. **Медіа вже оптимізовані:** `media/hero.mp4` 1600px/H.264 (~2.2 МБ, без звуку), `media/ajax.mp4` 960px/H.264 (~50 КБ), зображення стиснуті. Усі медіа сайту разом ≈ 3.5 МБ. Рекомендовано на сервері ввімкнути gzip/brotli і довгий `Cache-Control` для `/media/*`.
7. **Заглушки в футері:** посилання «Політика конфіденційності» та «Умови користування» (`index.html`, блок `.footer-legal`) ведуть на `#` — потрібні справжні сторінки або PDF. Також варто перевірити e-mail у футері: `info@shield-ukraine.com.ua`.
8. Відсутні у проєкті: favicon, `<meta name="description">`, мета-теги для соцмереж (Open Graph), `sitemap.xml`/`robots.txt`, аналітика (GA/Pixel), cookie-банер — додати за потреби.

## Підтримка браузерів
Сучасні Chrome, Safari, Edge, Firefox (використовуються CSS custom properties, `@property`, `mask-image`, `aspect-ratio`).

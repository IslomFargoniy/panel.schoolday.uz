# schoolday.uz — landing sahifa

Statik sahifa (HTML/CSS/JS, build kerak emas). Ilgari alohida `IslomFargoniy/landing.schoolday` reposida edi, 2026-11-03 da tarixi bilan shu papkaga ko'chirildi.

- **Deploy:** repo ildizidagi `./deploy.sh` panel bilan birga shu papkani serverdagi `/var/www/schoolday_uz_usr/data/www/schoolday.uz/` ga `rsync --delete` bilan yoyadi. U papkadagi qo'lda qilingan o'zgarishlar keyingi deployda o'chadi.
- **SEO:** `sitemap.xml` va `robots.txt` shu yerda. Sahifa o'zgarsa `sitemap.xml` dagi `lastmod` ni va `index.html` dagi `style.css?v=` ni yangilang. Title `script.js` dagi `page_title` dan ham o'rnatiladi, ikkalasini bir xil tuting.

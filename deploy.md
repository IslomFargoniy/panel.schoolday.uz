# 🚀 panel.schoolday.uz — Deploy Qo'llanmasi

## Server Ma'lumotlari

| Parametr | Qiymati |
|---|---|
| **Server IP** | `193.180.213.188` |
| **SSH** | `ssh root@193.180.213.188` |
| **Panel** | FastPanel |
| **Web Root** | `/var/www/panel_school_usr/data/www/panel.schoolday.uz` |
| **PHP versiyasi** | 8.3 (`/opt/php83/bin/php`) |
| **Node.js** | Serverda o'rnatilgan |
| **DB nomi** | `panel_school` |
| **DB foydalanuvchi** | `panel_school` |
| **Domen** | `https://panel.schoolday.uz` |

---

## Ishlayotgan Servislar

| Servis | Boshqarish | Tavsif |
|---|---|---|
| `schoolday-worker` | Supervisor | Laravel Queue worker (2 ta process) |
| `schoolday-reverb` | Supervisor | Laravel Reverb WebSocket server (port 8086) |
| `hikvision-isup-schoolday` | Systemd | Hikvision ISUP 5.0 Gateway (CMS: 7670, API: 7671, Alarm: 7270) |

---

## Tezkor Deploy (deploy.sh orqali)

### 1. Oddiy deploy (frontend + cache)

```bash
./deploy.sh
```

Bu buyruq quyidagilarni bajaradi:
- Commitlanmagan o'zgarishlar borligini tekshiradi
- Lokal va remote sinxronligini tekshiradi
- `artisan down` — saytni maintenance rejimiga qo'yadi
- `git pull origin main` — kodni yangilaydi
- `npm run build` — frontend assetlarni yig'adi
- Keshlarni tozalaydi va qayta yaratadi
- `artisan up` — saytni qayta ochadi

### 2. To'liq deploy (composer + migrate + queue)

```bash
./deploy.sh --full
```

Oddiy deployga qo'shimcha:
- `composer install --no-dev` — backend dependencylarni yangilaydi
- `php artisan migrate --force` — migratsiyalarni ishlatadi
- Queue workerlarni restart qiladi

### 3. Rollback (oxirgi commitga qaytish)

```bash
./deploy.sh --rollback
```

---

## Qo'lda Deploy Qilish

Agar skriptdan foydalanmasangiz, quyidagi buyruqlarni serverda bajaring:

```bash
# 1. Serverga ulaning
ssh root@193.180.213.188

# 2. Loyiha papkasiga o'ting
cd /var/www/panel_school_usr/data/www/panel.schoolday.uz

# 3. Maintenance rejimiga o'tkazing
/opt/php83/bin/php artisan down

# 4. Kodni yangilang
git pull origin main

# 5. (Agar kerak bo'lsa) Composer
/opt/php83/bin/php /usr/local/bin/composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 6. Frontend yig'ish
PATH="/opt/php83/bin:$PATH" npm run build

# 7. (Agar kerak bo'lsa) Migratsiya
/opt/php83/bin/php artisan migrate --force

# 8. Keshlarni tozalash
/opt/php83/bin/php artisan config:clear
/opt/php83/bin/php artisan route:clear
/opt/php83/bin/php artisan view:clear
/opt/php83/bin/php artisan event:clear

# 9. Keshlarni qayta yaratish
/opt/php83/bin/php artisan config:cache
/opt/php83/bin/php artisan route:cache
/opt/php83/bin/php artisan view:cache
/opt/php83/bin/php artisan event:cache

# 10. (Agar kerak bo'lsa) Queue restart
supervisorctl restart schoolday-worker:*

# 11. Saytni ochish
/opt/php83/bin/php artisan up
```

---

## Servislarni Boshqarish

### Supervisor (Queue Worker va Reverb)

```bash
# Barcha schoolday servislarni ko'rish
supervisorctl status | grep schoolday

# Queue workerlarni restart qilish
supervisorctl restart schoolday-worker:*

# Reverb WebSocket serverini restart qilish
supervisorctl restart schoolday-reverb:*

# Barcha schoolday servislarni to'xtatish
supervisorctl stop schoolday-worker:* schoolday-reverb:*

# Barcha schoolday servislarni ishga tushirish
supervisorctl start schoolday-worker:* schoolday-reverb:*
```

### Systemd (Hikvision ISUP Gateway)

```bash
# Statusni tekshirish
systemctl status hikvision-isup-schoolday

# Restart qilish
systemctl restart hikvision-isup-schoolday

# Loglarni ko'rish
journalctl -u hikvision-isup-schoolday -f --no-pager
```

---

## Loglarni Ko'rish

```bash
# Laravel log
tail -f /var/www/panel_school_usr/data/www/panel.schoolday.uz/storage/logs/laravel.log

# Queue worker log
supervisorctl tail -f schoolday-worker:schoolday-worker_00

# Reverb log
supervisorctl tail -f schoolday-reverb:schoolday-reverb_00

# Hikvision ISUP Gateway log
journalctl -u hikvision-isup-schoolday -f --no-pager

# Nginx access log
tail -f /var/www/panel_school_usr/data/logs/panel.schoolday.uz-frontend.access.log

# Nginx error log
tail -f /var/www/panel_school_usr/data/logs/panel.schoolday.uz-frontend.error.log
```

---

## Portlar

| Port | Servis | Tavsif |
|---|---|---|
| 443 | Nginx (HTTPS) | Web server |
| 7670 | Hikvision ISUP CMS | Qurilmalar ulanishi |
| 7671 | Hikvision ISUP API | REST API (faqat localhost) |
| 7270 | Hikvision ISUP Alarm | Alarm callback |
| 8086 | Laravel Reverb | WebSocket server |

---

## Muhim Eslatmalar

> [!WARNING]
> **panel.payday.uz** ham shu serverda ishlaydi. Deploy paytida unga tegmang!
> PayDay loyihasi `/var/www/panel_payday_usr/data/www/panel.payday.uz` papkasida joylashgan.

> [!IMPORTANT]
> PHP buyruqlarini har doim `/opt/php83/bin/php` orqali ishga tushiring.
> Serverdagi default PHP versiyasi boshqacha bo'lishi mumkin.

> [!TIP]
> Tezkor deploy uchun lokal kompyuterdan to'g'ridan-to'g'ri `./deploy.sh` ni ishga tushiring.
> SSH parol so'ramaydi (kalit orqali ulangan).

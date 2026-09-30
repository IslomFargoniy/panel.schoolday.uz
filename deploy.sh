#!/bin/bash
# ============================================================
# panel.schoolday.uz — Deploy Script
# ============================================================
# Serverga avtomatik deploy qilish uchun skript.
# Ishlatish: ./deploy.sh yoki ./deploy.sh --full
#
# Rejimlar:
#   (default)  — git pull + npm build + cache clear
#   --full     — + composer install + migrate + queue restart
#   --rollback — oxirgi commitga qaytish
# ============================================================

set -euo pipefail

# ── Konfiguratsiya ──────────────────────────────────────────
SERVER="root@193.180.213.188"
REMOTE_PATH="/var/www/panel_school_usr/data/www/panel.schoolday.uz"
PHP="/opt/php83/bin/php"
BRANCH="main"

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Funksiyalar ─────────────────────────────────────────────
log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
log_error()   { echo -e "${RED}[✗]${NC} $1"; }

run_remote() {
    ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=10 "$SERVER" "cd $REMOTE_PATH && $1"
}

# ── SSH tekshirish ──────────────────────────────────────────
check_connection() {
    log_info "Serverga ulanish tekshirilmoqda..."
    if ! ssh -o ConnectTimeout=5 "$SERVER" "echo 'ok'" &>/dev/null; then
        log_error "Serverga ulanib bo'lmadi: $SERVER"
        exit 1
    fi
    log_success "Server bilan aloqa o'rnatildi"
}

# ── Rollback ────────────────────────────────────────────────
rollback() {
    log_warn "Rollback boshlanmoqda..."
    run_remote "git checkout HEAD~1"
    run_remote "PATH=\"/opt/php83/bin:\$PATH\" npm run build"
    run_remote "$PHP artisan view:clear && $PHP artisan route:clear && $PHP artisan config:clear"
    log_success "Rollback yakunlandi"
    exit 0
}

# ── Lokal tekshiruvlar ──────────────────────────────────────
preflight_checks() {
    log_info "Lokal tekshiruvlar..."

    # Commitlanmagan o'zgarishlar bormi?
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Commitlanmagan o'zgarishlar mavjud! Avval commit qiling."
        git status --short
        exit 1
    fi

    # Remote bilan sinxronmi?
    git fetch origin "$BRANCH" --quiet
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")
    if [[ "$LOCAL" != "$REMOTE" ]]; then
        log_warn "Lokal va remote farq qiladi. Avval 'git push origin $BRANCH' qiling."
        exit 1
    fi

    log_success "Lokal tekshiruvlar o'tdi"
}

# ── Deploy ──────────────────────────────────────────────────
deploy() {
    local MODE="${1:-quick}"

    log_info "Deploy boshlanmoqda... [rejim: $MODE]"
    echo ""

    # 1. Kod yangilash
    log_info "Kod yangilanmoqda (git pull)..."
    run_remote "git pull origin $BRANCH"
    log_success "Kod yangilandi"

    # 3. Composer (faqat --full rejimda)
    if [[ "$MODE" == "full" ]]; then
        log_info "Composer dependencies o'rnatilmoqda..."
        run_remote "$PHP /usr/local/bin/composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev"
        log_success "Composer dependencies o'rnatildi"
    fi

    # 4. NPM build
    log_info "Frontend yig'ilmoqda (npm run build)..."
    run_remote "PATH=\"/opt/php83/bin:\$PATH\" npm run build"
    log_success "Frontend yig'ildi"

    # 5. Migratsiya (faqat --full rejimda)
    if [[ "$MODE" == "full" ]]; then
        log_info "Migratsiyalar ishlatilmoqda..."
        run_remote "$PHP artisan migrate --force"
        log_success "Migratsiyalar yakunlandi"
    fi

    # 6. Cache tozalash
    log_info "Keshlar tozalanmoqda..."
    run_remote "$PHP artisan config:clear"
    run_remote "$PHP artisan route:clear"
    run_remote "$PHP artisan view:clear"
    run_remote "$PHP artisan event:clear"
    log_success "Keshlar tozalandi"

    # 7. Cache qayta yaratish
    log_info "Keshlar qayta yaratilmoqda..."
    run_remote "$PHP artisan config:cache"
    run_remote "$PHP artisan route:cache"
    run_remote "$PHP artisan view:cache"
    run_remote "$PHP artisan event:cache"
    log_success "Keshlar yaratildi"

    # 8. Queue worker restart
    if [[ "$MODE" == "full" ]]; then
        log_info "Queue worker qayta ishga tushirilmoqda..."
        run_remote "supervisorctl restart schoolday-worker:*" || log_warn "Supervisor restart xatosi (ehtimol allaqachon ishlayapti)"
        log_success "Queue worker qayta ishga tushdi"
    fi

    # 9. Maintenance off
    log_info "Sayt qayta ochilmoqda..."
    run_remote "$PHP artisan up"
    log_success "Sayt ishga tushdi"

    echo ""
    log_success "═══════════════════════════════════════════"
    log_success "  Deploy muvaffaqiyatli yakunlandi! 🚀"
    log_success "  https://panel.schoolday.uz"
    log_success "═══════════════════════════════════════════"
}

# ── Main ────────────────────────────────────────────────────
main() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   panel.schoolday.uz — Deploy Script      ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
    echo ""

    case "${1:-}" in
        --rollback)
            check_connection
            rollback
            ;;
        --full)
            check_connection
            preflight_checks
            deploy "full"
            ;;
        *)
            check_connection
            preflight_checks
            deploy "quick"
            ;;
    esac
}

main "$@"

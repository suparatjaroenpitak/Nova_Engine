#!/usr/bin/env bash
# ============================================================================
# Nova Engine — Universal Deploy Script
# Works on: Oracle Cloud Always Free, Hetzner, DigitalOcean, any Ubuntu 24.04 VM
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Nova Engine — Deploy Script      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

# ── 1. Check prerequisites ────────────────────────────────────────────
check_prereqs() {
    echo -e "\n${YELLOW}[1/6] Checking prerequisites...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker not found. Installing...${NC}"
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker "$USER"
    fi

    if ! command -v docker compose &> /dev/null; then
        echo -e "${RED}Docker Compose not found. Installing...${NC}"
        sudo apt-get update && sudo apt-get install -y docker-compose-plugin
    fi

    echo -e "${GREEN}  ✓ Docker $(docker --version)${NC}"
    echo -e "${GREEN}  ✓ Docker Compose $(docker compose version)${NC}"
}

# ── 2. Clone / pull latest code ───────────────────────────────────────
fetch_code() {
    echo -e "\n${YELLOW}[2/6] Fetching latest code...${NC}"

    if [ -d "$PROJECT_ROOT/.git" ]; then
        git -C "$PROJECT_ROOT" pull --rebase
    else
        read -rp "Git repo URL: " REPO_URL
        git clone "$REPO_URL" "$PROJECT_ROOT"
    fi
    echo -e "${GREEN}  ✓ Code updated${NC}"
}

# ── 3. Configure environment ──────────────────────────────────────────
configure_env() {
    echo -e "\n${YELLOW}[3/6] Configuring environment...${NC}"

    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${YELLOW}  ⚠  Edit .env file with your settings${NC}"

        # Generate secure random keys
        JWT_KEY=$(openssl rand -hex 32)
        ADMIN_PASS=$(openssl rand -base64 12)

        sed -i "s/Jwt__SigningKey=.*/Jwt__SigningKey=$JWT_KEY/" "$PROJECT_ROOT/.env"
        sed -i "s/Seed__AdminPassword=.*/Seed__AdminPassword=$ADMIN_PASS/" "$PROJECT_ROOT/.env"

        echo -e "${GREEN}  ✓ JWT key generated${NC}"
        echo -e "${GREEN}  ✓ Admin password: $ADMIN_PASS${NC}"
    else
        echo -e "${GREEN}  ✓ .env already exists${NC}"
    fi
}

# ── 4. Build and start containers ─────────────────────────────────────
start_services() {
    echo -e "\n${YELLOW}[4/6] Building and starting containers...${NC}"

    # Use production compose file
    cd "$PROJECT_ROOT"

    # Pull base images first
    docker compose -f deploy/docker-compose.prod.yml pull

    # Build and start
    docker compose -f deploy/docker-compose.prod.yml up --build -d

    echo -e "${GREEN}  ✓ Services started${NC}"
}

# ── 5. Health check ───────────────────────────────────────────────────
health_check() {
    echo -e "\n${YELLOW}[5/6] Running health checks...${NC}"

    sleep 10

    # Check all containers are running
    for service in postgres redis minio api web; do
        if docker ps --format '{{.Names}}' | grep -q "nova-$service"; then
            echo -e "${GREEN}  ✓ nova-$service is running${NC}"
        else
            echo -e "${RED}  ✗ nova-$service is NOT running${NC}"
        fi
    done

    # Test API endpoint
    if curl -sf http://localhost:5080/api/v1/auth/me > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ API is responding${NC}"
    else
        echo -e "${YELLOW}  ⚠  API not responding yet (may still be starting)${NC}"
    fi
}

# ── 6. Show info ──────────────────────────────────────────────────────
show_info() {
    PUBLIC_IP=$(curl -sf ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

    echo -e "\n${YELLOW}[6/6] Deployment info${NC}"
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Nova Engine — Deployed!             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  API:       http://$PUBLIC_IP:5080"
    echo -e "  Swagger:   http://$PUBLIC_IP:5080/scalar/v1"
    echo -e "  Editor:    (build frontend separately or use nginx)"
    echo -e "  MinIO:     http://$PUBLIC_IP:9001"
    echo ""
    echo -e "  Login:     admin@nova.local"
    echo -e "  Password:  (check .env → Seed__AdminPassword)"
    echo ""

    # Print admin password
    ADMIN_PASS=$(grep Seed__AdminPassword "$PROJECT_ROOT/.env" | cut -d= -f2)
    if [ -n "$ADMIN_PASS" ]; then
        echo -e "  ${YELLOW}Admin password: $ADMIN_PASS${NC}"
    fi

    echo ""
    echo -e "  ${YELLOW}Next steps:${NC}"
    echo -e "    1. Set up a domain and SSL (Let's Encrypt + nginx reverse proxy)"
    echo -e "    2. Open ports in firewall: 80, 443, 5080 (or use reverse proxy)"
    echo -e "    3. Build frontend: cd frontend && npm ci && npm run build"
    echo -e "    4. Copy dist/ to nginx: sudo cp -r dist/* /var/www/html/"
    echo ""
}

# ── Main ──────────────────────────────────────────────────────────────
main() {
    check_prereqs
    fetch_code
    configure_env
    start_services
    health_check
    show_info
}

main "$@"

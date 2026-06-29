# Nova Engine — Production Deployment

## Free Hosting Options Comparison

| Platform       | Always On | PostgreSQL | Redis | MinIO | Setup Complexity | Best For                 |
|----------------|-----------|------------|-------|-------|------------------|--------------------------|
| Oracle Cloud   | ✅ Yes    | ✅ Docker   | ✅    | ✅    | Medium           | Full stack, 24/7         |
| Render         | ❌ Sleeps | ✅ Free DB  | ❌    | ❌    | Easy             | Quick demo, prototyping  |
| Fly.io         | ✅ Yes    | ✅ Paid     | ❌    | ❌    | Medium           | Lightweight deployment   |
| Railway        | ✅ Yes    | ✅ Free DB  | ✅    | ❌    | Easy             | Credits-based ($$$)      |
| Koyeb          | ✅ Yes    | ✅ Docker   | ✅    | ✅    | Medium           | Docker-native hosting    |

**Recommendation:** Oracle Cloud Always Free + Docker Compose for the full stack.

---

## Option 1: Oracle Cloud Always Free (Recommended)

Full Docker Compose stack, always-on, true zero cost.

### Setup (5 minutes)

```bash
# 1. Create free account at https://signup.cloud.oracle.com
#    Use "Pay as you go" — you won't be charged under free tier limits.
#    Required: credit card for identity verification.

# 2. Create Ampere A1 VM (4 CPUs, 24GB RAM)
#    Region: US East (Ashburn) — best availability for ARM
#    OS: Ubuntu 24.04 LTS
#    SSH: Add your public key

# 3. SSH in and deploy
ssh ubuntu@YOUR_VM_IP
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

git clone https://github.com/YOUR_USER/nova-engine.git
cd nova-engine
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

### Firewall (OCI Security List)

Add ingress rules to your subnet's security list:
- Port 80 — HTTP (for frontend + reverse proxy)
- Port 443 — HTTPS (with Let's Encrypt)
- Port 5080 — API (restrict to your IP or use reverse proxy)

---

## Option 2: Render (Simplest, Quick Demo)

Sleeps after 15 min of inactivity. Wakes on request (takes ~30s). Perfect for demos.

### Setup

1. **PostgreSQL**: https://dashboard.render.com/new/database — select Free
2. **API Web Service**: New Web Service → select repo → Docker → Free plan
3. **Static Site**: New Static Site → select repo → Root: `frontend` → Build: `npm run build` → Publish: `dist`
4. **Environment Variables** (set in Render dashboard):

```
ASP.NET Core Web Service:
  ConnectionStrings__Postgres  →  Internal Database URL  (from your PostgreSQL service)
  Jwt__SigningKey              →  A random 32+ character string
  Cors__AllowedOrigins__0      →  https://your-frontend.onrender.com

Static Site (no env vars needed, uses build-time):
  VITE_API_URL  →  https://your-api.onrender.com
```

---

## Option 3: DigitalOcean / Hetzner ($4-6/month)

For $4-6/month (less than a coffee), you get a dedicated VPS that never sleeps.

```bash
# Hetzner CX22 (2 vCPU, 4GB RAM, $4.49/mo)
# DigitalOcean Basic (1 vCPU, 1GB RAM, $6/mo)

# Same deploy script:
ssh root@YOUR_VM_IP
curl -fsSL https://get.docker.com | sh
git clone https://github.com/YOUR_USER/nova-engine.git
cd nova-engine
bash deploy/deploy.sh
```

---

## Setting Up HTTPS (Let's Encrypt + nginx)

After deploying, secure your site with SSL:

```bash
# Install nginx + certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create nginx config
sudo tee /etc/nginx/sites-available/nova << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:5080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /hubs/ {
        proxy_pass http://127.0.0.1:5080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/nova /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
```

---

## Backups

Automatic daily database backup via cron:

```bash
# Add to crontab: crontab -e
0 3 * * * docker exec nova-postgres pg_dump -U nova nova_engine | gzip > /backups/nova_$(date +\%Y\%m\%d).sql.gz
```

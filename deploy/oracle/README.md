# Oracle Cloud Always Free — Full Stack Deployment

Oracle Cloud Always Free is the ONLY truly free option that can run the
entire Nova Engine stack 24/7 (including Docker Compose + PostgreSQL).

## Free Resources

| Resource       | Spec                                              |
|----------------|---------------------------------------------------|
| Compute (AMD)  | 2 VMs, 1 OCPU, 1GB RAM, 100GB total               |
| Compute (ARM)  | 4 VMs, 24GB RAM, 200GB total (Ampere A1)          |
| Load Balancer  | 1 instance, 10Mbps                                |
| Block Storage  | 200GB total                                       |
| Object Storage | 20GB, 50k requests/month                          |
| Database       | Up to 2 DB systems, 20GB each (not recommended — just run Docker) |

## Quick Start (Docker Compose on ARM VM)

```bash
# 1. Create an ARM VM (Ampere A1.Flex — 4 OCPUs, 24GB RAM)
#    Region choices: US East (Ashburn), EU (Frankfurt), AP (Seoul)
#    OS: Ubuntu 24.04 LTS
#    SSH: Add your public key
#    Boot volume: 50GB (free)

# 2. SSH into the VM
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_VM_PUBLIC_IP

# 3. Install Docker + Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 4. Clone your repo
git clone https://github.com/YOUR_USER/nova-engine.git
cd nova-engine

# 5. Set up environment
cp .env.example .env
# Edit .env — change public IPs, generate a strong JWT signing key

# 6. Start all services
docker compose up --build -d

# 7. Open ports in OCI Security List (Networking → Security Lists)
#    Ingress rules:
#      5080 (API)
#      5432 (Postgres — restrict to API only)
#      9000 (MinIO API)
#      9001 (MinIO Console)

# 8. Access
#    API:       http://YOUR_VM_IP:5080/swagger
#    Editor:    http://YOUR_VM_IP:5173  (or build frontend, serve via nginx on port 80)
#    MinIO:     http://YOUR_VM_IP:9001
```

## Recommended: ARM VM (Ampere A1) + Traefik Reverse Proxy

For production-grade setup with HTTPS and domain:

```bash
# docker-compose.prod.yml
# Add Traefik as reverse proxy with Let's Encrypt SSL
```

## Building Frontend on VM (for production)

Instead of running Vite dev server, build and serve via nginx:

```bash
cd frontend
npm ci && npm run build

# Copy to nginx
sudo apt install nginx -y
sudo cp -r dist/* /var/www/html/
sudo systemctl enable nginx
```

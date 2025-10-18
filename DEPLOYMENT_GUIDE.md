// ========================================
// DEPLOYMENT_GUIDE.md
// ========================================

# NeuroVault Deployment Guide

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Docker & Docker Compose installed
- [ ] QIE testnet/mainnet RPC access
- [ ] MetaMask configured for QIE network
- [ ] Sufficient testnet tokens for deployment
- [ ] OpenAI API key
- [ ] Domain name (for production)
- [ ] SSL certificates (for production)

## 🔧 Local Development Deployment

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/neurovault.git
cd neurovault
chmod +x scripts/setup-dev-environment.sh
./scripts/setup-dev-environment.sh
```

### 2. Configure Environment

Edit `backend/.env`:
```bash
PORT=3001
NODE_ENV=development
QIE_RPC_URL=https://testnet-rpc.qie.network
PRIVATE_KEY=your_private_key_here
OPENAI_API_KEY=sk-your-key-here
```

### 3. Deploy Smart Contracts

```bash
cd smart-contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network qie_testnet
```

Copy the deployed contract addresses to `backend/.env`:
```bash
AI_IDENTITY_ADDRESS=0x...
MEMORY_VAULT_ADDRESS=0x...
REPUTATION_ORACLE_ADDRESS=0x...
```

### 4. Start Services

```bash
# Terminal 1 - Infrastructure
docker-compose up -d

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm start
```

### 5. Run Tests

```bash
# Smart contracts
cd smart-contracts
npx hardhat test

# Backend
cd backend
npm test

# Run demo
node demo/complete-demo.js
```

## 🌐 Production Deployment

### Option 1: Traditional VPS (DigitalOcean, AWS, etc.)

#### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/divs-spec/neurovault.git
cd neurovault
```

#### Configure for Production

```bash
# Backend .env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
QIE_RPC_URL=https://rpc.qie.network
# ... other production values
```

#### Setup Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Setup PM2 for Process Management

```bash
npm install -g pm2

# Backend
cd backend
pm2 start src/index.js --name neurovault-backend

# Frontend (build first)
cd frontend
npm run build
pm2 serve build 3000 --name neurovault-frontend --spa

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
    env_file:
      - ./backend/.env.production
    depends_on:
      - milvus

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: https://api.yourdomain.com

  milvus:
    image: milvusdb/milvus:v2.3.3
    restart: always
    # ... (same as development)

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Cloud Providers

#### Vercel (Frontend)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Railway/Heroku (Backend)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secret management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly

2. **Rate Limiting**
   - Configure aggressive rate limits
   - Use Cloudflare for DDoS protection

3. **Database Security**
   - Enable Milvus authentication
   - Restrict network access
   - Regular backups

4. **Smart Contract Security**
   - Complete audit before mainnet
   - Use multi-sig for ownership
   - Monitor contract events

5. **API Security**
   - HTTPS only
   - CORS whitelist
   - Input validation
   - JWT authentication (if needed)

## 📊 Monitoring & Logging

### Setup Monitoring

```bash
# Install Prometheus
docker run -d -p 9090:9090 prom/prometheus

# Install Grafana
docker run -d -p 3000:3000 grafana/grafana
```

### Setup Logging

```javascript
// In backend/src/index.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 Backup Strategy

```bash
# Backup script (backup.sh)
#!/bin/bash

# Backup Milvus data
docker exec milvus tar czf /backup/milvus-$(date +%Y%m%d).tar.gz /var/lib/milvus

# Backup configuration
tar czf /backup/config-$(date +%Y%m%d).tar.gz backend/.env frontend/.env

# Upload to S3 (optional)
aws s3 cp /backup s3://your-backup-bucket/ --recursive
```

## 📈 Scaling Considerations

1. **Horizontal Scaling**
   - Multiple backend instances behind load balancer
   - Distributed Milvus cluster
   - Redis for session management

2. **Vertical Scaling**
   - Increase server resources as needed
   - Optimize database queries
   - Cache frequently accessed data

3. **CDN**
   - Use Cloudflare or similar for frontend
   - Cache static assets
   - Geo-distribution

## 🎯 Post-Deployment

1. **Verify Deployment**
   ```bash
   curl https://yourdomain.com/health
   curl https://api.yourdomain.com/health
   ```

2. **Monitor Logs**
   ```bash
   pm2 logs neurovault-backend
   docker-compose logs -f
   ```

3. **Test Functionality**
   - Create test agent
   - Store test memory
   - Verify on blockchain explorer

4. **Setup Alerts**
   - Server down alerts
   - Error rate monitoring
   - Gas price monitoring

## 📞 Support

- GitHub Issues: https://github.com/divs-spec/neurovault/issues

- Email: ikrakizoi2607@gmail.com

---

**Remember:** Always test thoroughly on testnet before deploying to mainnet!

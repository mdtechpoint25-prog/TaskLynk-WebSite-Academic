# Remote Testing Deployment Guide - TaskLynk

## 🚀 Quick Deployment Overview

**Current Stack**:
- Framework: Next.js 16 (standalone build)
- Database: Turso (SQLite)
- Runtime: Node.js
- Port: 5000

**Deployment Options** (Choose one):
1. **Vercel** (Recommended) - Easiest, auto-scaling, free tier
2. **Render** - Great free tier, easy GitHub integration
3. **Railway** - Simple & fast deployment
4. **Replit** - Already configured in your repo
5. **Self-hosted VPS** - Full control (DigitalOcean, Hetzner, etc.)

---

## Option 1: Deploy to Vercel (RECOMMENDED - 5 mins)

### Step 1: Push Code to GitHub (if not already done)
```powershell
# In your project directory
git add .
git commit -m "Ready for remote testing deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure environment variables:
   - Copy all values from `.env` file
   - Paste into Vercel's Environment Variables
   - Critical variables to set:
     - `TURSO_CONNECTION_URL`
     - `TURSO_AUTH_TOKEN`
     - `RESEND_API_KEY`
     - `MPESA_CONSUMER_KEY` & `MPESA_CONSUMER_SECRET`
     - `PAYSTACK_SECRET_KEY`
     - `CLOUDINARY_*` variables
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

5. Click "Deploy"
6. Wait ~2-3 minutes for build to complete
7. Get your URL: `https://your-project-name.vercel.app`

### Test After Deployment
```
Frontend: https://your-project-name.vercel.app
Admin Login: https://your-project-name.vercel.app/admin/login
Manager Login: https://your-project-name.vercel.app/manager/login
Client Login: https://your-project-name.vercel.app/client/login
Freelancer Login: https://your-project-name.vercel.app/freelancer/login
```

---

## Option 2: Deploy to Render

### Step 1: Prepare Your Project
Make sure `.env` exists with all variables (already done in your project).

### Step 2: Create Render Service
1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tasklynk-testing`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node_modules/.next/standalone/node_modules/next/dist/bin/next start -H 0.0.0.0 -p 5000`
   
### Step 3: Add Environment Variables
Click "Environment" and paste all variables from your `.env` file:
```
TURSO_CONNECTION_URL=libsql://tasklynk-database-tasklynknet.aws-us-east-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_KKXApQ4T_...
(and all other variables from .env)
```

### Step 4: Deploy
Click "Create Web Service" and wait for deployment (~3-5 minutes)

**Your Live URL**: `https://tasklynk-testing.onrender.com`

---

## Option 3: Deploy to Railway

### Step 1: Connect Repository
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Click "Deploy Now"

### Step 2: Configure Environment
1. In Railway Dashboard, click "Variables"
2. Click "RAW Editor"
3. Paste all your `.env` variables
4. Click "Deploy"

### Step 3: Configure Start Script
1. Click "Settings"
2. Set **Start Command**: 
```bash
npm run build && npm start
```

**Your Live URL**: `https://tasklynk-testing-prod.up.railway.app` (auto-generated)

---

## Option 4: Self-Hosted VPS Deployment

### Prerequisites
- VPS with Ubuntu/Debian
- Node.js 18+ installed
- SSH access to server
- Domain name (optional)

### Step 1: Connect to VPS
```powershell
ssh root@your-server-ip
```

### Step 2: Install Dependencies
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2
```

### Step 3: Clone Repository
```bash
cd /opt
git clone https://github.com/mdtechpoint25-prog/TaskLynk-WebSite-Academic.git
cd TaskLynk-WebSite-Academic
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Configure Environment
```bash
# Copy and edit .env
cp .env.example .env
nano .env
# Paste all your environment variables
# Press Ctrl+X, then Y, then Enter to save
```

### Step 6: Build Application
```bash
npm run build
```

### Step 7: Start with PM2
```bash
# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tasklynk',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 8: Setup Nginx Reverse Proxy
```bash
# Install Nginx
apt-get install -y nginx

# Create config
nano /etc/nginx/sites-available/tasklynk
```

Paste this config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
ln -s /etc/nginx/sites-available/tasklynk /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 9: Setup SSL (Optional but Recommended)
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## Option 5: Replit (Already Configured)

Your repo includes `.replit` configuration. Simply:

1. Go to https://replit.com
2. Click "Import" and paste your GitHub URL
3. Click "Import from GitHub"
4. Add environment variables in "Secrets" tab
5. Click "Run"

**URL**: `https://tasklynk-academic.replit.dev` (example)

---

## 🔧 Pre-Deployment Checklist

### Local Testing (Before Deployment)
```powershell
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Test start command
npm start
# Should show: "ready - started server on 0.0.0.0:5000"

# 4. Test in browser
# Open http://localhost:5000
```

### Environment Variables Verification
```powershell
# Make sure all these are set in your .env file:
# - TURSO_CONNECTION_URL ✓
# - TURSO_AUTH_TOKEN ✓
# - RESEND_API_KEY ✓
# - MPESA_CONSUMER_KEY ✓
# - PAYSTACK_SECRET_KEY ✓
# - CLOUDINARY_CLOUD_NAME ✓
# - NEXT_PUBLIC_SUPABASE_URL ✓
```

### Test Critical Features
- [ ] Login pages load
- [ ] Database connection works
- [ ] File uploads work (Cloudinary)
- [ ] Email notifications send (Resend)
- [ ] Payment gateway connects

---

## 🧪 Remote Testing Steps

### After Deployment

#### 1. Test Login Flow
```
Admin: admin@tasklynk.com / password
Manager: manager@tasklynk.com / password
Client: client@tasklynk.com / password
Freelancer: freelancer@tasklynk.com / password
```

#### 2. Test Core Features
- [ ] Register new user
- [ ] Create order
- [ ] Freelancer accepts order
- [ ] Upload files
- [ ] Payment processing
- [ ] Notifications send
- [ ] CPP progress displays
- [ ] Download completed work

#### 3. Monitor Performance
```
- Page load time: < 2 seconds
- API response time: < 500ms
- No console errors
- Dark mode works
- Mobile responsive
```

#### 4. Database Verification
```
Check these tables exist:
- users
- orders
- jobs
- payments
- notifications
- freelancerCPPLevels
- freelancerCPPProgress
- (and all others from schema)
```

---

## 📊 Deployment Comparison

| Option | Setup Time | Cost | Scalability | Recommended For |
|--------|-----------|------|-------------|-----------------|
| **Vercel** | 5 mins | Free → $20/mo | Auto-scale | Testing, Production |
| **Render** | 10 mins | Free → $12/mo | Manual | Testing |
| **Railway** | 10 mins | Pay-as-you-go | Auto-scale | Testing, Production |
| **Replit** | 5 mins | Free → $12/mo | Limited | Quick Testing |
| **VPS** | 30 mins | $5-20/mo | Manual | Full Control |

---

## 🐛 Troubleshooting

### Build Fails with "Module not found"
```powershell
# Solution: Clean install
npm install --force
npm run build
```

### Database Connection Fails
```powershell
# Check credentials in .env
# Verify TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN are correct
# Test connection: npm run db:push
```

### Port Already in Use
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000

# Kill it (PowerShell as Admin)
Stop-Process -Id <PID> -Force
```

### Environment Variables Not Loading
```powershell
# Restart application after setting env vars
# Vercel: Redeploy from dashboard
# Render: Manual redeploy
# VPS: pm2 restart tasklynk
```

### Slow Performance
- Check database queries in Turso dashboard
- Enable image optimization in next.config.ts ✓
- Use CDN for assets
- Check API response times

---

## 📈 Next Steps After Testing

1. **Performance Monitoring**
   - Setup Sentry for error tracking
   - Add Vercel Analytics
   - Monitor database performance

2. **Staging Environment**
   - Create separate staging instance
   - Use staging database
   - Test before production

3. **Production Deployment**
   - Use custom domain
   - Setup SSL certificate
   - Enable auto-scaling
   - Setup backups

4. **Continuous Deployment**
   - Auto-deploy on git push
   - Run tests before deployment
   - Email notifications on deploy

---

## 🔗 Quick Links

- **Project Dashboard**: Depends on platform
- **Turso Database**: https://turso.tech
- **Cloudinary**: https://cloudinary.com
- **Resend Email**: https://resend.com
- **Supabase**: https://supabase.com

---

## ✅ Deployment Complete!

Once deployed, share the URL with testers:
```
🌐 Live URL: https://your-deployed-url.com
📝 Test Credentials: See admin panel
🔧 Issues: Report via GitHub issues
```

**Happy Testing! 🎉**

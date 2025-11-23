#!/bin/bash

# TaskLynk Remote Testing Deployment Script
# Automated deployment to Render, Railway, or VPS

set -e

echo "🚀 TaskLynk Deployment Assistant"
echo "=================================="
echo ""
echo "Select deployment target:"
echo "1) Vercel (Recommended)"
echo "2) Render"
echo "3) Railway"
echo "4) VPS (Self-hosted)"
echo ""
read -p "Choose option (1-4): " CHOICE

case $CHOICE in
  1)
    echo "📦 Deploying to Vercel..."
    echo ""
    echo "Prerequisites:"
    echo "- GitHub account with repo pushed"
    echo "- Vercel account"
    echo ""
    echo "Steps:"
    echo "1. Visit: https://vercel.com/new"
    echo "2. Select your TaskLynk repository"
    echo "3. Add these environment variables:"
    echo "   - TURSO_CONNECTION_URL"
    echo "   - TURSO_AUTH_TOKEN"
    echo "   - RESEND_API_KEY"
    echo "   - All other .env variables"
    echo "4. Click 'Deploy'"
    echo ""
    echo "✅ Deployment will complete in 2-3 minutes"
    echo "📍 URL will be: https://your-project.vercel.app"
    ;;
  
  2)
    echo "📦 Deploying to Render..."
    echo ""
    echo "Build Command: npm install && npm run build"
    echo "Start Command: npm start"
    echo ""
    echo "Steps:"
    echo "1. Visit: https://render.com"
    echo "2. New → Web Service"
    echo "3. Connect GitHub repo"
    echo "4. Enter build/start commands above"
    echo "5. Add all .env variables in Environment section"
    echo "6. Click 'Create Web Service'"
    echo ""
    echo "✅ Deployment will complete in 3-5 minutes"
    ;;
  
  3)
    echo "📦 Deploying to Railway..."
    echo ""
    echo "Steps:"
    echo "1. Visit: https://railway.app"
    echo "2. New Project → Deploy from GitHub"
    echo "3. Select your repository"
    echo "4. Add environment variables"
    echo "5. Railway will auto-detect Next.js and deploy"
    echo ""
    echo "✅ Deployment will complete in 2-3 minutes"
    ;;
  
  4)
    echo "📦 Deploying to VPS..."
    echo ""
    read -p "Enter server IP: " SERVER_IP
    read -p "Enter server username (default: root): " USERNAME
    USERNAME=${USERNAME:-root}
    
    echo ""
    echo "Connecting to $USERNAME@$SERVER_IP..."
    echo ""
    
    ssh -t "$USERNAME@$SERVER_IP" << 'EOF'
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs npm
    
    # Install PM2
    npm install -g pm2
    
    # Clone repository
    cd /opt
    git clone https://github.com/mdtechpoint25-prog/TaskLynk-WebSite-Academic.git
    cd TaskLynk-WebSite-Academic
    
    # Install dependencies
    npm install
    
    # Build
    npm run build
    
    # Start with PM2
    pm2 start 'npm start' --name tasklynk
    pm2 save
    pm2 startup
    
    echo ""
    echo "✅ Application is running on http://localhost:5000"
    echo "Configure Nginx or your firewall to expose port 5000"
EOF
    ;;
  
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "=================================="
echo "📚 For detailed instructions, see:"
echo "   DEPLOYMENT_GUIDE_REMOTE_TESTING.md"
echo ""
echo "🧪 After deployment, test:"
echo "   - User login (all roles)"
echo "   - Order creation"
echo "   - File uploads"
echo "   - Payment processing"
echo ""

# TaskLynk Remote Testing Deployment Script (Windows/PowerShell)
# Run: .\deploy.ps1

Write-Host "🚀 TaskLynk Deployment Assistant" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test build locally first
Write-Host "📋 Pre-Deployment Checklist" -ForegroundColor Yellow
Write-Host "============================"
Write-Host ""

$buildTest = Read-Host "Want to test build locally first? (y/n)"

if ($buildTest -eq "y") {
    Write-Host "🔨 Testing build..." -ForegroundColor Cyan
    
    # Check Node.js
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    # Build
    Write-Host "🏗️  Building project..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed! Fix errors before deploying." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "Select deployment target:" -ForegroundColor Yellow
Write-Host "=========================="
Write-Host "1) Vercel (Recommended)" -ForegroundColor Green
Write-Host "2) Render" -ForegroundColor Cyan
Write-Host "3) Railway" -ForegroundColor Cyan
Write-Host "4) Replit (Quick)" -ForegroundColor Cyan
Write-Host "5) VPS (Self-hosted)" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Choose option (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Deploying to Vercel (Recommended)" -ForegroundColor Green
        Write-Host "====================================="
        Write-Host ""
        Write-Host "Vercel is the easiest option for Next.js projects." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if git is ready
        Write-Host "Checking git status..." -ForegroundColor Yellow
        $gitStatus = git status --porcelain
        
        if ($gitStatus) {
            Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
            Write-Host $gitStatus
            Write-Host ""
            
            $commit = Read-Host "Commit changes? (y/n)"
            if ($commit -eq "y") {
                git add .
                $message = Read-Host "Commit message"
                git commit -m $message
                Write-Host "✓ Committed" -ForegroundColor Green
            }
        }
        
        # Push to GitHub
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        Write-Host ""
        Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Visit: https://vercel.com/new" -ForegroundColor White
        Write-Host "2. Select your TaskLynk repository" -ForegroundColor White
        Write-Host "3. Copy these environment variables from .env:" -ForegroundColor Yellow
        
        # Read and display env vars (for copy-paste)
        Write-Host ""
        Write-Host "Environment Variables to Add:" -ForegroundColor Yellow
        Write-Host "================================" -ForegroundColor Yellow
        
        $envContent = Get-Content ".env" -Raw
        Write-Host $envContent -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "4. Paste them into Vercel's Environment Variables section" -ForegroundColor White
        Write-Host "5. Click 'Deploy'" -ForegroundColor White
        Write-Host ""
        Write-Host "✨ Your site will be live in 2-3 minutes!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "📦 Deploying to Render" -ForegroundColor Cyan
        Write-Host "======================"
        Write-Host ""
        
        # Push to GitHub
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        Write-Host ""
        Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Visit: https://render.com" -ForegroundColor White
        Write-Host "2. Click 'New' → 'Web Service'" -ForegroundColor White
        Write-Host "3. Connect your GitHub repository" -ForegroundColor White
        Write-Host ""
        Write-Host "Configure as follows:" -ForegroundColor Yellow
        Write-Host "- Name: tasklynk-testing" -ForegroundColor White
        Write-Host "- Environment: Node" -ForegroundColor White
        Write-Host "- Build Command: npm install && npm run build" -ForegroundColor White
        Write-Host "- Start Command: npm start" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Add Environment Variables (copy from below):" -ForegroundColor Yellow
        Get-Content ".env" | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }
        Write-Host ""
        Write-Host "5. Click 'Create Web Service'" -ForegroundColor White
        Write-Host ""
        Write-Host "✨ Deployment will complete in 3-5 minutes!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "📦 Deploying to Railway" -ForegroundColor Cyan
        Write-Host "======================="
        Write-Host ""
        
        # Push to GitHub
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        Write-Host ""
        Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Visit: https://railway.app" -ForegroundColor White
        Write-Host "2. Click 'New Project' → 'Deploy from GitHub'" -ForegroundColor White
        Write-Host "3. Select your repository" -ForegroundColor White
        Write-Host "4. Click 'Deploy Now'" -ForegroundColor White
        Write-Host ""
        Write-Host "5. Add Environment Variables:" -ForegroundColor Yellow
        Write-Host "   - Click 'Variables' in dashboard" -ForegroundColor White
        Write-Host "   - Click 'RAW Editor'" -ForegroundColor White
        Write-Host "   - Paste content below:" -ForegroundColor Yellow
        Get-Content ".env" | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }
        Write-Host ""
        Write-Host "Railway will auto-detect Next.js and configure." -ForegroundColor Green
        Write-Host "✨ Deployment will complete in 2-3 minutes!" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "📦 Deploying to Replit (Quick)" -ForegroundColor Green
        Write-Host "=============================="
        Write-Host ""
        
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Push code to GitHub" -ForegroundColor White
        Write-Host "2. Visit: https://replit.com" -ForegroundColor White
        Write-Host "3. Click 'Import' and paste your repo URL" -ForegroundColor White
        Write-Host "4. Click 'Import from GitHub'" -ForegroundColor White
        Write-Host "5. Add environment variables in 'Secrets' tab:" -ForegroundColor Yellow
        Get-Content ".env" | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }
        Write-Host ""
        Write-Host "6. Click 'Run'" -ForegroundColor White
        Write-Host ""
        Write-Host "✨ Ready to test in 1-2 minutes!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host ""
        Write-Host "📦 Self-Hosted VPS Deployment" -ForegroundColor Cyan
        Write-Host "=============================="
        Write-Host ""
        
        $serverIp = Read-Host "Enter VPS IP address"
        $username = Read-Host "Enter SSH username (default: root)"
        if (-not $username) { $username = "root" }
        
        Write-Host ""
        Write-Host "Creating deployment script for $username@$serverIp..." -ForegroundColor Yellow
        Write-Host ""
        
        $deployScript = @"
#!/bin/bash
set -e

echo "📦 Setting up TaskLynk on VPS..."

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs npm

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /opt/tasklynk
cd /opt/tasklynk

# Clone repository
git clone https://github.com/mdtechpoint25-prog/TaskLynk-WebSite-Academic.git .

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start 'npm start' --name tasklynk
pm2 save
pm2 startup
pm2 restart tasklynk

# Show instructions
echo ""
echo "✅ TaskLynk deployed successfully!"
echo "📍 Running on: http://localhost:5000"
echo ""
echo "Next steps:"
echo "1. Setup Nginx reverse proxy (optional)"
echo "2. Add your domain (optional)"
echo "3. Test at http://<your-server-ip>:5000"
echo ""
echo "View logs: pm2 logs tasklynk"
echo "Stop app: pm2 stop tasklynk"
echo "Restart app: pm2 restart tasklynk"
"@
        
        Write-Host "Script ready. Paste this on your VPS:" -ForegroundColor Yellow
        Write-Host $deployScript
        Write-Host ""
        Write-Host "Or run commands manually on VPS via SSH." -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "📝 Test the deployment:" -ForegroundColor Yellow
        Write-Host "1. SSH into VPS: ssh $username@$serverIp" -ForegroundColor White
        Write-Host "2. Check logs: pm2 logs tasklynk" -ForegroundColor White
        Write-Host "3. Visit: http://$serverIp:5000" -ForegroundColor White
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📚 Need help?" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Read: DEPLOYMENT_GUIDE_REMOTE_TESTING.md" -ForegroundColor White
Write-Host "2. Check: CPP_IMPLEMENTATION_SUMMARY.md" -ForegroundColor White
Write-Host "3. View: Next.js docs @ https://nextjs.org/docs" -ForegroundColor White
Write-Host ""
Write-Host "🧪 After deployment, test:" -ForegroundColor Green
Write-Host "  - Login pages (all roles)" -ForegroundColor White
Write-Host "  - Create orders" -ForegroundColor White
Write-Host "  - Upload files" -ForegroundColor White
Write-Host "  - Process payments" -ForegroundColor White
Write-Host "  - View CPP progress" -ForegroundColor White
Write-Host ""
Write-Host "✨ Good luck with your testing! 🚀" -ForegroundColor Green

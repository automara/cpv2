# Deployment Guide

This project is configured for deployment to Railway with automatic staging and production environments.

## Quick Start

### 1. Connect to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Link to your project
railway link
```

### 2. Set Up Environments

Railway will create two environments:
- **Production** - Deploys from `main` branch
- **Staging** - Create manually, deploys from `staging` branch

```bash
# Create staging environment
railway environment create staging
```

### 3. Configure Environment Variables

Go to Railway Dashboard → Your Project → Variables

**For Staging:**
- Copy variables from `.env.staging`
- Replace placeholder values with real staging credentials
- Set `NODE_ENV=staging`

**For Production:**
- Copy variables from `.env.production`
- Replace with production-grade secrets
- Set `NODE_ENV=production`

### 4. Set Up Branch Deployments

Railway Dashboard → Settings → Environments:

**Production Environment:**
- Branch: `main`
- Auto-deploy: Enabled

**Staging Environment:**
- Branch: `staging`
- Auto-deploy: Enabled

## Deployment Workflow

### Local Development

```bash
# Your Conductor workspace
npm run dev
# → http://localhost:3000 (or $CONDUCTOR_PORT)

# Make changes, test locally
```

### Deploy to Staging

```bash
# Commit your changes
git add .
git commit -m "feat: new feature"

# Create or update staging branch
git push origin HEAD:staging --force

# Railway auto-deploys
# Check: https://cp-v2-staging.up.railway.app
```

### Deploy to Production

```bash
# Create PR from your branch to main
gh pr create --base main --title "feat: new feature"

# After review and approval, merge
# Railway auto-deploys to production
# Check: https://cp-v2.up.railway.app
```

## URLs

Your project has three environments:

| Environment | URL | Branch | Auto-Deploy |
|-------------|-----|--------|-------------|
| Localhost | http://localhost:3000 | current | - |
| Staging | https://cp-v2-staging.up.railway.app | staging | ✅ |
| Production | https://cp-v2.up.railway.app | main | ✅ |

**View URLs anytime:**
```bash
./.claude/helpers/show-urls.sh
```

## Railway Commands

```bash
# View logs
railway logs

# View logs for specific environment
railway logs --environment staging

# Open Railway dashboard
railway open

# Run command in Railway environment
railway run npm run migrate

# Deploy manually (if auto-deploy disabled)
railway up
```

## Environment Variables

### Required Variables

Set these in Railway UI for both staging and production:

```bash
# Application
NODE_ENV=production  # or staging
PORT=  # Railway sets this automatically

# Database
DATABASE_URL=  # Set in Railway

# API URLs
API_URL=https://cp-v2.up.railway.app
```

### Optional Variables

Add based on your project needs:

```bash
# Third-party services
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=

# Security
SESSION_SECRET=  # Generate 32+ character random string
CORS_ORIGIN=

# Feature flags
ENABLE_DEBUG_LOGGING=false
```

## Custom Domains

### Add Custom Domain to Production

1. Railway Dashboard → Production Environment → Settings
2. Click "Generate Domain" or "Custom Domain"
3. Add CNAME record to your DNS:
   - Name: `www` (or `@` for root)
   - Value: `[your-project].up.railway.app`
4. Update `.project.json`:
   ```json
   {
     "deployment": {
       "environments": {
         "production": {
           "url": "https://yourdomain.com"
         }
       }
     }
   }
   ```

## Troubleshooting

### Deployment Failed

```bash
# Check build logs
railway logs --environment staging

# Common issues:
# - Missing environment variables
# - Build errors
# - Port configuration
```

### Environment Variables Not Loading

1. Check Railway Dashboard → Variables tab
2. Verify all required variables are set
3. Restart deployment: Railway Dashboard → Deployments → Redeploy

### Wrong Port

Railway automatically sets `PORT` environment variable. Use it in your app:

```javascript
// server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

### Database Connection Issues

1. Verify `DATABASE_URL` is set in Railway
2. Check Railway → Database service is running
3. Test connection:
   ```bash
   railway run node -e "console.log(process.env.DATABASE_URL)"
   ```

## Best Practices

### Before Deploying

- ✅ Test locally first
- ✅ Run tests: `npm test`
- ✅ Check build: `npm run build`
- ✅ Review changes: `git diff main`

### Staging Workflow

- Always deploy to staging first
- Test on staging URL before production
- Use staging for demos and QA

### Production Workflow

- Only merge to `main` via PR
- Require code review
- Tag releases: `git tag v1.0.0`
- Monitor logs after deployment

### Security

- ❌ Never commit secrets to Git
- ✅ Use different secrets for staging/production
- ✅ Rotate secrets regularly
- ✅ Use Railway's secret variables for sensitive data

## Monitoring

### View Application Logs

```bash
# Real-time logs
railway logs --follow

# Filter by environment
railway logs --environment production --follow

# Last 100 lines
railway logs --tail 100
```

### Metrics

Railway Dashboard → Metrics shows:
- CPU usage
- Memory usage
- Network traffic
- Request count

## Rollback

If deployment breaks production:

```bash
# Option 1: Revert via Railway Dashboard
# Deployments → Find working deployment → Redeploy

# Option 2: Revert via Git
git revert <commit-sha>
git push origin main
# Railway auto-deploys the revert
```

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- Project configuration: `.project.json`
- Railway configuration: `railway.json`

---

**Generated by keithstart**
**Last Updated:** 2025-11-16

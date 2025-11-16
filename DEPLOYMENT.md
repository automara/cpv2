# CurrentPrompt v3.0 - Railway Deployment Guide

## Quick Deployment Steps

### 1. Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select repository: `automara/cpv2`
4. Select branch: `automara/cp-v3-foundation` (or `main` after merge)

### 2. Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```bash
# REQUIRED - Server
NODE_ENV=production
PORT=3000

# REQUIRED - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# REQUIRED - AI Services
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-proj-...

# RECOMMENDED - Security
API_KEY=your_generated_secret_key
ALLOWED_ORIGINS=https://your-app.railway.app,https://yourdomain.com

# OPTIONAL - Webflow (Phase 3)
WEBFLOW_API_TOKEN=...
WEBFLOW_SITE_ID=...
WEBFLOW_COLLECTION_ID=...
```

**Generate a secure API_KEY:**
```bash
openssl rand -hex 32
```

### 3. Verify Deployment

Railway will automatically:
1. Detect Node.js 20 (via `.nvmrc` and `nixpacks.toml`)
2. Run `npm install` (using `package-lock.json`)
3. Run `npm run build` (TypeScript compilation)
4. Start with `npm start`

**Expected build output:**
```
✓ Node 20.19.0 detected
✓ Installing dependencies
✓ Building TypeScript
✓ Frontend not yet created, skipping build (expected)
✓ Starting server
```

### 4. Test Deployment

Once deployed, Railway will provide a URL like: `https://currentprompt.up.railway.app`

Test the health endpoint:
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T23:30:00.000Z",
  "environment": "production",
  "version": "3.0.0"
}
```

Test the root endpoint:
```bash
curl https://your-app.up.railway.app/
```

Expected response:
```json
{
  "name": "CurrentPrompt API",
  "version": "3.0.0",
  "description": "Automated markdown publishing platform with AI-generated metadata",
  "endpoints": {
    "health": "/health",
    "modules": "/api/modules",
    "testAgents": "/api/test-agents"
  }
}
```

## Troubleshooting

### Build Fails with "crypto.hash is not a function"
**Cause:** Railway using Node 18 instead of 20
**Fix:** Already handled by `.nvmrc` and `nixpacks.toml`

### "Missing Supabase credentials" error
**Cause:** Environment variables not set
**Fix:** Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway Variables

### CORS errors
**Cause:** Frontend domain not in ALLOWED_ORIGINS
**Fix:** Add your Railway app URL to ALLOWED_ORIGINS variable

### Rate limiting too strict
**Cause:** Not authenticated
**Fix:** Include `Authorization: Bearer YOUR_API_KEY` header in requests

## Supabase Setup (Required before deployment)

1. Create new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy:
   - `URL` → SUPABASE_URL
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY (NOT anon key!)

4. Run migrations in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents of migrations/001_create_schema.sql
   -- Copy and paste contents of migrations/002_add_agent_fields.sql
   -- Copy and paste contents of migrations/003_fix_vector_dimensions.sql
   ```

5. Create storage bucket:
   - Go to Storage → Create bucket
   - Name: `modules`
   - Public: Yes
   - Allowed file types: Any

## Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] Root endpoint shows API info
- [ ] Supabase migrations executed successfully
- [ ] Storage bucket created and public
- [ ] Environment variables all set (11 required, 3 optional)
- [ ] API_KEY authentication working (if enabled)
- [ ] CORS working from allowed origins
- [ ] Railway logs show no errors

## Next Steps

After successful deployment:

1. **Merge to main:**
   ```bash
   git checkout main
   git merge automara/cp-v3-foundation
   git push origin main
   ```

2. **Set up Railway auto-deploy:**
   - Railway → Settings → Deploy
   - Enable "Auto Deploy" for `main` branch

3. **Phase 2: AI Agent Pipeline**
   - Implement 7 specialized agents
   - Test with sample markdown content
   - Deploy and verify cost targets (~$0.05/module)

4. **Phase 3-7:** Continue implementation per PRD

## Monitoring

Watch Railway logs for:
- Server startup messages
- Request logs
- Error messages
- Rate limit violations

## Cost Estimate

**Monthly costs (before AI processing):**
- Railway Hobby Plan: ~$5/month
- Supabase Free Tier: $0 (1GB storage, 500K rows)
- **Total:** ~$5/month

**AI Processing costs (Phase 2+):**
- ~$0.05 per module processed
- 100 modules = $5
- 1000 modules = $50

## Support

Issues? Check:
1. Railway build logs
2. Railway deployment logs
3. Supabase database logs
4. This troubleshooting guide

---

**Last Updated:** 2025-11-16
**Phase:** 1 (Foundation)
**Status:** Ready for deployment

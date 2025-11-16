# Claude Code Deployment Instructions

**IMPORTANT:** These instructions are for Claude Code to follow when working on this project.

## URL Display Rules

After completing any of these actions, ALWAYS display project URLs:

1. **After code changes that affect the running application:**
   - API endpoint changes
   - Frontend component updates
   - Database schema changes
   - Configuration changes
   - Build script modifications

2. **After deployment-related commands:**
   - Git push to staging
   - Git merge to main
   - Railway deployments
   - Environment variable changes

3. **When explicitly requested by the user**

## How to Display URLs

### Automatic Display

Run this helper script and include output in your response:

```bash
./.claude/helpers/show-urls.sh
```

### Manual Display Format

If the helper script is unavailable, format URLs like this:

```
✅ Changes complete!

🔗 Project URLs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Localhost:   http://localhost:3000
   Staging:     https://[project]-staging.up.railway.app
   Production:  https://[project].up.railway.app

Click any URL to open in browser →
```

### Reading URLs from .project.json

Extract URLs from the project configuration:

```bash
# Get localhost URL
jq -r '.deployment.environments.development.url' .project.json

# Get staging URL
jq -r '.deployment.environments.staging.url' .project.json

# Get production URL
jq -r '.deployment.environments.production.url' .project.json
```

## Deployment Context

### When Working in Conductor Workspace

User is in: `.conductor/[workspace-name]`

Default to showing **localhost URL** prominently since they're developing locally.

### After Pushing to Staging

When you help push to staging branch:

```bash
git push origin HEAD:staging --force
```

Show **staging URL** prominently and remind them Railway is auto-deploying.

### After Merging to Main

After PR is merged to main, show **production URL** prominently and note the deployment status.

## Example Responses

### After Making Code Changes

```
I've updated the API endpoint to handle the new user authentication flow.

Changes made:
- Added `/api/auth/verify` endpoint
- Updated middleware to validate JWT tokens
- Added error handling for expired tokens

✅ Changes complete!

🔗 Test the changes:
   Localhost:   http://localhost:3000/api/auth/verify

To deploy to staging:
   git add . && git commit -m "feat(auth): add token verification"
   git push origin HEAD:staging --force

Then test at: https://myapp-staging.up.railway.app/api/auth/verify
```

### After Deploying to Staging

```
✅ Pushed to staging branch!

Railway is now deploying your changes...

🔗 Staging URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   https://myapp-staging.up.railway.app

View deployment logs:
   railway logs --environment staging --follow

Once verified on staging, create PR to main:
   gh pr create --base main
```

### After Building

```
✅ Build successful!

🔗 Project URLs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Localhost:   http://localhost:3000
   Staging:     https://myapp-staging.up.railway.app
   Production:  https://myapp.up.railway.app

Run locally: npm start
```

## Environment Detection

Check which environment user is working in:

```bash
# Check if in Conductor workspace
if [ -n "$CONDUCTOR_WORKSPACE_NAME" ]; then
    echo "Working in Conductor workspace: $CONDUCTOR_WORKSPACE_NAME"
fi

# Check current branch
BRANCH=$(git branch --show-current)

# Check if Railway is configured
if command -v railway >/dev/null 2>&1; then
    echo "Railway CLI available"
fi
```

## URL Validation

Before displaying URLs, verify they're configured:

```bash
# Check if .project.json exists
if [ -f ".project.json" ]; then
    # URLs are configured
    # Display them
else
    # Fallback to default localhost
    echo "Localhost: http://localhost:3000"
fi
```

## Port Handling

Always respect the PORT environment variable:

```javascript
// Show in responses:
const PORT = process.env.PORT ||
             process.env.CONDUCTOR_PORT ||
             3000;

console.log(`Server: http://localhost:${PORT}`);
```

## Clickable Links

Format URLs so they're clickable in terminal:

- Use full URLs with protocol: `https://...`
- No markdown formatting (already clickable in terminal)
- Keep URLs on their own line
- Add visual separator for clarity

## When NOT to Show URLs

Skip URL display when:
- Only reading files (no changes made)
- Running analysis or searches
- Answering questions about code
- Making documentation-only changes

## Integration with Git Workflow

### Feature Branch → Staging

```bash
# After committing
git push origin HEAD:staging --force

# Then show:
✅ Deployed to staging!
🔗 https://[project]-staging.up.railway.app
```

### Main Branch → Production

```bash
# After PR merge
# Show:
✅ Merged to main!
🔗 Production deploying: https://[project].up.railway.app
Monitor: railway logs --environment production --follow
```

## Railway Status

If Railway CLI is available, optionally include deployment status:

```bash
# Check deployment status
railway status

# Include in response if relevant
```

## Error Handling

If URLs can't be determined:

```
✅ Changes complete!

🔗 URLs: Run ./.claude/helpers/show-urls.sh to see all environments

Or check .project.json for configured URLs.
```

---

**Remember:** The goal is to make it effortless for the user to test their changes. Always provide the most relevant URL for the current context.

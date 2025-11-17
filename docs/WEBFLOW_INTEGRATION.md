# Webflow Integration Guide

**Phase 4: Webflow CMS Sync**

## Overview

The Webflow integration allows you to automatically sync CurrentPrompt modules to your Webflow CMS collection. This enables you to publish your AI-generated content directly to your Webflow site with one API call.

## Features

- ✅ **Automatic Field Mapping** - Maps CurrentPrompt modules to Webflow CMS fields
- ✅ **Create & Update** - Automatically creates or updates items based on existing `webflow_id`
- ✅ **Auto-Publish** - Optionally publish items to live site when status is "published"
- ✅ **Batch Sync** - Sync multiple modules with rate limiting protection
- ✅ **Health Checks** - Verify Webflow API connectivity
- ✅ **Error Handling** - Graceful failure with detailed error messages
- ✅ **Webhook Support** - Placeholder for bi-directional sync (future)

## Setup

### 1. Get Webflow API Credentials

1. Log in to [Webflow](https://webflow.com)
2. Go to **Account Settings** → **Integrations** → **API Access**
3. Generate a new API token
4. Copy your API token
5. Get your Site ID from the Webflow Dashboard
6. Get your Collection ID:
   - Go to your site's CMS Collections
   - Open the collection you want to sync to
   - The Collection ID is in the URL: `webflow.com/design/YOUR_SITE/cms/collections/COLLECTION_ID`

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Webflow Configuration
WEBFLOW_API_TOKEN=your_api_token_here
WEBFLOW_SITE_ID=your_site_id_here
WEBFLOW_COLLECTION_ID=your_collection_id_here
```

### 3. Configure Your Webflow Collection Schema

Your Webflow CMS collection should have these fields (customize as needed):

**Required Fields:**
- `name` (Plain Text) - Module title
- `slug` (Plain Text) - URL slug

**Recommended Fields:**
- `category` (Plain Text or Option) - Content category
- `tags` (Plain Text) - Comma-separated tags
- `summary-short` (Plain Text) - Short summary
- `summary-medium` (Rich Text) - Medium summary
- `summary-long` (Rich Text) - Long summary
- `meta-title` (Plain Text) - SEO title
- `meta-description` (Plain Text) - SEO description
- `seo-keywords` (Plain Text) - Comma-separated keywords
- `schema-json` (Plain Text) - JSON-LD schema
- `image-prompt` (Plain Text) - Image generation prompt
- `quality-score` (Number) - Quality score (0-100)
- `source-url` (Link) - Original source URL
- `source-label` (Plain Text) - Source label
- `currentprompt-id` (Plain Text) - CurrentPrompt module ID
- `version` (Number) - Version number

**Note:** You can customize the field mapping in `src/services/webflowService.ts` → `mapModuleToWebflowItem()`

### 4. Verify Configuration

Test your Webflow integration:

```bash
curl http://localhost:3000/api/webflow/health
```

Expected response:
```json
{
  "configured": true,
  "accessible": true
}
```

## API Endpoints

### Health Check

**GET** `/api/webflow/health`

Check if Webflow is configured and accessible.

**Response:**
```json
{
  "configured": true,
  "accessible": true
}
```

---

### Sync Single Module

**POST** `/api/webflow/sync/:id`

Sync a single module to Webflow CMS.

**Parameters:**
- `id` (path) - Module ID or slug

**Body:**
```json
{
  "autoPublish": true,     // Auto-publish if status is "published" (default: true)
  "forceCreate": false     // Force create new item even if webflow_id exists (default: false)
}
```

**Response:**
```json
{
  "success": true,
  "module": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Understanding React Hooks",
    "slug": "understanding-react-hooks"
  },
  "webflow": {
    "id": "64f3a2b1c9d4e5f6a7b8c9d0",
    "action": "created"
  },
  "message": "Module created successfully and published"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/webflow/sync/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"autoPublish": true}'
```

---

### Batch Sync Modules

**POST** `/api/webflow/sync-batch`

Sync multiple modules to Webflow CMS.

**Body:**
```json
{
  "autoPublish": true,           // Auto-publish if status is "published" (default: true)
  "delayBetweenRequests": 500,   // Delay between requests in ms (default: 500, max: 5000)
  "category": "Development",     // Optional: Filter by category
  "status": "published",         // Optional: Filter by status
  "limit": 50                    // Optional: Max modules to sync (default: all, max: 100)
}
```

**Response:**
```json
{
  "total": 10,
  "succeeded": 9,
  "failed": 1,
  "results": [
    {
      "success": true,
      "webflowId": "64f3a2b1c9d4e5f6a7b8c9d0",
      "action": "created",
      "message": "Module created successfully and published"
    },
    // ... more results
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/webflow/sync-batch \
  -H "Content-Type: application/json" \
  -d '{
    "autoPublish": true,
    "category": "Development",
    "status": "published",
    "limit": 10
  }'
```

---

### Get Sync Status

**GET** `/api/webflow/status/:id`

Check if a module has been synced to Webflow.

**Parameters:**
- `id` (path) - Module ID or slug

**Response:**
```json
{
  "module": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Understanding React Hooks",
    "slug": "understanding-react-hooks",
    "status": "published"
  },
  "webflow": {
    "synced": true,
    "webflowId": "64f3a2b1c9d4e5f6a7b8c9d0"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/webflow/status/understanding-react-hooks
```

---

### Webhook Handler (Future)

**POST** `/api/webflow/webhook`

Placeholder for handling Webflow webhooks (bi-directional sync).

**Note:** Not yet implemented. Will be used for syncing changes from Webflow back to CurrentPrompt.

## Workflows

### Workflow 1: Create and Publish Module

```bash
# 1. Create module with AI processing
curl -X POST http://localhost:3000/api/modules/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Article",
    "markdownContent": "# My Article\n\nGreat content here..."
  }'

# Response includes module ID
# {"module": {"id": "550e8400..."}}

# 2. Update status to published
curl -X PATCH http://localhost:3000/api/modules/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'

# 3. Sync to Webflow (will auto-publish)
curl -X POST http://localhost:3000/api/webflow/sync/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"autoPublish": true}'
```

### Workflow 2: Batch Publish All Published Modules

```bash
# Sync all published modules to Webflow
curl -X POST http://localhost:3000/api/webflow/sync-batch \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "autoPublish": true,
    "delayBetweenRequests": 500
  }'
```

### Workflow 3: Update Module and Re-sync

```bash
# 1. Update module content
curl -X PATCH http://localhost:3000/api/modules/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "summary_short": "Updated summary",
    "tags": ["react", "hooks", "tutorial"]
  }'

# 2. Re-sync to Webflow (will update existing item)
curl -X POST http://localhost:3000/api/webflow/sync/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"autoPublish": true}'
```

## Field Mapping

The default field mapping from CurrentPrompt modules to Webflow is:

| CurrentPrompt Field | Webflow Field | Type |
|---------------------|---------------|------|
| `title` | `name` | Plain Text |
| `slug` | `slug` | Plain Text |
| `category` | `category` | Plain Text |
| `tags` (array) | `tags` | Plain Text (comma-separated) |
| `summary_short` | `summary-short` | Plain Text |
| `summary_medium` | `summary-medium` | Rich Text |
| `summary_long` | `summary-long` | Rich Text |
| `meta_title` | `meta-title` | Plain Text |
| `meta_description` | `meta-description` | Plain Text |
| `seo_keywords` (array) | `seo-keywords` | Plain Text (comma-separated) |
| `schema_json` (object) | `schema-json` | Plain Text (JSON string) |
| `image_prompt` | `image-prompt` | Plain Text |
| `quality_score` | `quality-score` | Number |
| `source_url` | `source-url` | Link |
| `source_label` | `source-label` | Plain Text |
| `id` | `currentprompt-id` | Plain Text |
| `latest_version` | `version` | Number |

### Customizing Field Mapping

To customize the field mapping, edit `src/services/webflowService.ts`:

```typescript
export function mapModuleToWebflowItem(module: Module): WebflowItem {
  return {
    id: module.webflow_id,
    fieldData: {
      // Customize these fields to match your Webflow collection
      name: module.title,
      slug: module.slug,

      // Add your custom fields here
      "custom-field": module.some_field,

      // ...
    },
    isDraft: module.status === "draft",
    isArchived: module.status === "archived",
  };
}
```

## Rate Limiting

The Webflow API has rate limits. To avoid hitting these limits:

1. **Single Sync:** No delay needed
2. **Batch Sync:** Default 500ms delay between requests
   - Adjust with `delayBetweenRequests` parameter
   - Maximum recommended: 2 requests/second (500ms delay)
   - Conservative: 1 request/second (1000ms delay)

## Error Handling

All Webflow sync operations include comprehensive error handling:

**Common Errors:**

1. **Not Configured**
   ```json
   {
     "success": false,
     "action": "skipped",
     "message": "Webflow integration is not configured"
   }
   ```
   **Solution:** Add Webflow credentials to `.env`

2. **Module Not Found**
   ```json
   {
     "error": "Module not found",
     "moduleId": "invalid-id"
   }
   ```
   **Solution:** Check module ID/slug is correct

3. **API Error**
   ```json
   {
     "success": false,
     "action": "error",
     "error": "Failed to create Webflow item: 401 - Unauthorized"
   }
   ```
   **Solution:** Check your Webflow API token is valid

4. **Field Mismatch**
   ```json
   {
     "success": false,
     "action": "error",
     "error": "Failed to create Webflow item: 400 - Field 'name' is required"
   }
   ```
   **Solution:** Ensure field mapping matches your Webflow collection schema

## Best Practices

1. **Test First**
   - Always test with a single module before batch syncing
   - Use `GET /api/webflow/health` to verify configuration

2. **Use Draft Status**
   - Create modules with `status: "draft"` initially
   - Review in Webflow before setting to `status: "published"`

3. **Monitor Quality Scores**
   - Only sync modules with quality scores >= 70
   - The system enforces this during module creation

4. **Batch Sync Carefully**
   - Start with small batches (`limit: 10`)
   - Use appropriate delays to avoid rate limits
   - Monitor the results array for failures

5. **Keep Webflow IDs**
   - Never manually change `webflow_id` in the database
   - Use `forceCreate: true` if you need to recreate an item

6. **Backup Before Bulk Operations**
   - Export your Webflow collection before batch syncing
   - Test with a duplicate collection first

## Troubleshooting

### Issue: "Webflow integration is not configured"

**Cause:** Missing or invalid environment variables

**Solution:**
```bash
# Check your .env file
cat .env | grep WEBFLOW

# Should show:
# WEBFLOW_API_TOKEN=your_token
# WEBFLOW_SITE_ID=your_site_id
# WEBFLOW_COLLECTION_ID=your_collection_id

# Restart server after updating .env
npm start
```

### Issue: "Failed to create Webflow item: 401"

**Cause:** Invalid or expired API token

**Solution:**
1. Generate a new API token in Webflow
2. Update `WEBFLOW_API_TOKEN` in `.env`
3. Restart server

### Issue: "Failed to create Webflow item: 400"

**Cause:** Field mismatch between CurrentPrompt and Webflow

**Solution:**
1. Check your Webflow collection schema
2. Update field mapping in `mapModuleToWebflowItem()`
3. Ensure required fields are present

### Issue: Modules not publishing to live site

**Cause:** `autoPublish: false` or `status !== "published"`

**Solution:**
1. Set module `status` to `"published"`
2. Use `autoPublish: true` in sync request
3. Manually publish in Webflow if needed

## Future Enhancements

- [ ] Bi-directional sync via webhooks
- [ ] Automatic thumbnail generation and upload
- [ ] Webflow Designer API integration
- [ ] Scheduled batch sync
- [ ] Sync status tracking table
- [ ] Conflict resolution for concurrent edits
- [ ] Image asset management

## API Reference

For complete API documentation, see:
- Main API docs: [README.md](../README.md)
- Webflow CMS API: [developers.webflow.com/data/v2.0.0](https://developers.webflow.com/data/v2.0.0)

## Support

For issues or questions:
1. Check this documentation
2. Review Webflow API status: [status.webflow.com](https://status.webflow.com)
3. Check server logs for detailed error messages
4. Test with single modules before batch operations

---

**Last Updated:** 2025-11-16
**Version:** 4.0.0 (Phase 4 Complete)

# Power Automate Email Configuration Guide

This guide explains how to configure Power Automate for sending interview invitation emails to assignees.

## Overview

The application uses Microsoft Power Automate to send emails. When you select assignees and click "Send Email", the system calls your Power Automate flow with the email details.

## Power Automate Flow Setup

### 1. Flow URL Configuration

The Power Automate flow URL is configured in one of two ways:

**Option 1: Use Default URL (Hardcoded)**
The default URL is already set in the code:
```
https://8250a9bfeb76ef4cba38b14a0bb011.0c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c23211e1facb4777976e1d4443b2dd11/triggers/manual/paths/invoke?api-version=1
```

**Option 2: Use Environment Variable (Recommended)**
Add to your `.env.local` or `.env` file:
```env
POWER_AUTOMATE_FLOW_URL=https://your-flow-url-here
```

### 2. Authentication Configuration

**If your flow requires authentication**, you need to provide an OAuth access token:

```env
POWER_AUTOMATE_ACCESS_TOKEN=your-oauth-access-token
```

**Option A: Allow Anonymous Access (Easiest)**
1. Go to your Power Automate flow
2. Click on the HTTP Request trigger
3. Under "Settings", enable "Allow anonymous HTTP requests"
4. Save and publish the flow
5. No access token needed!

**Option B: Use OAuth Token (More Secure)**
If you need authentication, you'll need to:
1. Get an OAuth token from Azure AD
2. Add it to your environment variables
3. The token will be sent as `Authorization: Bearer {token}` header

### 3. Power Automate Flow JSON Schema

Your Power Automate flow must accept this JSON structure:

```json
{
  "emailMeta": {
    "to": "recipient@email.com",
    "subject": "Email Subject",
    "body": "Email body (HTML supported)"
  }
}
```

### 4. Power Automate Flow Steps

Your flow should:
1. **Trigger**: HTTP Request (Manual trigger)
   - Method: POST
   - Request Body JSON Schema:
     ```json
     {
       "type": "object",
       "properties": {
         "emailMeta": {
           "type": "object",
           "properties": {
             "to": { "type": "string" },
             "subject": { "type": "string" },
             "body": { "type": "string" }
           }
         }
       }
     }
     ```

2. **Action**: Send an email (V2) or Office 365 Outlook - Send an email
   - To: `triggerBody()?['emailMeta']?['to']`
   - Subject: `triggerBody()?['emailMeta']?['subject']`
   - Body: `triggerBody()?['emailMeta']?['body']`
   - Is HTML: Yes (to support HTML email formatting)

## Testing Your Configuration

1. **Test the Flow in Power Automate**:
   - Go to your Power Automate flow
   - Click "Test" → "Manually"
   - Use this test JSON:
     ```json
     {
       "emailMeta": {
         "to": "test@example.com",
         "subject": "Test Email",
         "body": "<h1>Test</h1><p>This is a test email.</p>"
       }
     }
     ```

2. **Test from the Application**:
   - Select assignees in the dashboard
   - Click "Send Email" button
   - Check the server logs for any errors
   - Verify emails are received

## Email Content

The application automatically generates:
- **Subject**: `Interview Invitation: {Interview Name}`
- **Body**: HTML formatted email with:
  - Personalized greeting
  - Interview details (name, description, duration)
  - "Start Interview" button linking to the interview
  - Fallback text link

## Troubleshooting

### Error: "Power Automate API returned 401"
- Check if your Power Automate flow requires authentication
- Verify the flow URL is correct
- Ensure the flow is enabled and published

### Error: "Power Automate API returned 404"
- Verify the flow URL is correct
- Check if the flow has been deleted or moved
- Ensure the flow trigger is set to "Allow anonymous HTTP requests" if needed

### Error: "Power Automate API returned 400"
- Check the JSON structure matches the flow's expected schema
- Verify all required fields are being sent
- Review the flow's request body schema

### Emails not being received
- Check spam/junk folders
- Verify the recipient email addresses are correct
- Check Power Automate flow run history for errors
- Review server logs for detailed error messages

## Security Best Practices

1. **Use Environment Variables**: Store the flow URL in `.env.local` (not committed to git)
2. **Flow Permissions**: Set appropriate permissions on your Power Automate flow
3. **HTTPS Only**: Ensure your flow URL uses HTTPS
4. **Rate Limiting**: Be aware of Power Automate's rate limits
5. **Error Handling**: Monitor flow runs for failures

## Flow URL Format

Power Automate flow URLs typically look like:
```
https://{environment-id}.{region}.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/{workflow-id}/triggers/manual/paths/invoke?api-version=1
```

## Getting Your Flow URL

1. Go to https://make.powerautomate.com
2. Open your flow
3. Click on the trigger (HTTP Request)
4. Copy the **complete "HTTP POST URL"** - this should include the `sig=` parameter (SAS token)
5. The URL should look like:
   ```
   https://.../invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_SAS_TOKEN_HERE
   ```
6. Use this **complete URL** in your environment variable

**Important**: Make sure you copy the **entire URL** including the `sig=` parameter at the end. This is your Shared Access Signature token.

## Example Environment Configuration

**Option 1: Anonymous Access (Recommended for testing)**
```env
# Power Automate Configuration
POWER_AUTOMATE_FLOW_URL=https://8250a9bfeb76ef4cba38b14a0bb011.0c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c23211e1facb4777976e1d4443b2dd11/triggers/manual/paths/invoke?api-version=1
# No access token needed if flow allows anonymous access
```

**Option 2: With OAuth Authentication**
```env
# Power Automate Configuration
POWER_AUTOMATE_FLOW_URL=https://8250a9bfeb76ef4cba38b14a0bb011.0c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c23211e1facb4777976e1d4443b2dd11/triggers/manual/paths/invoke?api-version=1
POWER_AUTOMATE_ACCESS_TOKEN=your-oauth-access-token-here
```

## Fixing 401 Authentication Error

If you're getting a 401 error, you have two options:

### Solution 1: Enable Anonymous Access (Easiest)

1. Open your Power Automate flow in https://make.powerautomate.com
2. Click on the **HTTP Request** trigger
3. Click on **Settings** (gear icon)
4. Toggle **"Allow anonymous HTTP requests"** to **ON**
5. Click **Save**
6. **Publish** the flow
7. Try sending emails again - no access token needed!

### Solution 2: Use Shared Access Signature (SAS) Token

If your flow requires Shared Access Signature authentication:

1. **Get the complete URL with SAS token**:
   - Open your Power Automate flow
   - Click on the HTTP Request trigger
   - Copy the **complete HTTP POST URL** (it should include `sig=` parameter)
   - The URL will look like: `https://.../invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_TOKEN`

2. **Option A: Use the complete URL** (Recommended)
   - The URL already contains the SAS token
   - Just use the complete URL in `POWER_AUTOMATE_FLOW_URL`
   - No additional token needed!

3. **Option B: Extract and use SAS token separately**
   - Extract the `sig=` value from the URL
   - Add to `.env.local`:
     ```env
     POWER_AUTOMATE_SAS_TOKEN=your-sas-token-value
     ```

### Solution 3: Get OAuth Access Token

If you need OAuth authentication:
1. Register an app in Azure AD
2. Get an access token using client credentials flow
3. Add the token to your environment variables:
   ```env
   POWER_AUTOMATE_ACCESS_TOKEN=your-oauth-token
   ```

**For most use cases, Solution 1 (Anonymous Access) or Solution 2 (SAS Token in URL) is recommended** as they're simpler.


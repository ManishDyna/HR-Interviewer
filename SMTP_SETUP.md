# SMTP Email Configuration Guide

This guide explains how to configure SMTP email settings for sending interview invitation emails to assignees.

## Required Environment Variables

Add the following variables to your `.env.local` or `.env` file:

```env
# Required SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Optional SMTP Configuration
SMTP_SECURE=false
SMTP_REJECT_UNAUTHORIZED=true
```

## SMTP Provider Examples

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

**Note:** For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an App Password (not your regular password)
3. Use the App Password as `SMTP_PASS`

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_SECURE=false
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
SMTP_SECURE=false
```

## Environment Variable Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMTP_HOST` | Yes | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | Yes | SMTP authentication username | `your-email@gmail.com` |
| `SMTP_PASS` | Yes | SMTP authentication password | `your-app-password` |
| `SMTP_FROM` | No | Email address to send from | `noreply@yourdomain.com` |
| `SMTP_SECURE` | No | Use SSL (true) or TLS (false) | `false` for port 587 |
| `SMTP_REJECT_UNAUTHORIZED` | No | Reject self-signed certificates | `true` (default) |

## Testing Your Configuration

After setting up your environment variables:

1. Restart your Next.js development server
2. Select assignees in the dashboard
3. Click "Send Email" button
4. Check the server logs for email sending status
5. Verify emails are received in the assignees' inboxes

## Troubleshooting

### Error: "SMTP configuration is incomplete"
- Make sure all required environment variables are set
- Check that variable names are correct (case-sensitive)
- Restart your server after adding environment variables

### Error: "Authentication failed"
- Verify your SMTP credentials are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check if 2-Step Verification is enabled (required for Gmail App Passwords)

### Error: "Connection timeout"
- Verify the SMTP_HOST and SMTP_PORT are correct
- Check your firewall/network settings
- Try a different port (587 for TLS, 465 for SSL)

### Emails not being received
- Check spam/junk folders
- Verify the recipient email addresses are correct
- Check SMTP provider's sending limits
- Review server logs for detailed error messages

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use App Passwords** instead of regular passwords when possible
3. **Use environment-specific credentials** (different for dev/staging/production)
4. **Rotate credentials regularly**
5. **Use TLS/SSL** encryption (ports 587 or 465)


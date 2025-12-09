# GitHub Actions Cron Job Setup

This workflow runs the daily problem generation cron job using GitHub Actions.

## Setup Instructions

### 1. Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

- `DATABASE_URL` - Your PostgreSQL connection string
- `RAPIDAPI_KEY` - Your RapidAPI key for Judge0
- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google AI API key

### 2. Schedule Configuration

The workflow is currently set to run daily at **2 AM UTC**. To change the schedule, edit `.github/workflows/generate-problem.yml` and modify the cron expression:

```yaml
schedule:
  - cron: "0 2 * * *" # Format: minute hour day month weekday
```

Cron format: `minute hour day-of-month month day-of-week`

- `0 2 * * *` = Daily at 2:00 AM UTC
- `0 0 * * *` = Daily at midnight UTC
- `0 14 * * *` = Daily at 2:00 PM UTC

### 3. Manual Trigger

You can manually trigger the workflow from the GitHub Actions tab:

1. Go to **Actions** tab in your repository
2. Select **Generate Daily Problem** workflow
3. Click **Run workflow** button

### 4. Test Locally

Before pushing, test the script locally:

```bash
# Make sure you have .env.local with the required variables
pnpm tsx scripts/generate-problem.ts
```

## Timeout

The workflow has a 30-minute timeout. If your job takes longer, increase it in the workflow file:

```yaml
timeout-minutes: 60 # Increase as needed
```

## Monitoring

- View workflow runs in the **Actions** tab
- Check logs for any errors
- The script will exit with code 0 on success, 1 on error

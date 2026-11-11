# 🚀 Cloudflare Free Deployment Guide – UDJOG C2C Services

This guide walks you through deploying the complete **Frontend, Backend REST API, and SQLite Database** to Cloudflare's **100% Free Tier**.

---

## 🎁 What Cloudflare Free Tier Gives You (Zero Cost)
- **Frontend + Backend API**: Cloudflare Workers (100,000 requests/day free, global CDN, automated HTTPS/SSL, custom domain support).
- **Database**: Cloudflare D1 Serverless SQLite (5,000,000 reads/day, 100,000 writes/day, 5 GB storage free).

---

## 📋 Prerequisites
1. A free Cloudflare account at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
2. Node.js (already installed on your machine).

---

## 🛠️ Step-by-Step Deployment (3 Easy Steps)

### Step 1: Open Terminal & Log in to Cloudflare
Open PowerShell or your terminal in the `UDJOGC2C` folder and run:

```bash
cd UDJOGC2C
npx wrangler login
```
> A browser window will open asking you to click **"Allow"** to authorize Wrangler on your free Cloudflare account.

---

### Step 2: Create Your Free Cloudflare D1 Database
In the same terminal, run:

```bash
npx wrangler d1 create udjog_db
```

Wrangler will output something like:
```json
[[d1_databases]]
binding = "DB"
database_name = "udjog_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

1. Copy the generated `database_id` string.
2. Open `UDJOGC2C/wrangler.jsonc` and replace `"REPLACE_WITH_YOUR_D1_DATABASE_ID"` with your real `database_id`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "udjog_db",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
]
```

---

### Step 3: Run SQL Schema & Deploy Live!

#### A. Seed database tables in Cloudflare D1:
```bash
npx wrangler d1 execute udjog_db --file=database/schema.sql --remote
```

#### B. Deploy everything to Cloudflare:
```bash
npx wrangler deploy
```

---

## 🎉 You're Live!
Wrangler will print your production URL:
```
Deployed udjog-c2c to: https://udjog-c2c.<your-username>.workers.dev
```

You can now visit:
- **Public Website**: `https://udjog-c2c.<your-username>.workers.dev`
- **Job Portal**: `https://udjog-c2c.<your-username>.workers.dev/jobs.html`
- **Candidate Registration**: `https://udjog-c2c.<your-username>.workers.dev/candidates.html`
- **Employer Job Post**: `https://udjog-c2c.<your-username>.workers.dev/employers.html`
- **Admin Dashboard**: `https://udjog-c2c.<your-username>.workers.dev/admin/login.html` *(Username: `admin`, Password: `udjog2026`)*

---

## 🔄 How to Redeploy After Changes
Whenever you make updates to the code:
```bash
npx wrangler deploy
```
Changes take effect globally in under 5 seconds!


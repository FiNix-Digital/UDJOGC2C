# 🚀 Cloudflare Deployment – UDJOG C2C Services (Live & Active)

Your website, REST API backend, and Serverless SQLite database are now deployed on **Cloudflare's 100% Free Tier**.

---

## 🌐 Live Production URLs

| Page / Feature | Live Cloudflare Production URL |
| :--- | :--- |
| **Home Page** | [https://udjog-c2c.udjogc2c.workers.dev](https://udjog-c2c.udjogc2c.workers.dev) |
| **Find a Job Portal** | [https://udjog-c2c.udjogc2c.workers.dev/jobs](https://udjog-c2c.udjogc2c.workers.dev/jobs) |
| **Candidate Registration** | [https://udjog-c2c.udjogc2c.workers.dev/candidates](https://udjog-c2c.udjogc2c.workers.dev/candidates) |
| **Employer Job Post** | [https://udjog-c2c.udjogc2c.workers.dev/employers](https://udjog-c2c.udjogc2c.workers.dev/employers) |
| **About Us** | [https://udjog-c2c.udjogc2c.workers.dev/about](https://udjog-c2c.udjogc2c.workers.dev/about) |
| **Contact Us** | [https://udjog-c2c.udjogc2c.workers.dev/contact](https://udjog-c2c.udjogc2c.workers.dev/contact) |
| **Admin Portal Login** | [https://udjog-c2c.udjogc2c.workers.dev/admin/login](https://udjog-c2c.udjogc2c.workers.dev/admin/login) |
| **Admin Dashboard** | [https://udjog-c2c.udjogc2c.workers.dev/admin/dashboard](https://udjog-c2c.udjogc2c.workers.dev/admin/dashboard) |

> **Admin Default Login Credentials**:
> - **Username**: `admin`
> - **Password**: `udjog2026`

---

## 🗄️ Cloudflare Architecture (100% Free Forever)
- **Frontend**: Cloudflare Static Assets (HTML5, CSS3, ES6 JS, Fonts, Images)
- **Backend**: Cloudflare Worker (`src/index.js`) handling REST APIs (`/api/jobs`, `/api/stats`, `/api/applications`, `/api/employers`, `/api/admin/...`)
- **Database**: Cloudflare D1 (`udjog_db`, ID: `5acf068f-3f29-4dc4-b630-a4e6bf87f497`)

---

## 🔄 How to Redeploy After Making Code Changes
Whenever you edit code inside `UDJOGC2C`, simply open PowerShell in `UDJOGC2C` and run:

```bash
cd UDJOGC2C
npx wrangler deploy
```

Changes are deployed to all 300+ Cloudflare edge locations worldwide in under 10 seconds!

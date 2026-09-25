# 🌟 3arfny

> A modern, full-stack web application integrating real-time notifications, email services, and AI agent infrastructure.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## ✨ Core Features

* 🤖 **AI Agent Infrastructure**
  Built-in architecture for advanced AI integrations, with structured planning and agent-specific documentation through `AGENTS.md`, `CLAUDE.md`, and `3arfny_agent_plan.md`.

* 🔔 **Real-Time Web Push**
  Integrated Web Push API using VAPID for cross-platform browser notifications.

* 📧 **Automated Email Services**
  Gmail SMTP integration powered by Nodemailer for reliable transactional email delivery.

* 🔒 **Secure Authentication**
  Authentication and database security powered by Supabase PostgreSQL and Row Level Security (RLS).

* 🎨 **Premium UI/UX**
  Responsive, accessible, and modern interfaces built with Tailwind CSS and Geist typography.

* 🚀 **Edge-Optimized Architecture**
  Built with the Next.js App Router, supporting modern rendering strategies and optimized deployments on Vercel.

---

## 🚀 Tech Stack

| Category            | Technology              |
| :------------------ | :---------------------- |
| **Framework**       | Next.js — App Router    |
| **Language**        | TypeScript              |
| **Styling**         | Tailwind CSS            |
| **Typography**      | Geist via `next/font`   |
| **Database & Auth** | Supabase / PostgreSQL   |
| **Notifications**   | Web Push API / VAPID    |
| **Email Service**   | Nodemailer / Gmail SMTP |
| **Deployment**      | Vercel                  |

---

## 📁 Project Structure

```text
3arfny/
├── app/                       # Next.js App Router pages, layouts, and API routes
├── components/                # Reusable modular React UI components
├── lib/                       # Utility functions, shared logic, and configurations
├── public/                    # Static assets, icons, and PWA files
├── supabase/
│   └── migrations/            # Database schema migrations
├── middleware.ts              # Route protection and authentication middleware
├── 3arfny_agent_plan.md       # Core AI agent architecture and planning
├── AGENTS.md                  # AI agent execution guidelines
├── CLAUDE.md                  # LLM-specific context and project rules
├── .env.example               # Environment variable template
├── next.config.*              # Next.js configuration
├── package.json               # Project dependencies and scripts
└── README.md                  # Project documentation
```

---

## 🛠 Getting Started

### Prerequisites

Make sure you have the following installed and configured:

* [Node.js](https://nodejs.org/) v18.x or later
* A [Supabase](https://supabase.com/) project
* A Gmail account with an **App Password**
* VAPID keys for Web Push notifications

> **Important:** Never use your primary Gmail account password in the application. Use a dedicated Google App Password.

### Generate VAPID Keys

Generate a public/private VAPID key pair using:

```bash
npx web-push generate-vapid-keys
```

Keep the private key secret and never commit it to source control.

---

## 🔐 Environment Variables

Create your local environment file from the provided example:

```bash
cp .env.example .env.local
```

Then populate `.env.local` with the required credentials:

```env
# -----------------------------------------------------------------------------
# Supabase Configuration
# -----------------------------------------------------------------------------

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# -----------------------------------------------------------------------------
# Email Service Configuration (Gmail SMTP)
# -----------------------------------------------------------------------------

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# -----------------------------------------------------------------------------
# Web Push Notifications (VAPID)
# -----------------------------------------------------------------------------

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Environment Variable Reference

| Variable                        | Required | Description                              |
| :------------------------------ | :------: | :--------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      |     ✅    | URL of your Supabase project             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |     ✅    | Supabase public/anonymous API key        |
| `SUPABASE_SERVICE_ROLE_KEY`     |     ✅    | Supabase server-side service-role key    |
| `GMAIL_USER`                    |     ✅    | Gmail address used for sending emails    |
| `GMAIL_APP_PASSWORD`            |     ✅    | Google App Password used by SMTP         |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  |     ✅    | Public VAPID key used by browser clients |
| `VAPID_PRIVATE_KEY`             |     ✅    | Private VAPID key used by the server     |

> ⚠️ **Security:** Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_APP_PASSWORD`, or `VAPID_PRIVATE_KEY` to the client or commit them to Git.

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/polamounir/3arfny.git
cd 3arfny
```

Install dependencies:

```bash
npm install
```

Or with Yarn:

```bash
yarn install
```

Or with pnpm:

```bash
pnpm install
```

---

## ▶️ Running the Application

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The development server automatically reloads as you make changes to the application.

---

## 🤖 AI Agent Infrastructure

3arfny includes dedicated documentation and planning files designed to provide context for AI coding agents and LLM-assisted development.

### Agent Documentation

| File                   | Purpose                                                |
| :--------------------- | :----------------------------------------------------- |
| `3arfny_agent_plan.md` | Overall AI integration roadmap and architecture        |
| `AGENTS.md`            | Guidelines for AI agents working within the repository |
| `CLAUDE.md`            | LLM-specific project context and development rules     |

Before making significant changes with an AI coding assistant, review these files to understand the project's architecture, conventions, and constraints.

---

## 🗄️ Database

The project uses **Supabase PostgreSQL** for persistent data storage.

Database migrations are located in:

```text
supabase/migrations/
```

Apply migrations according to your Supabase development workflow before running features that depend on the database.

### Row Level Security

Supabase Row Level Security (RLS) is used to control access to protected database resources.

When modifying database tables or policies:

1. Review the existing RLS policies.
2. Add or update migrations rather than manually changing production schemas.
3. Test authenticated and unauthenticated access.
4. Never expose service-role credentials to the browser.

---

## 🔔 Web Push Notifications

The application uses the Web Push API with VAPID authentication.

The basic setup requires:

1. Generate VAPID keys.
2. Add the public key to `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
3. Add the private key to `VAPID_PRIVATE_KEY`.
4. Configure the application to request browser notification permissions.
5. Store and manage push subscriptions securely.

The VAPID private key should remain server-side at all times.

---

## 📧 Email Services

Transactional email delivery is handled through **Nodemailer** and Gmail SMTP.

Required environment variables:

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

For production deployments, make sure the configured Gmail account and App Password are appropriate for automated application email delivery.

---

## ☁️ Deployment

The application is designed for deployment on **Vercel**.

### Deploy with Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure all required environment variables in the Vercel project settings.
4. Configure your production Supabase project.
5. Deploy the application.

For additional information, see the official [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

### Production Checklist

Before deploying to production:

* [ ] Configure production Supabase credentials.
* [ ] Apply all database migrations.
* [ ] Configure Gmail/App Password credentials.
* [ ] Generate production VAPID keys.
* [ ] Add environment variables to Vercel.
* [ ] Verify Supabase RLS policies.
* [ ] Confirm no secrets are committed to Git.
* [ ] Test authentication flows.
* [ ] Test email delivery.
* [ ] Test browser push notifications.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

### Contribution Workflow

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/AmazingFeature
```

3. Make your changes.
4. Commit your changes:

```bash
git commit -m "Add some AmazingFeature"
```

5. Push the branch:

```bash
git push origin feature/AmazingFeature
```

6. Open a Pull Request.

### Before Opening a Pull Request

Please make sure:

* The application builds successfully.
* Existing functionality is not unintentionally broken.
* New functionality is documented where appropriate.
* Secrets and credentials are not committed.
* Database changes include the appropriate migration files.
* Code follows the existing project conventions.

---

## 🐛 Issues & Feature Requests

If you encounter a bug or have an idea for a new feature, open an issue in the GitHub repository with enough information to reproduce the problem or understand the proposed change.

When reporting a bug, include:

* A clear description of the problem.
* Steps to reproduce it.
* Expected behavior.
* Actual behavior.
* Relevant error messages or logs.
* Browser/OS information when applicable.

---

## 👨‍💻 Author

**Pola**

* GitHub: [@polamounir](https://github.com/polamounir)

---

## 📄 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for the complete license text.

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

Your feedback, issues, and contributions are welcome!

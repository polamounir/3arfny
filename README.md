# 3arfny

A modern, full-stack web application built with [Next.js](https://nextjs.org/) and Supabase, featuring integrated web push notifications, email services, and AI agent infrastructure. 

## 🚀 Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (with `next/font` using Geist)
*   **Database & Backend:** Supabase (PostgreSQL)
*   **Notifications:** Web-Push API (VAPID)
*   **Email Service:** Gmail SMTP Integration
*   **Deployment:** Vercel

## 📁 Project Structure

*   `/app` - Next.js App Router pages and API routes.
*   `/components` - Reusable React UI components.
*   `/lib` - Utility functions, configurations, and shared logic.
*   `/supabase/migrations` - Database schema migrations and Supabase configurations.
*   `/public` - Static assets.
*   `middleware.ts` - Next.js middleware for request interception (likely handling auth/routing).
*   `3arfny_agent_plan.md` / `AGENTS.md` / `CLAUDE.md` - Documentation and planning files for AI agent integrations.

## 🛠 Getting Started

### Prerequisites

Before running the application, ensure you have the following ready:
1.  Node.js installed on your machine.
2.  A [Supabase](https://supabase.com/) project setup.
3.  A Gmail account with an App Password generated (do not use your primary password).
4.  VAPID keys generated for push notifications. You can generate these by running:
    ```bash
    npx web-push generate-vapid-keys
    ```

### Environment Variables

Copy the example environment file and fill in your specific configuration values:

```bash
cp .env.example .env.local

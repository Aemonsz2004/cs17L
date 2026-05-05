# Pandarawan RTMS - Quick Start Guide

## What this app is
Pandarawan RTMS is a Laravel + React/Inertia rental management web app with:
- Admin portal
- Tenant portal
- First-login password setup for tenants
- OTP verification for tenant logins

## Requirements
- PHP 8.3+
- Composer
- Node.js and npm
- Database (SQLite or MySQL)
- Working SMTP email (required for OTP)

## 1. Install dependencies
Run in project root:

composer install
npm install

## 2. Create environment file and app key

copy .env.example .env
php artisan key:generate

## 3. Configure database
In .env, set either SQLite or MySQL values.

Example for SQLite:
- DB_CONNECTION=sqlite
- Create file: database/database.sqlite

## 4. Configure email for OTP
OTP is sent by email, so SMTP must be configured in .env.

Important values:
- MAIL_MAILER=smtp
- MAIL_HOST=smtp.gmail.com
- MAIL_PORT=587
- MAIL_SCHEME=smtp
- MAIL_USERNAME=your_email
- MAIL_PASSWORD=your_app_password

Then run:

php artisan config:clear

## 5. Prepare database data

php artisan migrate --seed

This seeds a default admin account and sample tenant data.

## 6. Start the app
Recommended (runs Laravel, queue, and Vite together):

composer run dev

Open:
- http://127.0.0.1:8000

## Seeded default accounts
Admin:
- Email: admin@rtms.test
- Password: password

Sample tenant:
- Email: tenant@rtms.test
- Password: password

## Real tenant onboarding flow
1. Admin logs in.
2. Admin goes to Tenants and creates a tenant profile.
3. System auto-creates tenant user credentials (temporary password).
4. Admin shares tenant email and temporary password with the tenant.
5. Tenant logs in.
6. Tenant is forced to set a new password on first login.
7. On succeeding tenant login sessions, a 6-digit OTP is sent to tenant email.
8. Tenant enters OTP to continue to Tenant Home.

## If OTP is not received
1. Recheck SMTP values in .env.
2. Run: php artisan config:clear
3. Try login again and use Resend OTP.
4. Check Laravel logs in storage/logs.

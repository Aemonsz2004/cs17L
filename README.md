# Pandarawan RTMS - Quick Start Guide



## 1. Install dependencies
Run in project root:

composer install
npm install


## 2. Prepare database data

php artisan migrate --seed

This seeds a default admin account and sample tenant data.

## 3. Start the app

composer run dev

Open:
- http://127.0.0.1:8000

## Seeded default accounts
Admin:
- Email: admin@rtms.test
- Password: password


## Real tenant onboarding flow
1. Admin logs in.
2. Admin goes to Tenants and creates a tenant profile. (use real email for tenant) 
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

@component('mail::message')
# Welcome, {{ $tenant->name }}!

Your account has been created. Below are your login credentials:

**Email:** {{ $tenant->email }}
**Temporary Password:** `{{ $password }}`

Please log in and change your password immediately.

@component('mail::button', ['url' => route('login')])
Log In
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
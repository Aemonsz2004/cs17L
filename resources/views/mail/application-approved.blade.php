@component('mail::message')
# Application Approved!

Hi {{ $tenant->name }},

Congratulations! Your rental application has been **approved** for unit **{{ $unit->number }}** ({{ $unit->floor }} Floor).

## Unit Details

- **Unit Number:** {{ $unit->number }}
- **Floor:** {{ $unit->floor }}
- **Type:** {{ $unit->type }}
- **Area:** {{ $unit->area }} sqm
- **Monthly Rent:** P{{ number_format($unit->base_rent) }}
- **Security Deposit:** P{{ number_format($unit->getDepositAmount()) }}

## Next Steps

A lease agreement has been prepared and a security deposit invoice has been created. You will receive payment instructions separately.

Please log in to your dashboard to view your lease details and payment instructions.

@component('mail::button', ['url' => route('tenant.home')])
View Your Dashboard
@endcomponent

If you have any questions, please contact our office.

Thanks,<br>
{{ config('app.name') }} Management
@endcomponent

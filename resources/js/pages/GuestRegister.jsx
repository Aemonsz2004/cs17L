import { Head, useForm } from '@inertiajs/react';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';

export default function GuestRegister({ units }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        contact: '',
        phone: '',
        unit_id: '',
        payment_method: 'gcash',
    });

    const selectedUnit = units.find(u => u.id.toString() === data.unit_id);
    const deposit = selectedUnit ? selectedUnit.base_rent * 2 : 0;

    const submit = e => {
        e.preventDefault();
        post('/register', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Apply for Unit" />
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow">
                    <h1 className="text-2xl font-bold mb-6">Apply for a Unit</h1>
                    <form onSubmit={submit} className="space-y-4">
                        <Input
                            label="Full Name"
                            required
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            error={errors.name}
                        />
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            error={errors.email}
                        />
                        <Input
                            label="Contact Person"
                            value={data.contact}
                            onChange={e => setData('contact', e.target.value)}
                            error={errors.contact}
                        />
                        <Input
                            label="Phone Number"
                            required
                            value={data.phone}
                            onChange={e => setData('phone', e.target.value)}
                            error={errors.phone}
                        />
                        <Select
                            label="Preferred Unit"
                            required
                            value={data.unit_id}
                            onChange={e => setData('unit_id', e.target.value)}
                            error={errors.unit_id}
                        >
                            <option value="">Select a unit</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>
                                    {`${u.number} (${u.floor}) - ${u.type}`}
                                </option>
                            ))}
                        </Select>
                        {selectedUnit && (
                            <p className="text-sm text-gray-600">
                                Deposit (2 months rent): ₱
                                {deposit.toLocaleString()}
                            </p>
                        )}
                        <Select
                            label="Payment Method"
                            required
                            value={data.payment_method}
                            onChange={e =>
                                setData('payment_method', e.target.value)
                            }
                        >
                            <option value="gcash">GCash</option>
                            <option value="cash">Cash (over-the-counter)</option>
                        </Select>
                        <Button
                            type="submit"
                            loading={processing}
                            full
                            className="mt-4"
                        >
                            Proceed to Payment
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
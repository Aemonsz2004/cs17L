import { useEffect, useState } from 'react';

export default function FlashMessage({ message, type }) {
    const [visible, setVisible] = useState(!!message);

    useEffect(() => {
        if (!message) return;
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 6000);
        return () => clearTimeout(timer);
    }, [message]);

    if (!visible) return null;

    const bg =
        type === 'error'
            ? 'bg-red-100 border-red-400 text-red-700'
            : 'bg-green-100 border-green-400 text-green-700';

    return (
        <div
            className={`fixed top-4 right-4 z-50 border px-4 py-3 rounded shadow-md ${bg}`}
        >
            <span>{message}</span>
            <button
                onClick={() => setVisible(false)}
                className="ml-4 font-bold"
            >
                &times;
            </button>
        </div>
    );
}

// src/pages/tenant/MessagesPage.jsx
import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { formatDateDisplay } from '../../lib/date';
export default function MessagesPage({ messages: serverMessages }) {
    const { auth } = usePage().props;
    const tenantInitials = (auth?.user?.name ?? 'Tenant')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const toUiMessages = (rows = []) =>
        rows.map((message) => ({
            id: message.id,
            from: message.from,
            text: message.text,
            timestamp: formatDateDisplay(message.created_at, 'Just now'),
        }));
    const [messages, setMessages] = useState(toUiMessages(serverMessages));
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    useEffect(() => {
        setMessages(toUiMessages(serverMessages));
    }, [serverMessages]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        const optimisticId = Date.now();
        const optimisticMessage = {
            id: optimisticId,
            from: 'tenant',
            text,
            timestamp: 'Just now',
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        router.post(
            '/tenant/messages',
            { text },
            {
                preserveScroll: true,
                onError: () => {
                    setMessages((prev) =>
                        prev.filter((msg) => msg.id !== optimisticId),
                    );
                },
            },
        );
        setInput('');
    };
    // Group messages by date (simple approach)
    const grouped = [];
    messages.forEach((m) => {
        const date = m.timestamp.includes('Mar 12')
            ? 'Mar 12, 2026'
            : m.timestamp.includes('Mar 14')
              ? 'Mar 14, 2026'
              : 'Today';
        const last = grouped[grouped.length - 1];
        if (last && last.date === date) {
            last.msgs.push(m);
        } else {
            grouped.push({ date, msgs: [m] });
        }
    });
    return (
        <div className="flex h-[calc(100vh-56px-48px-48px)] max-w-3xl flex-col gap-4">
            {/* ── Chat card ── */}
            <Card className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#1B2B4B]/8 px-5 py-4">
                    <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B2B4B] text-xs font-bold text-white select-none">
                            PA
                        </div>
                        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#24A18F]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#1B2B4B]">
                            Pandarawan Admin
                        </p>
                        <p className="flex items-center gap-1 text-xs text-[#24A18F]">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#24A18F]" />
                            Online
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-1 overflow-y-auto px-5 py-4">
                    {grouped.map((group) => (
                        <div key={group.date}>
                            {/* Date divider */}
                            <div className="my-4 flex items-center gap-3">
                                <div className="h-px flex-1 bg-[#1B2B4B]/8" />
                                <span className="text-[10px] font-medium text-[#5C6B88]">
                                    {group.date}
                                </span>
                                <div className="h-px flex-1 bg-[#1B2B4B]/8" />
                            </div>

                            {group.msgs.map((msg) => {
                                const isMe = msg.from === 'tenant';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}
                                    >
                                        {/* Admin avatar */}
                                        {!isMe && (
                                            <div className="mt-auto mr-2 mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1B2B4B] text-[9px] font-bold text-white">
                                                PA
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}
                                        >
                                            <div
                                                className={[
                                                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                                    isMe
                                                        ? 'rounded-br-sm bg-[#1B2B4B] text-white'
                                                        : 'rounded-bl-sm bg-[#F5F0E8] text-[#1B2B4B]',
                                                ].join(' ')}
                                            >
                                                {msg.text}
                                            </div>
                                            <p className="mt-1 px-1 text-[10px] text-[#5C6B88]">
                                                {msg.timestamp}
                                            </p>
                                        </div>

                                        {/* Tenant avatar */}
                                        {isMe && (
                                            <div className="mt-auto mb-1 ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1D7B6E] text-[9px] font-bold text-white">
                                                {tenantInitials}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex flex-shrink-0 items-center gap-2 border-t border-[#1B2B4B]/8 px-4 py-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Type a message…"
                        className="flex-1 rounded-xl border border-[#1B2B4B]/15 bg-[#F5F0E8]/70 px-4 py-2.5 text-sm text-[#1B2B4B] transition-all outline-none placeholder:text-[#1B2B4B]/30 focus:border-[#24A18F] focus:bg-white focus:ring-2 focus:ring-[#24A18F]/15"
                    />
                    <Button variant="primary" size="md" onClick={sendMessage}>
                        Send
                    </Button>
                </div>
            </Card>
        </div>
    );
}

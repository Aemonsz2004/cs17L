// src/pages/tenant/MessagesPage.tsx
import { useState, useRef, useEffect } from "react"
import { router, usePage } from "@inertiajs/react"
import Button from "../../components/Button"
import Card   from "../../components/Card"
import { formatDateDisplay } from "../../lib/date"

type Message = {
  id: number
  from: "admin" | "tenant"
  text: string
  timestamp: string
}

type DbMessage = {
  id: number
  from: "admin" | "tenant"
  text: string
  created_at?: string
}

export default function MessagesPage({ messages: serverMessages }: { messages?: DbMessage[] }) {
  const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props

  const tenantInitials = (auth?.user?.name ?? "Tenant")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const toUiMessages = (rows: DbMessage[] = []): Message[] =>
    rows.map((message) => ({
      id: message.id,
      from: message.from,
      text: message.text,
      timestamp: formatDateDisplay(message.created_at, "Just now"),
    }))

  const [messages, setMessages] = useState<Message[]>(
    toUiMessages(serverMessages)
  )
  const [input,    setInput]    = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(toUiMessages(serverMessages))
  }, [serverMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const optimisticId = Date.now()
    const optimisticMessage: Message = {
      id: optimisticId,
      from: "tenant",
      text,
      timestamp: "Just now",
    }

    setMessages((prev) => [...prev, optimisticMessage])

    router.post("/tenant/messages", { text }, {
      preserveScroll: true,
      onError: () => {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      },
    })

    setInput("")
  }

  // Group messages by date (simple approach)
  const grouped: { date: string; msgs: Message[] }[] = []
  messages.forEach(m => {
    const date = m.timestamp.includes("Mar 12") ? "Mar 12, 2026"
               : m.timestamp.includes("Mar 14") ? "Mar 14, 2026"
               : "Today"
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.msgs.push(m)
    } else {
      grouped.push({ date, msgs: [m] })
    }
  })

  return (
    <div className="max-w-3xl h-[calc(100vh-56px-48px-48px)] flex flex-col gap-4">

      {/* ── Chat card ── */}
      <Card className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1B2B4B]/8 flex-shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#1B2B4B] flex items-center justify-center text-xs font-bold text-white select-none">
              PA
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#24A18F] border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1B2B4B]">Pandarawan Admin</p>
            <p className="text-xs text-[#24A18F] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#24A18F] inline-block" />
              Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {grouped.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#1B2B4B]/8" />
                <span className="text-[10px] text-[#5C6B88] font-medium">{group.date}</span>
                <div className="flex-1 h-px bg-[#1B2B4B]/8" />
              </div>

              {group.msgs.map(msg => {
                const isMe = msg.from === "tenant"
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}
                  >
                    {/* Admin avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-[#1B2B4B] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mr-2 mt-auto mb-1">
                        PA
                      </div>
                    )}

                    <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={[
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isMe
                            ? "bg-[#1B2B4B] text-white rounded-br-sm"
                            : "bg-[#F5F0E8] text-[#1B2B4B] rounded-bl-sm",
                        ].join(" ")}
                      >
                        {msg.text}
                      </div>
                      <p className="text-[10px] text-[#5C6B88] mt-1 px-1">{msg.timestamp}</p>
                    </div>

                    {/* Tenant avatar */}
                    {isMe && (
                      <div className="w-7 h-7 rounded-full bg-[#1D7B6E] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ml-2 mt-auto mb-1">
                        {tenantInitials}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-[#1B2B4B]/8">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#1B2B4B]/15 bg-[#F5F0E8]/70 text-sm text-[#1B2B4B] placeholder:text-[#1B2B4B]/30 outline-none focus:border-[#24A18F] focus:bg-white focus:ring-2 focus:ring-[#24A18F]/15 transition-all"
          />
          <Button variant="primary" size="md" onClick={sendMessage}>
            Send
          </Button>
        </div>
      </Card>

    </div>
  )
}
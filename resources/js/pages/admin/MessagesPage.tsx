import { useMemo, useState } from "react"
import { router } from "@inertiajs/react"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import Card from "../../components/Card"
import { Textarea } from "../../components/Input"
import { formatDateDisplay } from "../../lib/date"

type AdminMessage = {
  id: number
  tenant_id: number
  from: "admin" | "tenant"
  text: string
  read: boolean
  created_at?: string
  tenant?: {
    id: number
    name: string
    unit?: string
  }
}

export default function MessagesPage({ messages = [] }: { messages?: AdminMessage[] }) {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(messages[0]?.tenant_id ?? null)
  const [reply, setReply] = useState("")

  const threads = useMemo(() => {
    const map = new Map<number, { tenantId: number; tenantName: string; unit: string; unread: number; lastAt: string }>()

    for (const message of messages) {
      const current = map.get(message.tenant_id)
      const unreadDelta = message.from === "tenant" && !message.read ? 1 : 0
      const createdAt = message.created_at ?? ""

      if (!current) {
        map.set(message.tenant_id, {
          tenantId: message.tenant_id,
          tenantName: message.tenant?.name ?? `Tenant #${message.tenant_id}`,
          unit: message.tenant?.unit ?? "-",
          unread: unreadDelta,
          lastAt: createdAt,
        })
        continue
      }

      current.unread += unreadDelta
      if (createdAt > current.lastAt) {
        current.lastAt = createdAt
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
  }, [messages])

  const selectedThread = useMemo(
    () => messages
      .filter((message) => message.tenant_id === selectedTenantId)
      .sort((a, b) => (a.created_at ?? "") < (b.created_at ?? "") ? -1 : 1),
    [messages, selectedTenantId],
  )

  const sendReply = () => {
    const text = reply.trim()
    if (!selectedTenantId || !text) return

    router.post("/admin/messages/reply", {
      tenant_id: selectedTenantId,
      text,
    })
    setReply("")
  }

  const openThread = (tenantId: number) => {
    setSelectedTenantId(tenantId)

    messages
      .filter((message) => message.tenant_id === tenantId && message.from === "tenant" && !message.read)
      .forEach((message) => {
        router.patch(`/admin/messages/${message.id}/read`, {}, { preserveScroll: true })
      })
  }

  return (
    <div className="grid grid-cols-12 gap-5 h-[calc(100vh-120px)]">
      <Card className="col-span-4 flex flex-col overflow-hidden">
        <Card.Header title="Tenant Threads" />
        <Card.Body flush>
          {threads.length === 0 ? (
            <div className="p-5 text-sm text-[#5C6B88]">No tenant messages yet.</div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.tenantId}
                className={[
                  "w-full text-left px-4 py-3 border-b border-[#1B2B4B]/6 transition-colors",
                  selectedTenantId === thread.tenantId ? "bg-[#F5F0E8]" : "hover:bg-[#FAF8F4]",
                ].join(" ")}
                onClick={() => openThread(thread.tenantId)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-[#1B2B4B] truncate">{thread.tenantName}</p>
                  {thread.unread > 0 && <Badge variant="red">{thread.unread}</Badge>}
                </div>
                <p className="text-xs text-[#5C6B88]">Unit {thread.unit}</p>
              </button>
            ))
          )}
        </Card.Body>
      </Card>

      <Card className="col-span-8 flex flex-col overflow-hidden">
        <Card.Header title="Conversation" />
        <Card.Body className="flex-1 overflow-y-auto space-y-2">
          {selectedThread.length === 0 ? (
            <div className="text-sm text-[#5C6B88]">Select a tenant thread to view messages.</div>
          ) : (
            selectedThread.map((message) => (
              <div key={message.id} className={`flex ${message.from === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={[
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  message.from === "admin"
                    ? "bg-[#2f3a55] text-white"
                    : "bg-[#F5F0E8] text-[#1B2B4B]",
                ].join(" ")}>
                  <p>{message.text}</p>
                  <p className={`text-[10px] mt-1 ${message.from === "admin" ? "text-white/70" : "text-[#5C6B88]"}`}>
                    {formatDateDisplay(message.created_at, "-")}
                  </p>
                </div>
              </div>
            ))
          )}
        </Card.Body>
        <Card.Footer>
          <div className="w-full space-y-2">
            <Textarea
              placeholder="Reply to tenant..."
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={3}
              full
            />
            <div className="flex justify-end">
              <Button variant="primary" onClick={sendReply}>Send Reply</Button>
            </div>
          </div>
        </Card.Footer>
      </Card>
    </div>
  )
}

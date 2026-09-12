import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { daysUntilDue } from "@/lib/plants"

function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@totoland.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "forbidden" }, { status: 403 })

  initVapid()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const currentHour = now.getHours()

  const { data: mutedRows } = await admin.from("profiles")
    .select("id").gt("mute_until", now.toISOString())
  const muted = new Set<string>((mutedRows ?? []).map((m: any) => m.id))

  let sentCount = 0

  // 1) Recordatorios pospuestos que tocan en esta hora
  const { data: scheduled } = await admin
    .from("scheduled_notifications")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString())
  for (const s of scheduled ?? []) {
    const ok = await sendPush(admin, s.user_id, {
      title: s.title,
      body: s.body,
      tag: `sched-${s.id}`,
    }, muted)
    if (ok) sentCount++
    await admin.from("scheduled_notifications")
      .update({ status: ok ? "sent" : "failed" }).eq("id", s.id)
  }

  // 2) Recordatorios personalizados que han vencido
  const { data: customs } = await admin
    .from("custom_reminders")
    .select("*")
    .eq("active", true)
    .lte("next_run_at", now.toISOString())
  for (const c of customs ?? []) {
    const { data: members } = await admin
      .from("household_members").select("user_id").eq("household_id", c.household_id)
    for (const m of members ?? []) {
      const ok = await sendPush(admin, m.user_id, {
        title: "🔔 Recordatorio: " + c.title,
        body: "Toca hacerlo hoy.",
        tag: `custom-${c.id}`,
      }, muted)
      if (ok) sentCount++
    }
    if (c.recurrence === "once") {
      await admin.from("custom_reminders").update({ active: false }).eq("id", c.id)
    } else {
      const days = c.recurrence === "daily" ? 1 : c.recurrence === "weekly" ? 7 : c.recurrence === "biweekly" ? 14 : 30
      const next = new Date(new Date(c.next_run_at).getTime() + days * 86400000)
      await admin.from("custom_reminders").update({ next_run_at: next.toISOString() }).eq("id", c.id)
    }
  }

  // 3) Recordatorio diario para casas cuya hora coincide con la actual
  const { data: houses } = await admin
    .from("households")
    .select("id, reminder_time, name")
  for (const h of houses ?? []) {
    const hhmm = h.reminder_time ?? "08:00"
    const [rh, rm] = hhmm.split(":").map(Number)
    const curMM = Math.floor(now.getMinutes() / 5) * 5
    if (rh !== currentHour || Math.floor(rm / 5) * 5 !== curMM) continue

    const { data: members } = await admin
      .from("household_members").select("user_id").eq("household_id", h.id)
    const { data: plants } = await admin
      .from("plants").select("*").eq("household_id", h.id).neq("status", "dead")

    const month = now.getMonth() + 1
    const due: string[] = []
    for (const p of plants ?? []) {
      if (p.watering_days) {
        const du = daysUntilDue(p as any, 5, 9)
        if (du !== null && du <= 0) due.push(p.name)
        continue
      }
      const freq = month >= 5 && month <= 9
        ? p.watering_frequency_days
        : p.watering_frequency_winter_days ?? p.watering_frequency_days
      if (!freq) continue
      const last = p.last_watered_at ? new Date(p.last_watered_at).getTime() : 0
      const days = Math.floor((now.getTime() - last) / 86400000)
      if (!p.last_watered_at || days >= freq) due.push(p.name)
    }
    if (due.length === 0) continue

    const title = "🌿 Totoland: toca regar"
    const body = due.slice(0, 5).join(", ") + (due.length > 5 ? "…" : "")
    for (const m of members ?? []) {
      const ok = await sendPush(admin, m.user_id, {
        title, body, tag: `daily-${h.id}`,
        actions: [
          { action: "postpone-2", title: "Posponer 2h" },
          { action: "postpone-4", title: "Posponer 4h" },
          { action: "postpone-6", title: "Posponer 6h" },
        ],
        data: { household_id: h.id },
      }, muted)
      if (ok) sentCount++
    }
  }

  return NextResponse.json({ sent: sentCount })
}

async function sendPush(admin: any, userId: string | null, payload: any, muted: Set<string>): Promise<boolean> {
  if (!userId || muted.has(userId)) return false
  const { data: subs } = await admin
    .from("push_subscriptions").select("subscription").eq("user_id", userId)
  let ok = false
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(s.subscription, JSON.stringify(payload))
      ok = true
    } catch {
      await admin.from("push_subscriptions").delete().eq("subscription", s.subscription)
    }
  }
  return ok
}
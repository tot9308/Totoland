import { NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: plants } = await admin
    .from("plants")
    .select("name, watering_frequency_days, last_watered_at, status")
    .neq("status", "dead")
    .not("watering_frequency_days", "is", null)

  const due = (plants ?? []).filter(p => {
    if (!p.last_watered_at) return true
    const days = (Date.now() - new Date(p.last_watered_at).getTime()) / 86400000
    return days >= (p.watering_frequency_days ?? 999999)
  })

  if (due.length === 0) return NextResponse.json({ sent: 0 })

  const { data: subs } = await admin.from("push_subscriptions").select("subscription")

  webpush.setVapidDetails(
    "mailto:totoland@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const body = "Toca regar: " + due.map(p => p.name).join(", ")
  let sent = 0
  for (const s of subs ?? []) {
    const sub = s.subscription as { endpoint: string }
    try {
      await webpush.sendNotification(s.subscription as never, JSON.stringify({ title: "🌿 Totoland", body }))
      sent++
    } catch {
      await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
    }
  }
  return NextResponse.json({ sent })
}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const { household_id, hours } = await req.json()
  if (!household_id || !hours) return NextResponse.json({ error: "bad request" }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: plants } = await admin
    .from("plants").select("name, last_watered_at, watering_frequency_days, watering_frequency_winter_days")
    .eq("household_id", household_id).neq("status", "dead")

  const now = new Date()
  const month = now.getMonth() + 1
  const due: string[] = []
  for (const p of plants ?? []) {
    const freq = month >= 5 && month <= 9
      ? p.watering_frequency_days
      : p.watering_frequency_winter_days ?? p.watering_frequency_days
    if (!freq) continue
    const last = p.last_watered_at ? new Date(p.last_watered_at).getTime() : 0
    const days = Math.floor((now.getTime() - last) / 86400000)
    if (!p.last_watered_at || days >= freq) due.push(p.name)
  }
  if (due.length === 0) return NextResponse.json({ ok: true, note: "nothing due" })

  const scheduled_at = new Date(now.getTime() + hours * 3600000).toISOString()
  const { data: members } = await admin
    .from("household_members").select("user_id").eq("household_id", household_id)

  for (const m of members ?? []) {
    await admin.from("scheduled_notifications").insert({
      household_id,
      user_id: m.user_id,
      title: "🌿 Totoland: sigue pendiente",
      body: due.slice(0, 5).join(", ") + (due.length > 5 ? "…" : ""),
      scheduled_at,
    })
  }
  return NextResponse.json({ ok: true, scheduled_at })
}
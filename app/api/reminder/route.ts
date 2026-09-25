import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { daysUntilDue, healthLevel, mistingDue } from "@/lib/plants"
import { currentRecoveryStep, CULPRIT_LABEL } from "@/lib/protocols"

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
  // Hora local de Bilbao: el cron y Vercel viven en UTC
  const tf = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now)
  const currentHour = Number(tf.find(p => p.type === "hour")!.value)
  const currentMM = Math.floor(Number(tf.find(p => p.type === "minute")!.value) / 5) * 5
  const todayMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(now)

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
      title: s.title, body: s.body, tag: `sched-${s.id}`,
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

  // 3) Recordatorio diario POR USUARIO a su hora (todas las casas) + log de diagnóstico.
  const reasons: string[] = []
  const { data: profs } = await admin.from("profiles")
    .select("id, reminder_time").not("reminder_time", "is", null)
  for (const pr of profs ?? []) {
    const hhmm = pr.reminder_time ?? "08:00"
    const [rh, rm] = hhmm.split(":").map(Number)
    const match = (rh === currentHour && Math.floor(rm / 5) * 5 === currentMM)
    reasons.push(`u=${pr.id.slice(0, 8)} rem=${hhmm} match=${match}`)
    if (!match) continue
    if (muted.has(pr.id)) { reasons.push("muted"); continue }
    const { data: subsRows } = await admin.from("push_subscriptions")
      .select("id").eq("user_id", pr.id)
    reasons.push(`subs=${(subsRows ?? []).length}`)
    const { data: memberships } = await admin.from("household_members")
      .select("household_id").eq("user_id", pr.id)
    for (const mem of memberships ?? []) {
      const { data: h } = await admin.from("households")
        .select("id, name, summer_start_month, summer_end_month, vacation_start, vacation_end")
        .eq("id", mem.household_id).single()
      if (!h) continue
      const todayStr = todayMadrid
      const inVac = !!(h.vacation_start && h.vacation_end && todayStr >= h.vacation_start && todayStr <= h.vacation_end)
      const { data: plants } = await admin.from("plants")
        .select("*").eq("household_id", h.id).neq("status", "dead")
      const month = now.getMonth() + 1
      const inSummer = month >= (h.summer_start_month ?? 5) && month <= (h.summer_end_month ?? 9)
      const due: string[] = []
      const checks: string[] = []
      for (const p of plants ?? []) {
        if (p.watering_days) {
          const du = daysUntilDue(p as any, h.summer_start_month ?? 5, h.summer_end_month ?? 5)
          if (du !== null && du <= 0) due.push(p.name)
        } else {
          const freq = inSummer
            ? p.watering_frequency_days
            : p.watering_frequency_winter_days ?? p.watering_frequency_days
          if (freq) {
            const last = p.last_watered_at ? new Date(p.last_watered_at).getTime() : 0
            const dExact = (now.getTime() - last) / 86400000
            if (!p.last_watered_at || freq - dExact < 1) due.push(p.name)
          }
        }
        const rec = currentRecoveryStep(p as any)
        if (rec && rec.isDueToday) {
          const culpritTxt = p.recovery_culprit ? " · " + CULPRIT_LABEL[p.recovery_culprit] : ""
          checks.push(`${p.name}${culpritTxt} (día ${rec.step.day})`)
        }
      }
      reasons.push(`casa=${h.name} vac=${inVac} due=${due.length} checks=${checks.length}`)
      if (inVac) continue
      // Pulverización pendiente (ajustada por temporada)
      const mist: string[] = []
      for (const p of plants ?? []) {
        if (mistingDue(p as any, h.summer_start_month ?? 5, h.summer_end_month ?? 9)) mist.push(p.name)
      }
      reasons.push(`mist=${mist.length}`)
      if (due.length === 0 && checks.length === 0 && mist.length === 0) continue

      let title = `🌿 ${h.name}: toca regar`
      if (due.length === 0 && checks.length === 0 && mist.length > 0) title = `🌫️ ${h.name}: toca pulverizar`
      else if (due.length > 0 && mist.length > 0) title = `💧+🌫️ ${h.name}: riego y pulverizado`
      else if (due.length === 0 && mist.length === 0 && checks.length > 0) title = `🩺 ${h.name}: chequeo de recuperación`
      const dueTxt = due.slice(0, 5).join(", ") + (due.length > 5 ? "…" : "")
      const checksTxt = checks.length > 0 ? "🩺 Chequeos: " + checks.slice(0, 3).join(", ") : ""
      const mistTxt = mist.length > 0 ? "🌫️ Pulverizar: " + mist.slice(0, 5).join(", ") + (mist.length > 5 ? "…" : "") : ""
      const body = [dueTxt, checksTxt, mistTxt].filter(Boolean).join(" · ")
      const checksTxt = checks.length > 0 ? "🩺 Chequeos: " + checks.slice(0, 3).join(", ") : ""
      const body = [dueTxt, checksTxt].filter(Boolean).join(" · ")

      const ok = await sendPush(admin, pr.id, {
        title, body, tag: `daily-${pr.id}-${h.id}`,
        actions: [
          { action: "postpone-2", title: "Posponer 2h" },
          { action: "postpone-4", title: "Posponer 4h" },
          { action: "postpone-6", title: "Posponer 6h" },
        ],
        data: { household_id: h.id },
      }, muted)
      reasons.push(`sent=${ok}`)
      if (ok) sentCount++
    }
  }
// 4) Snapshot diario de salud para las gráficas
  const { data: allHouses } = await admin
    .from("households").select("id, summer_start_month, summer_end_month")
  for (const h of allHouses ?? []) {
    const { data: pls } = await admin.from("plants")
      .select("*").eq("household_id", h.id).neq("status", "dead")
    const today = now.toISOString().slice(0, 10)
    for (const p of pls ?? []) {
      const { data: lastObs } = await admin.from("care_events")
        .select("health, occurred_at").eq("plant_id", p.id).not("health", "is", null)
        .order("occurred_at", { ascending: false }).limit(1)
      const objective = healthLevel(p as any, h.summer_start_month ?? 5, h.summer_end_month ?? 9)
      let lvl: number
      if (objective === 2) {
        lvl = 2
      } else if (lastObs && lastObs.length) {
        lvl = lastObs[0].health === "green" ? 0 : lastObs[0].health === "yellow" ? 1 : 2
      } else {
        lvl = objective
      }
      await admin.from("health_snapshots").upsert(
        { plant_id: p.id, day: today, level: lvl },
        { onConflict: "plant_id,day" }
      )
    }
  }
  console.log("[reminder] run", todayMadrid, `${currentHour}:${String(currentMM).padStart(2, "0")}`, "sent:", sentCount, "|", reasons.join(" | "))
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
    } catch (err: any) {
      console.error("PUSH FAIL for user", userId, ":", err?.message || err, "statusCode:", err?.statusCode)
    }
  }
  return ok
}
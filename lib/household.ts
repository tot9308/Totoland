import { supabase } from "./supabase"

export async function getActiveHouseholdId(userId: string): Promise<string | null> {
  const { data: prof } = await supabase.from("profiles")
    .select("active_household_id").eq("id", userId).single()
  if (prof?.active_household_id) {
    const { data: member } = await supabase.from("household_members")
      .select("household_id").eq("user_id", userId)
      .eq("household_id", prof.active_household_id).limit(1)
    if (member && member.length) return prof.active_household_id
  }
  const { data: mem } = await supabase.from("household_members")
    .select("household_id").eq("user_id", userId).limit(1).single()
  if (!mem) return null
  if (prof?.active_household_id !== mem.household_id) {
    await supabase.from("profiles").update({ active_household_id: mem.household_id }).eq("id", userId)
  }
  return mem.household_id
}

export async function setActiveHouseholdId(userId: string, householdId: string) {
  await supabase.from("profiles").update({ active_household_id: householdId }).eq("id", userId)
}

export async function listHouseholds(userId: string): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase.from("household_members")
    .select("household_id, households(id, name)").eq("user_id", userId)
  return (data ?? []).map((m: any) => ({ id: m.household_id, name: m.households?.name ?? "Casa" }))
}
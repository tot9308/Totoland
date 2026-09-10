self.addEventListener("push", (event) => {
  let data = {}
  try { data = event.data.json() } catch { data = { title: "Totoland", body: event.data?.text() ?? "" } }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "🌿 Totoland", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      badge: "/badge.png",
      tag: data.tag ?? undefined,
      actions: data.actions ?? [],
      data: data.data ?? {},
      requireInteraction: false,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const action = event.action
  const data = event.notification.data ?? {}

  if (action === "postpone-2" || action === "postpone-4" || action === "postpone-6") {
    const hours = action === "postpone-2" ? 2 : action === "postpone-4" ? 4 : 6
    event.waitUntil(
      fetch("/api/postpone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household_id: data.household_id, hours }),
      })
    )
    return
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow("/")
    })
  )
})
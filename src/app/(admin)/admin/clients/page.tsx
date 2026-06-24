import { Card, CardContent } from "@/components/ui/card"
import { MOCK_CLIENTS, MOCK_PROJECTS } from "@/lib/mock-data"
import { ClientsList } from "./clients-list"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminClientsPage() {
  let clients: any[] = []
  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const { data } = await supabase.from("users").select("*, projects(id)").eq("role", "client").order("created_at", { ascending: false })
    clients = data ?? []
  } else {
    clients = MOCK_CLIENTS.map(c => ({
      ...c,
      projects: MOCK_PROJECTS.filter(p => p.client_id === c.id),
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground mt-1">{clients.length} clients</p>
      </div>
      {!clients.length ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground text-sm">No clients yet</CardContent></Card>
      ) : (
        <ClientsList clients={clients} />
      )}
    </div>
  )
}

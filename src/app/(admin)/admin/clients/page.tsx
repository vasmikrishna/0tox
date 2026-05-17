import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ArrowRight, User } from "lucide-react"
import { MOCK_CLIENTS, MOCK_PROJECTS } from "@/lib/mock-data"

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
        <div className="space-y-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {client.name?.charAt(0)?.toUpperCase() ?? <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{client.projects?.length ?? 0} projects</span>
                  <span className="text-xs text-muted-foreground">Joined {formatDate(client.created_at)}</span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/clients/${client.id}`}><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

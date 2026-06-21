import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Survey } from "@/types"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ThankYouPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data: survey } = await (supabase as any)
    .from("surveys")
    .select("*")
    .eq("slug", slug)
    .single() as { data: Survey | null }

  const thankYouMessage =
    survey?.thank_you_message ?? "Thank you for your response!"

  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center text-center gap-4">
        <CheckCircle2
          className="h-14 w-14 text-green-500"
          aria-hidden="true"
          data-testid="thank-you-icon"
        />
        <div className="space-y-2 max-w-md">
          <h1 className="text-xl font-semibold">Response submitted!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {thankYouMessage}
          </p>
        </div>

        {survey && !survey.one_response && (
          <Button
            variant="outline"
            asChild
            className="mt-2"
            data-testid="submit-another-btn"
          >
            <Link href={`/s/${slug}`}>Submit another response</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {children}
      </div>
    </div>
  )
}

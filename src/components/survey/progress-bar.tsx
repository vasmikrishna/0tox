interface SurveyProgressBarProps {
  current: number
  total: number
}

export function SurveyProgressBar({ current, total }: SurveyProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="space-y-1.5" data-testid="survey-progress-bar">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Section {current} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Section ${current} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function scopeSectionCss(css: string, scopeClass: string): string {
  if (!css.trim()) return ""

  return css.replace(
    /([^{}@]+)\{/g,
    (match, selectors: string) => {
      if (selectors.trim().startsWith("@")) return match

      const scoped = selectors
        .split(",")
        .map((sel: string) => {
          const trimmed = sel.trim()
          if (!trimmed) return trimmed
          if (trimmed === "body" || trimmed === "html") return `.${scopeClass}`
          return `.${scopeClass} ${trimmed}`
        })
        .join(", ")

      return `${scoped} {`
    }
  )
}

export function wrapSectionHtml(html: string, sectionId: string): string {
  const scopeClass = `s9-sec-${sectionId.slice(0, 8)}`
  return `<div class="${scopeClass}" data-s9-edit="section-${sectionId.slice(0, 8)}" data-s9-type="section">${html}</div>`
}

export function getScopeClass(sectionId: string): string {
  return `s9-sec-${sectionId.slice(0, 8)}`
}

import type { ProjectLink } from "@/types"

const ASSET_MARKER_START = "\n\n<!-- 0TOX_PROJECT_ASSETS:"
const ASSET_MARKER_END = " -->"

export type ProjectAssetKind = NonNullable<ProjectLink["kind"]>
export type ProjectAssetType = NonNullable<ProjectLink["type"]>

export const ASSET_TYPES: { value: ProjectAssetType; label: string }[] = [
  { value: "figma", label: "Figma" },
  { value: "sheet", label: "Google Sheets" },
  { value: "doc", label: "Docs / Brief" },
  { value: "drive", label: "Drive Folder" },
  { value: "website", label: "Website" },
  { value: "file", label: "Uploaded File" },
  { value: "note", label: "Document" },
  { value: "other", label: "Other" },
]

export function createAssetId() {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function assetTypeLabel(type?: string) {
  return ASSET_TYPES.find(item => item.value === type)?.label ?? "Other"
}

export function normalizeProjectAssets(links: ProjectLink[] | null | undefined) {
  return (links ?? []).flatMap((asset, index) => {
    if (!asset || typeof asset !== "object") return []

    const kind = asset.kind ?? (asset.type === "folder" ? "folder" : asset.type === "file" ? "file" : asset.content ? "doc" : "link")
    const label = typeof asset.label === "string" ? asset.label.trim() : ""
    const url = typeof asset.url === "string" ? asset.url.trim() : ""
    const content = typeof asset.content === "string" ? asset.content : ""

    if (!label && !url && !content) return []

    return [{
      id: typeof asset.id === "string" && asset.id ? asset.id : `legacy-${index}`,
      label: label || "Untitled asset",
      url,
      type: asset.type ?? (kind === "folder" ? "folder" : kind === "file" ? "file" : kind === "doc" ? "note" : "other"),
      kind,
      notes: typeof asset.notes === "string" ? asset.notes : "",
      content,
      folder_id: typeof asset.folder_id === "string" ? asset.folder_id : "",
      visible_to_client: asset.visible_to_client !== false,
      size: typeof asset.size === "number" ? asset.size : undefined,
      mime_type: typeof asset.mime_type === "string" ? asset.mime_type : "",
      created_at: typeof asset.created_at === "string" ? asset.created_at : "",
    } satisfies ProjectLink]
  })
}

export function visibleProjectAssets(links: ProjectLink[] | null | undefined) {
  return normalizeProjectAssets(links).filter(asset => asset.visible_to_client !== false)
}

export function extractProjectAssets(adminNotes?: string | null) {
  const notes = adminNotes ?? ""
  const markerIndex = notes.lastIndexOf(ASSET_MARKER_START)
  if (markerIndex === -1) return []

  const markerEndIndex = notes.indexOf(ASSET_MARKER_END, markerIndex)
  if (markerEndIndex === -1) return []

  const encoded = notes.slice(markerIndex + ASSET_MARKER_START.length, markerEndIndex)
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8")
    return normalizeProjectAssets(JSON.parse(json))
  } catch {
    return []
  }
}

export function stripProjectAssets(adminNotes?: string | null) {
  const notes = adminNotes ?? ""
  const markerIndex = notes.lastIndexOf(ASSET_MARKER_START)
  if (markerIndex === -1) return notes

  const markerEndIndex = notes.indexOf(ASSET_MARKER_END, markerIndex)
  if (markerEndIndex === -1) return notes

  return `${notes.slice(0, markerIndex)}${notes.slice(markerEndIndex + ASSET_MARKER_END.length)}`.trim()
}

export function composeProjectNotes(adminNotes: string | null | undefined, assets: ProjectLink[]) {
  const visibleNotes = stripProjectAssets(adminNotes)
  const encoded = Buffer.from(JSON.stringify(normalizeProjectAssets(assets)), "utf8").toString("base64url")
  return `${visibleNotes}${ASSET_MARKER_START}${encoded}${ASSET_MARKER_END}`
}

"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ASSET_TYPES, assetTypeLabel, createAssetId, normalizeProjectAssets } from "@/lib/project-assets"
import { cn } from "@/lib/utils"
import type { Project, ProjectLink } from "@/types"
import { AlertCircle, CheckCircle2, ChevronRight, ExternalLink, Eye, EyeOff, FileText, Folder, ImageIcon, LinkIcon, List, ListOrdered, Loader2, Palette, Plus, Quote, Redo2, Search, Strikethrough, Trash2, Underline as UnderlineIcon, Undo2, Upload, X } from "lucide-react"

type AssetTab = "all" | "folders" | "files" | "links" | "docs"
type CreateMode = "folder" | "link" | "doc" | null
type GridSize = "small" | "medium" | "large"
type SortMode = "name-asc" | "name-desc" | "newest" | "type"

const tabs: { value: AssetTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "folders", label: "Folders" },
  { value: "files", label: "Files" },
  { value: "links", label: "Links" },
  { value: "docs", label: "Docs" },
]

function bytes(size?: number) {
  if (!size) return ""
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function matchesTab(asset: ProjectLink, tab: AssetTab) {
  if (tab === "all") return true
  if (tab === "folders") return asset.kind === "folder"
  if (tab === "files") return asset.kind === "file"
  if (tab === "docs") return asset.kind === "doc"
  return asset.kind === "link"
}

function AssetGlyph({ asset }: { asset: ProjectLink }) {
  if (asset.kind === "folder") return <Folder className="h-5 w-5 text-sky-400" />
  if (asset.kind === "doc") return <FileText className="h-5 w-5 text-emerald-400" />
  if (asset.kind === "link") return <LinkIcon className="h-5 w-5 text-violet-400" />
  if (asset.mime_type?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-amber-400" />
  return <Upload className="h-5 w-5 text-muted-foreground" />
}

function assetMeta(asset: ProjectLink) {
  if (asset.kind === "folder") return "Folder"
  if (asset.kind === "doc") return "Document"
  if (asset.kind === "link") return assetTypeLabel(asset.type)
  return `Uploaded File${asset.size ? ` · ${bytes(asset.size)}` : ""}`
}

function sanitizeDocHtml(html?: string) {
  if (!html) return ""
  if (typeof window === "undefined") return html

  const doc = new DOMParser().parseFromString(html, "text/html")
  doc.querySelectorAll("script, style, iframe, object, embed").forEach(node => node.remove())
  doc.body.querySelectorAll("*").forEach(node => {
    Array.from(node.attributes).forEach(attribute => {
      if (attribute.name.startsWith("on")) node.removeAttribute(attribute.name)
      if (["href", "src"].includes(attribute.name) && attribute.value.trim().toLowerCase().startsWith("javascript:")) {
        node.removeAttribute(attribute.name)
      }
    })
  })
  return doc.body.innerHTML
}

const colorSwatches = ["#ffffff", "#f87171", "#f59e0b", "#facc15", "#4ade80", "#38bdf8", "#a78bfa"]
const highlightSwatches = ["#fef08a", "#bbf7d0", "#bae6fd", "#ddd6fe", "#fecdd3"]

function DocEditor({ value, onChange, placeholder, minHeight = "min-h-[520px]" }: { value: string; onChange: (value: string) => void; placeholder: string; minHeight?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: { class: "text-sky-400 underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn("doc-editor prose-target rounded-md border border-border bg-background px-10 py-8 text-sm leading-7 outline-none", minHeight),
      },
    },
    onUpdate: ({ editor: activeEditor }) => onChange(sanitizeDocHtml(activeEditor.getHTML())),
  })

  function addLink() {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", previousUrl ?? "https://")
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/20 p-2">
        <Button type="button" size="sm" variant={editor?.isActive("bold") ? "default" : "ghost"} className="h-8 px-2 font-bold" onClick={() => editor?.chain().focus().toggleBold().run()}>B</Button>
        <Button type="button" size="sm" variant={editor?.isActive("italic") ? "default" : "ghost"} className="h-8 px-2 italic" onClick={() => editor?.chain().focus().toggleItalic().run()}>I</Button>
        <Button type="button" size="sm" variant={editor?.isActive("underline") ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive("strike") ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive("heading", { level: 1 }) ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Button>
        <Button type="button" size="sm" variant={editor?.isActive("heading", { level: 2 }) ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
        <Button type="button" size="sm" variant={editor?.isActive("bulletList") ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive("orderedList") ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive("blockquote") ? "default" : "ghost"} className="h-8 px-2" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive("link") ? "default" : "ghost"} className="h-8 px-2" onClick={addLink}><LinkIcon className="h-4 w-4" /></Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Palette className="mx-1 h-4 w-4 text-muted-foreground" />
        {colorSwatches.map(color => (
          <button key={color} type="button" aria-label={`Text color ${color}`} className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: color }} onClick={() => editor?.chain().focus().setColor(color).run()} />
        ))}
        <div className="mx-1 h-6 w-px bg-border" />
        {highlightSwatches.map(color => (
          <button key={color} type="button" aria-label={`Highlight ${color}`} className="h-5 w-5 rounded-sm border border-border" style={{ backgroundColor: color }} onClick={() => editor?.chain().focus().toggleHighlight({ color }).run()} />
        ))}
        <div className="mx-1 h-6 w-px bg-border" />
        <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Button>
      </div>
      <div className="bg-muted/30 p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export function ProjectAssetsWorkspace({ project, mode }: { project: Project; mode: "admin" | "client" }) {
  const router = useRouter()
  const isAdmin = mode === "admin"
  const [assets, setAssets] = useState<ProjectLink[]>(() => normalizeProjectAssets(project.project_links))
  const [tab, setTab] = useState<AssetTab>("all")
  const [query, setQuery] = useState("")
  const [gridSize, setGridSize] = useState<GridSize>("small")
  const [sortMode, setSortMode] = useState<SortMode>("name-asc")
  const [folderId, setFolderId] = useState("")
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [createMode, setCreateMode] = useState<CreateMode>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState<{
    total: number
    completed: number
    currentFile: string
    succeeded: string[]
    failed: { name: string; reason: string }[]
  } | null>(null)
  const [uploadSummary, setUploadSummary] = useState<{
    kind: "success" | "partial" | "error"
    succeeded: number
    failed: { name: string; reason: string }[]
  } | null>(null)
  const [folderTitle, setFolderTitle] = useState("")
  const [linkForm, setLinkForm] = useState({ label: "", url: "", type: "figma" as ProjectLink["type"], notes: "" })
  const [docForm, setDocForm] = useState({ label: "", content: "", notes: "" })

  const folders = useMemo(() => assets.filter(asset => asset.kind === "folder"), [assets])
  const currentFolder = folders.find(folder => folder.id === folderId)
  const selectedAsset = assets.find(asset => asset.id === selectedAssetId)
  const isImagePreview = selectedAsset?.mime_type?.startsWith("image/")
  const isPdfPreview = selectedAsset?.mime_type === "application/pdf" || selectedAsset?.url?.toLowerCase().endsWith(".pdf")
  const selectedFolderChildren = selectedAsset?.kind === "folder" ? assets.filter(asset => asset.folder_id === selectedAsset.id && (isAdmin || asset.visible_to_client !== false)) : []

  const folderPath = useMemo(() => {
    const path: ProjectLink[] = []
    let cursor = currentFolder
    while (cursor) {
      path.unshift(cursor)
      cursor = folders.find(folder => folder.id === cursor?.folder_id)
    }
    return path
  }, [currentFolder, folders])

  const visibleAssets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return assets
      .filter(asset => isAdmin || asset.visible_to_client !== false)
      .filter(asset => matchesTab(asset, tab))
      .filter(asset => (asset.folder_id ?? "") === folderId)
      .filter(asset => `${asset.label} ${asset.notes ?? ""} ${asset.url ?? ""} ${asset.content ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (a.kind === "folder" && b.kind !== "folder") return -1
        if (a.kind !== "folder" && b.kind === "folder") return 1
        if (sortMode === "name-desc") return b.label.localeCompare(a.label)
        if (sortMode === "newest") return (b.created_at ?? "").localeCompare(a.created_at ?? "")
        if (sortMode === "type") return `${a.kind}-${a.label}`.localeCompare(`${b.kind}-${b.label}`)
        return a.label.localeCompare(b.label)
      })
  }, [assets, folderId, isAdmin, query, sortMode, tab])

  const gridClass = {
    small: "grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
    medium: "grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4",
    large: "grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  }[gridSize]

  async function save(nextAssets: ProjectLink[]) {
    setSaving(true)
    setError("")
    setAssets(nextAssets)
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_links: nextAssets }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      setError(payload?.error ?? "Could not save assets")
    }
    setSaving(false)
    router.refresh()
  }

  function addFolder() {
    if (!folderTitle.trim()) return
    void save([{
      id: createAssetId(),
      label: folderTitle.trim(),
      url: "",
      type: "folder",
      kind: "folder",
      folder_id: folderId,
      visible_to_client: true,
      created_at: new Date().toISOString(),
    }, ...assets])
    setFolderTitle("")
    setCreateMode(null)
  }

  function addLink() {
    if (!linkForm.label.trim() || !linkForm.url.trim()) return
    void save([{
      id: createAssetId(),
      label: linkForm.label.trim(),
      url: linkForm.url.trim(),
      type: linkForm.type ?? "other",
      kind: "link",
      notes: linkForm.notes.trim(),
      folder_id: folderId,
      visible_to_client: true,
      created_at: new Date().toISOString(),
    }, ...assets])
    setLinkForm({ label: "", url: "", type: "figma", notes: "" })
    setCreateMode(null)
  }

  function addDoc() {
    if (!docForm.label.trim()) return
    const doc: ProjectLink = {
      id: createAssetId(),
      label: docForm.label.trim(),
      url: "",
      type: "note",
      kind: "doc",
      content: docForm.content.trim(),
      notes: docForm.notes.trim(),
      folder_id: folderId,
      visible_to_client: true,
      created_at: new Date().toISOString(),
    }
    void save([doc, ...assets])
    setDocForm({ label: "", content: "", notes: "" })
    setCreateMode(null)
    setSelectedAssetId(doc.id ?? "")
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    const files = Array.from(fileList)
    setUploading(true)
    setError("")
    setUploadSummary(null)
    setUploadProgress({ total: files.length, completed: 0, currentFile: files[0]?.name ?? "", succeeded: [], failed: [] })

    const uploadedAssets: ProjectLink[] = []
    const succeeded: string[] = []
    const failed: { name: string; reason: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(prev => prev && { ...prev, currentFile: file.name, completed: i })

      try {
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch(`/api/projects/${project.id}/assets/upload`, { method: "POST", body: formData })
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload?.file) {
          failed.push({ name: file.name, reason: payload?.error ?? `HTTP ${response.status}` })
        } else {
          succeeded.push(payload.file.name)
          uploadedAssets.push({
            id: createAssetId(),
            label: payload.file.name,
            url: payload.file.url,
            type: "file",
            kind: "file",
            folder_id: folderId,
            visible_to_client: true,
            size: payload.file.size,
            mime_type: payload.file.type,
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        failed.push({ name: file.name, reason: err instanceof Error ? err.message : "Network error" })
      }

      setUploadProgress(prev => prev && {
        ...prev,
        completed: i + 1,
        succeeded: [...succeeded],
        failed: [...failed],
      })
    }

    setUploading(false)
    setUploadProgress(null)

    const summary = {
      kind: (failed.length === 0 ? "success" : succeeded.length === 0 ? "error" : "partial") as "success" | "partial" | "error",
      succeeded: succeeded.length,
      failed,
    }
    setUploadSummary(summary)

    // Save the successfully uploaded files (skip DB write if nothing succeeded)
    if (uploadedAssets.length) {
      await save([...uploadedAssets, ...assets])
    }

    // Auto-dismiss success after 5s; keep partial/error visible until user dismisses
    if (summary.kind === "success") {
      setTimeout(() => setUploadSummary(null), 5000)
    }
  }

  function removeAsset(assetId: string) {
    if (selectedAssetId === assetId) setSelectedAssetId("")
    if (folderId === assetId) setFolderId("")
    void save(assets.filter(asset => asset.id !== assetId && asset.folder_id !== assetId))
  }

  function updateAsset(assetId: string, updates: Partial<ProjectLink>) {
    void save(assets.map(asset => asset.id === assetId ? { ...asset, ...updates } : asset))
  }

  return (
    <div className="space-y-5">
      <style>{`
        .prose-target.ProseMirror {
          min-height: inherit;
          outline: none;
        }
        .prose-target.ProseMirror p {
          margin: 0 0 0.85rem;
        }
        .prose-target.ProseMirror h1 {
          font-size: 1.75rem;
          line-height: 2.15rem;
          font-weight: 750;
          margin: 0 0 1rem;
        }
        .prose-target.ProseMirror h2 {
          font-size: 1.35rem;
          line-height: 1.85rem;
          font-weight: 700;
          margin: 1.25rem 0 0.75rem;
        }
        .prose-target.ProseMirror h3 {
          font-size: 1.05rem;
          line-height: 1.55rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        .prose-target.ProseMirror ul,
        .prose-target.ProseMirror ol {
          padding-left: 1.35rem;
          margin: 0 0 1rem;
        }
        .prose-target.ProseMirror blockquote {
          border-left: 3px solid hsl(var(--border));
          color: hsl(var(--muted-foreground));
          margin: 1rem 0;
          padding-left: 1rem;
        }
        .prose-target.ProseMirror hr {
          border: 0;
          border-top: 1px solid hsl(var(--border));
          margin: 1.5rem 0;
        }
        .prose-target.ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{project.title}</p>
          <h1 className="text-2xl font-bold">Project assets</h1>
        </div>
        <Button variant="outline" asChild>
          <a href={mode === "admin" ? `/admin/projects/${project.id}` : `/client/projects/${project.id}`}>Back to project</a>
        </Button>
      </div>

      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button size="sm" onClick={() => { setSelectedAssetId(""); setCreateMode(createMode === "folder" ? null : "folder") }}><Plus className="h-4 w-4" /> Folder</Button>
              <Button size="sm" variant="outline" onClick={() => { setSelectedAssetId(""); setCreateMode(createMode === "doc" ? null : "doc") }}><FileText className="h-4 w-4" /> Doc</Button>
              <Button size="sm" variant="outline" onClick={() => { setSelectedAssetId(""); setCreateMode(createMode === "link" ? null : "link") }}><LinkIcon className="h-4 w-4" /> Link</Button>
              <label className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium",
                uploading ? "cursor-wait opacity-80" : "cursor-pointer hover:bg-accent"
              )}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading && uploadProgress
                  ? `Uploading ${uploadProgress.completed + 1}/${uploadProgress.total}…`
                  : "Upload"}
                <input type="file" className="sr-only" multiple disabled={uploading} onChange={event => { uploadFiles(event.target.files); event.target.value = "" }} />
              </label>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-lg border border-border p-1">
            {tabs.map(item => (
              <button key={item.value} onClick={() => setTab(item.value)} className={cn("rounded-md px-3 py-1.5 text-sm", tab === item.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-lg border border-border p-1">
              {(["small", "medium", "large"] as GridSize[]).map(size => (
                <button key={size} onClick={() => setGridSize(size)} className={cn("rounded-md px-2.5 py-1.5 text-xs capitalize", gridSize === size ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>{size}</button>
              ))}
            </div>
            <select value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="newest">Newest</option>
              <option value="type">Type</option>
            </select>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter by name, notes, URL" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className={cn("rounded-md px-2 py-1", !folderId && "bg-muted")} onClick={() => { setFolderId(""); setSelectedAssetId("") }}>Root</button>
        {folderPath.map(folder => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button className="rounded-md bg-muted px-2 py-1" onClick={() => { setFolderId(folder.id ?? ""); setSelectedAssetId("") }}>{folder.label}</button>
          </div>
        ))}
        {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
      </div>

      {createMode && isAdmin && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">{createMode === "folder" ? "New folder" : createMode === "doc" ? "New document" : "New link"}</p>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCreateMode(null)}><X className="h-4 w-4" /></Button>
          </div>
          {createMode === "folder" && (
            <div className="flex gap-2">
              <Input value={folderTitle} onChange={event => setFolderTitle(event.target.value)} placeholder="Folder name" />
              <Button onClick={addFolder} disabled={!folderTitle.trim()}>Create</Button>
            </div>
          )}
          {createMode === "link" && (
            <div className="grid gap-2 lg:grid-cols-12">
              <select value={linkForm.type} onChange={event => setLinkForm(prev => ({ ...prev, type: event.target.value as ProjectLink["type"] }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm lg:col-span-2">
                {ASSET_TYPES.filter(type => !["file", "folder", "note"].includes(type.value)).map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <Input className="lg:col-span-3" value={linkForm.label} onChange={event => setLinkForm(prev => ({ ...prev, label: event.target.value }))} placeholder="Title" />
              <Input className="lg:col-span-4" value={linkForm.url} onChange={event => setLinkForm(prev => ({ ...prev, url: event.target.value }))} placeholder="https://..." />
              <Input className="lg:col-span-2" value={linkForm.notes} onChange={event => setLinkForm(prev => ({ ...prev, notes: event.target.value }))} placeholder="Notes" />
              <Button onClick={addLink} disabled={!linkForm.label.trim() || !linkForm.url.trim()}>Add</Button>
            </div>
          )}
          {createMode === "doc" && (
            <div className="grid gap-2">
              <Input value={docForm.label} onChange={event => setDocForm(prev => ({ ...prev, label: event.target.value }))} placeholder="Document title" />
              <DocEditor value={docForm.content} onChange={content => setDocForm(prev => ({ ...prev, content }))} placeholder="Start writing this project document..." />
              <Button className="w-fit" onClick={addDoc} disabled={!docForm.label.trim()}>Create doc</Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {/* Upload progress banner */}
      {uploadProgress && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Uploading {uploadProgress.completed + (uploading ? 1 : 0)} of {uploadProgress.total}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {uploadProgress.succeeded.length} done
              {uploadProgress.failed.length > 0 && ` · ${uploadProgress.failed.length} failed`}
            </span>
          </div>
          {uploadProgress.currentFile && uploading && (
            <p className="text-xs text-muted-foreground truncate mb-2">
              Current: {uploadProgress.currentFile}
            </p>
          )}
          <div className="h-1.5 bg-blue-500/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload summary banner */}
      {uploadSummary && !uploadProgress && (
        <div className={cn(
          "rounded-lg border px-4 py-3 flex items-start gap-3",
          uploadSummary.kind === "success" && "border-green-500/40 bg-green-500/5",
          uploadSummary.kind === "partial" && "border-amber-500/40 bg-amber-500/5",
          uploadSummary.kind === "error" && "border-destructive/40 bg-destructive/10",
        )}>
          <div className="flex-shrink-0 pt-0.5">
            {uploadSummary.kind === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className={cn("h-5 w-5", uploadSummary.kind === "partial" ? "text-amber-600" : "text-destructive")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {uploadSummary.kind === "success" && `✓ ${uploadSummary.succeeded} file${uploadSummary.succeeded === 1 ? "" : "s"} uploaded successfully`}
              {uploadSummary.kind === "partial" && `${uploadSummary.succeeded} uploaded · ${uploadSummary.failed.length} failed`}
              {uploadSummary.kind === "error" && `Upload failed — 0 of ${uploadSummary.failed.length} files succeeded`}
            </p>
            {uploadSummary.failed.length > 0 && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Show {uploadSummary.failed.length} failed file{uploadSummary.failed.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-1 pl-3">
                  {uploadSummary.failed.map((f, i) => (
                    <li key={i} className="text-muted-foreground">
                      <span className="font-mono">{f.name}</span> — <span className="text-destructive">{f.reason}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <button
            onClick={() => setUploadSummary(null)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {createMode === "doc" ? null : visibleAssets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">This folder is empty</div>
      ) : (
        <div className={cn("grid", gridClass)}>
          {visibleAssets.map(asset => (
            <div
              key={asset.id}
              role="button"
              tabIndex={0}
              className={cn("group overflow-hidden rounded-lg border border-border bg-card text-left outline-none transition hover:border-muted-foreground/60 focus-visible:border-foreground", selectedAssetId === asset.id && "border-foreground")}
              onDoubleClick={() => asset.kind === "folder" && setFolderId(asset.id ?? "")}
              onClick={() => setSelectedAssetId(asset.id ?? "")}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setSelectedAssetId(asset.id ?? "")
                }
              }}
            >
              <div className="block w-full">
                <div className={cn("flex items-center justify-center bg-muted/30", gridSize === "small" ? "aspect-[5/3]" : "aspect-[4/3]")}>
                  {asset.kind === "file" && asset.mime_type?.startsWith("image/") ? (
                    <img src={asset.url} alt={asset.label} className="h-full w-full object-cover" />
                  ) : (
                    <AssetGlyph asset={asset} />
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3">
                <AssetGlyph asset={asset} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={asset.label}>{asset.label}</p>
                  <p className="text-xs text-muted-foreground">{asset.kind === "link" ? assetTypeLabel(asset.type) : asset.kind}{asset.size ? ` · ${bytes(asset.size)}` : ""}</p>
                </div>
                {isAdmin && (
                  <div className="flex opacity-70 group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={event => { event.stopPropagation(); updateAsset(asset.id ?? "", { visible_to_client: asset.visible_to_client === false }) }}>{asset.visible_to_client === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={event => { event.stopPropagation(); removeAsset(asset.id ?? "") }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAsset && (
        <aside className="fixed bottom-0 right-0 top-0 z-30 w-full overflow-y-auto border-l border-border bg-background p-5 shadow-2xl xl:w-[430px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Preview</p>
              <h2 className="truncate font-semibold">{selectedAsset.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{assetMeta(selectedAsset)}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setSelectedAssetId("")}><X className="h-4 w-4" /></Button>
          </div>
          <div className="mt-5 space-y-4">
            {selectedAsset.kind === "folder" ? (
              <>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Folder className="h-8 w-8 text-sky-400" />
                    <div>
                      <p className="text-sm font-medium">{selectedFolderChildren.length} items</p>
                      <p className="text-xs text-muted-foreground">Folder preview</p>
                    </div>
                  </div>
                  {selectedFolderChildren.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">This folder is empty</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedFolderChildren.slice(0, 6).map(child => (
                        <div key={child.id} className="overflow-hidden rounded-md border border-border bg-background">
                          <div className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                            {child.kind === "file" && child.mime_type?.startsWith("image/") ? <img src={child.url} alt={child.label} className="h-full w-full object-cover" /> : <AssetGlyph asset={child} />}
                          </div>
                          <p className="truncate px-2 py-1.5 text-xs" title={child.label}>{child.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={() => { setFolderId(selectedAsset.id ?? ""); setSelectedAssetId("") }}>Open folder</Button>
              </>
            ) : selectedAsset.kind === "doc" ? (
              isAdmin ? (
                <>
                  <Input value={selectedAsset.label} onChange={event => updateAsset(selectedAsset.id ?? "", { label: event.target.value })} />
                  <DocEditor value={selectedAsset.content ?? ""} onChange={content => updateAsset(selectedAsset.id ?? "", { content })} placeholder="Write this project document..." />
                </>
              ) : (
                <div className="min-h-[55vh] rounded-lg border border-border bg-muted/30 p-6 text-sm leading-7" dangerouslySetInnerHTML={{ __html: sanitizeDocHtml(selectedAsset.content) }} />
              )
            ) : isImagePreview ? (
              <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                <img src={selectedAsset.url} alt={selectedAsset.label} className="max-h-[72vh] w-full object-contain" />
              </div>
            ) : isPdfPreview ? (
              <iframe src={selectedAsset.url} title={selectedAsset.label} className="h-[72vh] w-full rounded-lg border border-border" />
            ) : (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">Preview unavailable for this file type.</div>
            )}
            {selectedAsset.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedAsset.notes}</p>}
            {selectedAsset.url && (
              <Button variant="outline" asChild>
                <a href={selectedAsset.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Open</a>
              </Button>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

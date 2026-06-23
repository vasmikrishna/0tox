"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Wand2, Upload, ImageIcon, MousePointerClick, Search, Check, Loader2, X } from "lucide-react"

export interface SelectedElement {
  editKey: string
  content: string
  tagName: string
  s9Type: "text" | "image"
}

export function EditorPanel({
  selected,
  onUpdate,
  onUpdateAttr,
  businessName,
}: {
  selected: SelectedElement | null
  onUpdate: (editKey: string, content: string) => void
  onUpdateAttr: (editKey: string, attr: string, value: string) => void
  businessName: string
}) {
  if (!selected) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
        <MousePointerClick className="h-8 w-8" />
        <p className="text-sm">Click any element in the preview to edit it</p>
      </div>
    )
  }

  return (
    <EditorPanelInner
      key={selected.editKey}
      selected={selected}
      onUpdate={onUpdate}
      onUpdateAttr={onUpdateAttr}
      businessName={businessName}
    />
  )
}

function EditorPanelInner({
  selected,
  onUpdate,
  onUpdateAttr,
  businessName,
}: {
  selected: SelectedElement
  onUpdate: (editKey: string, content: string) => void
  onUpdateAttr: (editKey: string, attr: string, value: string) => void
  businessName: string
}) {
  const [editValue, setEditValue] = useState(selected.content)
  const [imageUrl, setImageUrl] = useState(selected.s9Type === "image" ? selected.content : "")
  const [aiInstruction, setAiInstruction] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{
    id: string; thumb: string; full: string; alt: string
    source: "unsplash" | "pexels" | "pixabay"; photographer: string
  }>>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAiRewrite() {
    if (!aiInstruction.trim()) return
    setError("")
    setAiLoading(true)
    try {
      const res = await fetch("/api/build/edit-element", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentContent: editValue,
          instruction: aiInstruction,
          businessName,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "AI edit failed")
        return
      }
      setEditValue(data.content)
      onUpdate(selected.editKey, data.content)
      setAiInstruction("")
    } catch {
      setError("Could not reach AI. Try again.")
    } finally {
      setAiLoading(false)
    }
  }

  async function handleImageUpload(file: File) {
    setError("")
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/build/upload", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Upload failed")
        return
      }
      setImageUrl(data.url)
      onUpdateAttr(selected.editKey, "src", data.url)
    } catch {
      setError("Upload failed. Try again.")
    } finally {
      setUploadLoading(false)
    }
  }

  function handleImageUrlSubmit() {
    if (!imageUrl.trim()) return
    onUpdateAttr(selected.editKey, "src", imageUrl.trim())
  }

  async function handleImageSearch() {
    if (!searchQuery.trim()) return
    setError("")
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/build/image-search?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Search failed")
        return
      }
      setSearchResults(data.results ?? [])
      if ((data.results ?? []).length === 0) {
        setError("No images found. Try a different search term.")
      }
    } catch {
      setError("Search failed. Try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleSelectSearchImage(result: (typeof searchResults)[0]) {
    setError("")
    setDownloadingId(result.id)
    try {
      const res = await fetch("/api/build/image-search/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.full }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Failed to save image")
        return
      }
      setImageUrl(data.url)
      onUpdateAttr(selected.editKey, "src", data.url)
      setShowSearch(false)
      setSearchResults([])
      setSearchQuery("")
    } catch {
      setError("Could not save image. Try again.")
    } finally {
      setDownloadingId(null)
    }
  }

  const zoneName = selected.editKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4" data-testid="editor-panel">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Editing</p>
        <p className="font-semibold">{zoneName}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {selected.s9Type === "text" && (
        <>
          <Textarea
            rows={5}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-sm"
            data-testid="editor-text"
          />
          <Button
            size="sm"
            variant="brand"
            data-testid="editor-update"
            onClick={() => onUpdate(selected.editKey, editValue)}
          >
            Update
          </Button>

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">AI Rewrite</p>
            <Input
              placeholder="e.g. Make it more friendly..."
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiRewrite()}
              data-testid="editor-ai-input"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              loading={aiLoading}
              disabled={!aiInstruction.trim()}
              data-testid="editor-ai-rewrite"
              onClick={handleAiRewrite}
            >
              <Wand2 className="h-3.5 w-3.5" /> Rewrite with AI
            </Button>
          </div>
        </>
      )}

      {selected.s9Type === "image" && (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl || selected.content}
              alt="Current"
              className="aspect-video w-full object-cover"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImageUpload(f)
            }}
          />
          <Button
            size="sm"
            variant="brand"
            loading={uploadLoading}
            data-testid="editor-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Upload image
          </Button>

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Or paste an image URL</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                data-testid="editor-image-url"
              />
              <Button size="sm" variant="outline" onClick={handleImageUrlSubmit}>
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Search free images</p>
              {showSearch && (
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery("") }}
                  data-testid="editor-search-close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {!showSearch ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowSearch(true)}
                data-testid="editor-search-toggle"
              >
                <Search className="h-3.5 w-3.5" /> Search Photos
              </Button>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. salon interior, hair styling..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleImageSearch()}
                    data-testid="editor-image-search"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="brand"
                    disabled={!searchQuery.trim()}
                    loading={searchLoading}
                    onClick={handleImageSearch}
                    data-testid="editor-image-search-btn"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2" data-testid="editor-search-results">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="group relative overflow-hidden rounded-lg border border-border transition-colors hover:border-primary"
                        onClick={() => handleSelectSearchImage(result)}
                        disabled={downloadingId !== null}
                        data-testid={`search-result-${result.id}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={result.thumb}
                          alt={result.alt}
                          className="aspect-video w-full object-cover"
                          loading="lazy"
                        />
                        {downloadingId === result.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all group-hover:bg-background/50 group-hover:opacity-100">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-3">
                          <p className="truncate text-[10px] text-white/80">
                            {result.photographer}
                            <span className="ml-1 rounded bg-white/20 px-1 text-[9px]">{result.source}</span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Wand2, Upload, ImageIcon, MousePointerClick } from "lucide-react"

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
        </>
      )}
    </div>
  )
}

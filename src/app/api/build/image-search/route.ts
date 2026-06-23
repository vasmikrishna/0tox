import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"

export const runtime = "nodejs"

interface SearchResult {
  id: string
  thumb: string
  full: string
  alt: string
  source: "unsplash" | "pexels" | "pixabay"
  photographer: string
  photographerUrl: string
}

async function searchUnsplash(query: string, perPage: number): Promise<SearchResult[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map((p: Record<string, unknown>) => ({
      id: `unsplash-${p.id}`,
      thumb: (p.urls as Record<string, string>).small,
      full: (p.urls as Record<string, string>).regular,
      alt: (p.alt_description as string) ?? query,
      source: "unsplash" as const,
      photographer: (p.user as Record<string, string>).name,
      photographerUrl: (p.user as Record<string, unknown>).links
        ? ((p.user as Record<string, unknown>).links as Record<string, string>).html
        : "",
    }))
  } catch {
    return []
  }
}

async function searchPexels(query: string, perPage: number): Promise<SearchResult[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
    const res = await fetch(url, {
      headers: { Authorization: key },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.photos ?? []).map((p: Record<string, unknown>) => ({
      id: `pexels-${p.id}`,
      thumb: (p.src as Record<string, string>).medium,
      full: (p.src as Record<string, string>).large,
      alt: p.alt ?? query,
      source: "pexels" as const,
      photographer: p.photographer as string,
      photographerUrl: p.photographer_url as string,
    }))
  } catch {
    return []
  }
}

async function searchPixabay(query: string, perPage: number): Promise<SearchResult[]> {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return []
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo&orientation=horizontal`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits ?? []).map((p: Record<string, unknown>) => ({
      id: `pixabay-${p.id}`,
      thumb: p.webformatURL as string,
      full: p.largeImageURL as string,
      alt: (p.tags as string) ?? query,
      source: "pixabay" as const,
      photographer: p.user as string,
      photographerUrl: `https://pixabay.com/users/${p.user}-${p.user_id}/`,
    }))
  } catch {
    return []
  }
}

export async function GET(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.trim()
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 })

  const perPage = 10

  const [unsplash, pexels, pixabay] = await Promise.all([
    searchUnsplash(query, perPage),
    searchPexels(query, perPage),
    searchPixabay(query, perPage),
  ])

  // Interleave results from all sources
  const merged: SearchResult[] = []
  const maxLen = Math.max(unsplash.length, pexels.length, pixabay.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < unsplash.length) merged.push(unsplash[i])
    if (i < pexels.length) merged.push(pexels[i])
    if (i < pixabay.length) merged.push(pixabay[i])
  }

  const configured = [
    process.env.UNSPLASH_ACCESS_KEY ? "unsplash" : null,
    process.env.PEXELS_API_KEY ? "pexels" : null,
    process.env.PIXABAY_API_KEY ? "pixabay" : null,
  ].filter(Boolean)

  return NextResponse.json({ results: merged, sources: configured })
}

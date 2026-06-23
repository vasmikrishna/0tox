import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

let client: S3Client | null = null

function env(name: string) {
  const value = process.env[name]?.trim()
  return value || undefined
}

export function isR2Configured() {
  return !!(
    (env("R2_ENDPOINT") || env("R2_ACCOUNT_ID")) &&
    env("R2_ACCESS_KEY_ID") &&
    env("R2_SECRET_ACCESS_KEY") &&
    env("R2_BUCKET_NAME")
  )
}

function getR2Client() {
  if (!client) {
    const endpoint = env("R2_ENDPOINT") ?? `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`

    client = new S3Client({
      region: env("R2_REGION") ?? "auto",
      endpoint,
      credentials: {
        accessKeyId: env("R2_ACCESS_KEY_ID") ?? "",
        secretAccessKey: env("R2_SECRET_ACCESS_KEY") ?? "",
      },
    })
  }

  return client
}

function safeFilename(filename: string) {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
  return cleaned || "upload"
}

function appFileUrl(key: string) {
  const encoded = key.split("/").map(encodeURIComponent).join("/")
  // When a public R2/Cloudflare domain is configured, link straight to it so
  // files are served from Cloudflare's edge (zero egress) instead of being
  // proxied through the Vercel app. Falls back to the in-app proxy otherwise,
  // which keeps older uploads (stored as /api/resources/files/...) working.
  const publicBase = env("R2_PUBLIC_URL")
  if (publicBase) {
    return `${publicBase.replace(/\/+$/, "")}/${encoded}`
  }
  return `/api/resources/files/${encoded}`
}

export async function uploadToR2(file: File, folder: string) {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured")
  }

  const bucket = env("R2_BUCKET_NAME") ?? ""
  const filename = safeFilename(file.name)
  const key = `${folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${crypto.randomUUID()}-${filename}`
  const body = Buffer.from(await file.arrayBuffer())

  await getR2Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: file.type || "application/octet-stream",
    CacheControl: "max-age=31536000",
  }))

  return {
    key,
    url: appFileUrl(key),
    name: file.name,
    size: body.length,
  }
}

export async function uploadBufferToR2(buffer: Buffer, key: string, contentType: string) {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured")
  }

  const bucket = env("R2_BUCKET_NAME") ?? ""
  await getR2Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "max-age=31536000",
  }))

  return appFileUrl(key)
}

export async function getR2Object(key: string) {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured")
  }

  return getR2Client().send(new GetObjectCommand({
    Bucket: env("R2_BUCKET_NAME") ?? "",
    Key: key,
  }))
}

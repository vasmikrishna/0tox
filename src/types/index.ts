export type UserRole = "client" | "admin"
export type DefaultServiceTier = "starter" | "standard" | "pro"
export type ServiceTier = DefaultServiceTier | (string & {})
export type ProjectStatus = "intake" | "review" | "active" | "completed" | "cancelled"
export type StageStatus = "pending" | "in_progress" | "completed"
export type PaymentStatus = "pending" | "paid" | "overdue"
export type PaymentMethod = "stripe" | "bank_transfer" | "other"
export type QuestionType = "text" | "textarea" | "select" | "checkbox" | "file" | "industry"

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: UserRole
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  title: string
  service_tier: ServiceTier
  status: ProjectStatus
  github_url?: string
  project_links?: ProjectLink[]
  admin_notes?: string
  created_at: string
  started_at?: string
  completed_at?: string
  client?: User
}

export interface ProjectLink {
  id?: string
  label: string
  url: string
  type?: "figma" | "sheet" | "doc" | "drive" | "website" | "other" | "file" | "folder" | "note"
  kind?: "link" | "folder" | "doc" | "file"
  notes?: string
  content?: string
  folder_id?: string
  visible_to_client?: boolean
  size?: number
  mime_type?: string
  created_at?: string
}

export interface IntakeQuestion {
  id: string
  service_tier: ServiceTier
  label: string
  type: QuestionType
  options?: string[]
  required: boolean
  sort_order: number
  active: boolean
}

export interface IntakeResponse {
  id: string
  project_id: string
  question_id: string
  answer: string
  file_urls?: string[]
  question?: IntakeQuestion
}

export interface Stage {
  id: string
  project_id: string
  name: string
  description?: string
  status: StageStatus
  visible_to_client: boolean
  due_date?: string
  completed_at?: string
  sort_order: number
  deliverable_files?: DeliverableFile[]
}

export interface DeliverableFile {
  id: string
  stage_id: string
  name: string
  url: string
  size: number
  uploaded_at: string
}

export interface Payment {
  id: string
  project_id: string
  label: string
  amount: number
  status: PaymentStatus
  method?: PaymentMethod
  due_date?: string
  paid_at?: string
  stripe_payment_intent_id?: string
  notes?: string
}

export interface PortfolioItem {
  id: string
  title: string
  description?: string
  service_tier?: ServiceTier
  tags?: string[]
  image_url: string
  live_url?: string
  visible: boolean
  sort_order: number
  created_at: string
}

export interface Service {
  id: string
  tier: ServiceTier
  name: string
  tagline: string
  description: string
  price_label: string
  features: string[]
  active: boolean
}

export interface StageTemplate {
  id: string
  service_tier: ServiceTier
  name: string
  description?: string
  sort_order: number
}

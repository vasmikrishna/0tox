export type UserRole = "client" | "admin" | "employee"
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
  job_title?: string
  phone?: string
  bio?: string
  status?: "active" | "inactive"
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
  stage_id?: string
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

export interface ProjectAssignment {
  id: string
  project_id: string
  employee_id: string
  assigned_by?: string
  assigned_at: string
  employee?: User
}

export interface AuditLog {
  id: string
  project_id?: string
  user_id?: string
  user_email: string
  action: string
  entity_type?: string
  entity_id?: string
  changes?: Record<string, { old: unknown; new: unknown }>
  created_at: string
}

// ── Survey Types ───────────────────────────────────────────────────────────

export type SurveyStatus = "draft" | "active" | "closed"

export type SurveyQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "rating"
  | "date"
  | "file_upload"
  | "number"
  | "email"
  | "phone"

export interface Survey {
  id: string
  created_by: string
  title: string
  description?: string
  slug: string
  status: SurveyStatus
  project_id?: string
  allow_anonymous: boolean
  collect_email: boolean
  one_response: boolean
  thank_you_message: string
  created_at: string
  updated_at: string
  project?: Pick<Project, "id" | "title">
  question_count?: number
  submission_count?: number
}

export interface SurveySection {
  id: string
  survey_id: string
  title?: string
  description?: string
  sort_order: number
  questions?: SurveyQuestion[]
}

export interface SurveyQuestionConfig {
  min?: number
  max?: number
  accept?: string
  placeholder?: string
}

export interface SurveyQuestion {
  id: string
  survey_id: string
  section_id?: string
  type: SurveyQuestionType
  label: string
  description?: string
  required: boolean
  options?: string[]
  config?: SurveyQuestionConfig
  sort_order: number
}

export interface SurveySubmission {
  id: string
  survey_id: string
  respondent_id?: string
  respondent_email?: string
  submitted_at: string
  answers?: SurveyAnswer[]
}

export interface SurveyAnswer {
  id: string
  submission_id: string
  question_id: string
  value?: string
  values?: string[]
  file_urls?: string[]
}

// ── E-commerce Types ─────────────────────────────────────────────────────────

export type ProductStatus = "draft" | "active" | "archived"
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded"

export interface Product {
  id: string
  tenant_id?: string | null
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number | null
  sku?: string
  stock_quantity: number
  manage_stock: boolean
  status: ProductStatus
  image_url?: string
  images?: string[]
  category?: string
  sort_order: number
  created_at: string
  updated_at?: string
}

export interface Order {
  id: string
  tenant_id?: string | null
  customer_id?: string | null
  customer_name?: string
  customer_email: string
  total: number
  currency: string
  status: OrderStatus
  stripe_session_id?: string
  stripe_payment_intent_id?: string
  notes?: string
  paid_at?: string
  created_at: string
  updated_at?: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string | null
  name: string
  price: number
  quantity: number
  created_at?: string
  product?: Product
}

/** A single line item in the client-side cart (persisted to localStorage). */
export interface CartItem {
  product_id: string
  slug: string
  name: string
  price: number
  image_url?: string
  quantity: number
  stock_quantity: number
  manage_stock: boolean
}

// ── Builder Content Management Types ────────────────────────────────────────

export type ContentStatus = "draft" | "approved" | "archived"

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "testimonials"
  | "pricing"
  | "faq"
  | "team"
  | "gallery"
  | "cta"
  | "footer"
  | "contact"

export interface SectionTemplate {
  id: string
  name: string
  section_type: SectionType
  description: string
  html: string
  css: string
  preview_url: string | null
  tags: string[]
  sort_order: number
  status: ContentStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ColorPaletteColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  muted: string
}

export interface ReferenceSite {
  id: string
  name: string
  description: string
  industry: string
  html: string
  css: string
  thumbnail_url: string | null
  sort_order: number
  status: ContentStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ColorPalette {
  id: string
  name: string
  colors: ColorPaletteColors
  industry: string
  sort_order: number
  status: ContentStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Page Builder Types ───────────────────────────────────────────────────────

export type CustomPageStatus = "draft" | "published"

export interface CustomPage {
  id: string
  tenant_id?: string | null
  slug: string
  title: string
  html: string
  css: string
  template: string
  status: CustomPageStatus
  is_homepage: boolean
  created_at: string
  updated_at?: string
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface Booking {
  id: string
  tenant_id?: string | null
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  service?: string | null
  starts_at: string
  ends_at: string
  status: BookingStatus
  notes?: string | null
  created_at: string
  updated_at?: string
}

export interface CalendarBlock {
  id: string
  tenant_id?: string | null
  title: string
  starts_at: string
  ends_at: string
  all_day: boolean
  created_at: string
}

import type { DeliverableFile, IntakeQuestion, IntakeResponse, Payment, PortfolioItem, Project, Service, Stage, StageTemplate, User, Product, Order, OrderItem, CustomPage } from "@/types"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type BaseRow = { id: string; [key: string]: unknown }

type Table<Row extends BaseRow = BaseRow> = {
  Row: Row
  Insert: { [Key in keyof Row]?: Row[Key] | null }
  Update: { [Key in keyof Row]?: Row[Key] | null }
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      users: Table<User & BaseRow>
      services: Table<Service & BaseRow>
      intake_questions: Table<IntakeQuestion & BaseRow>
      projects: Table<Project & BaseRow>
      intake_responses: Table<IntakeResponse & BaseRow>
      stages: Table<Stage & BaseRow>
      deliverable_files: Table<DeliverableFile & BaseRow>
      payments: Table<Payment & BaseRow>
      portfolio_items: Table<PortfolioItem & BaseRow>
      stage_templates: Table<StageTemplate & BaseRow>
      products: Table<Product & BaseRow>
      orders: Table<Order & BaseRow>
      order_items: Table<OrderItem & BaseRow>
      custom_pages: Table<CustomPage & BaseRow>
    }
    Views: Record<string, never>
    Functions: {
      decrement_product_stock: {
        Args: { p_product_id: string; p_qty: number }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

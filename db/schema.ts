import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("LabSpace 实验室"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(20),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("FlaskConical"),
  color: text("color").notNull().default("#2563eb"),
  description: text("description").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const containers = sqliteTable("containers", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  type: text("type").notNull().default("custom"),
  icon: text("icon").notNull().default("Archive"),
  color: text("color").notNull().default("#64748b"),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  containerId: text("container_id"),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("FlaskConical"),
  iconColor: text("icon_color").notNull().default("#2563eb"),
  category: text("category").notNull().default("其他"),
  stockEnabled: integer("stock_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  stockMode: text("stock_mode").notNull().default("percentage"),
  stockPercent: integer("stock_percent").notNull().default(100),
  initialQuantity: real("initial_quantity"),
  currentQuantity: real("current_quantity"),
  unit: text("unit").notNull().default("个"),
  brand: text("brand").notNull().default(""),
  specification: text("specification").notNull().default(""),
  casNumber: text("cas_number").notNull().default(""),
  expiryDate: text("expiry_date"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  message: text("message").notNull(),
  beforeData: text("before_data"),
  afterData: text("after_data"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

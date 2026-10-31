import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionUrl =
  "https://labspace-harlemonica-20261028.christophersmith2737.chatgpt.site/api/state";
const localStatePath = path.join(projectRoot, ".wrangler", "state");
const backupRoot = path.join(projectRoot, "backups");
const syncSqlPath = path.join(projectRoot, ".wrangler", "sync-production.sql");
const wranglerConfig = path.join(projectRoot, "dist", "server", "wrangler.json");

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`无法写入非有限数字：${value}`);
    return String(value);
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, columns, row) {
  const names = columns.map(([column]) => `"${column}"`).join(", ");
  const values = columns.map(([, key]) => sqlValue(row[key])).join(", ");
  return `INSERT INTO "${table}" (${names}) VALUES (${values});`;
}

if (!existsSync(wranglerConfig)) {
  throw new Error("缺少 dist/server/wrangler.json，请先运行 npm run build。");
}

const response = await fetch(productionUrl, {
  headers: { accept: "application/json" },
});
if (!response.ok) {
  throw new Error(`读取正式网站失败：HTTP ${response.status}`);
}
const state = await response.json();
if (!state.workspace || !Array.isArray(state.rooms) || !Array.isArray(state.items)) {
  throw new Error("正式网站返回的数据格式不正确。");
}

mkdirSync(backupRoot, { recursive: true });
if (existsSync(localStatePath)) {
  const backupPath = path.join(backupRoot, `pre-production-sync-${timestamp()}`);
  cpSync(localStatePath, path.join(backupPath, "state"), { recursive: true });
  console.log(`原本地数据库已备份到：${backupPath}`);
}

const statements = [
  "PRAGMA foreign_keys = OFF;",
  "BEGIN TRANSACTION;",
  'DELETE FROM "activity_logs";',
  'DELETE FROM "items";',
  'DELETE FROM "containers";',
  'DELETE FROM "rooms";',
  'DELETE FROM "workspaces";',
  insert(
    "workspaces",
    [
      ["id", "id"],
      ["name", "name"],
      ["low_stock_threshold", "lowStockThreshold"],
      ["created_at", "createdAt"],
      ["updated_at", "updatedAt"],
    ],
    state.workspace,
  ),
];

for (const room of state.rooms) {
  statements.push(
    insert(
      "rooms",
      [
        ["id", "id"],
        ["workspace_id", "workspaceId"],
        ["name", "name"],
        ["icon", "icon"],
        ["color", "color"],
        ["description", "description"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
      ],
      room,
    ),
  );
}

for (const container of state.containers ?? []) {
  statements.push(
    insert(
      "containers",
      [
        ["id", "id"],
        ["room_id", "roomId"],
        ["parent_id", "parentId"],
        ["name", "name"],
        ["type", "type"],
        ["icon", "icon"],
        ["color", "color"],
        ["description", "description"],
        ["sort_order", "sortOrder"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
      ],
      container,
    ),
  );
}

for (const item of state.items) {
  statements.push(
    insert(
      "items",
      [
        ["id", "id"],
        ["room_id", "roomId"],
        ["container_id", "containerId"],
        ["name", "name"],
        ["icon", "icon"],
        ["icon_color", "iconColor"],
        ["category", "category"],
        ["stock_enabled", "stockEnabled"],
        ["stock_mode", "stockMode"],
        ["stock_percent", "stockPercent"],
        ["initial_quantity", "initialQuantity"],
        ["current_quantity", "currentQuantity"],
        ["unit", "unit"],
        ["brand", "brand"],
        ["specification", "specification"],
        ["cas_number", "casNumber"],
        ["expiry_date", "expiryDate"],
        ["notes", "notes"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
      ],
      item,
    ),
  );
}

for (const log of state.logs ?? []) {
  statements.push(
    insert(
      "activity_logs",
      [
        ["id", "id"],
        ["workspace_id", "workspaceId"],
        ["action", "action"],
        ["entity_type", "entityType"],
        ["entity_id", "entityId"],
        ["entity_name", "entityName"],
        ["message", "message"],
        ["before_data", "beforeData"],
        ["after_data", "afterData"],
        ["created_at", "createdAt"],
      ],
      log,
    ),
  );
}

statements.push("COMMIT;", "PRAGMA foreign_keys = ON;");
mkdirSync(path.dirname(syncSqlPath), { recursive: true });
writeFileSync(syncSqlPath, `${statements.join("\n")}\n`, "utf8");

const wrangler = spawnSync(
  process.execPath,
  [
    "--import",
    "./scripts/sites-env.mjs",
    "./node_modules/wrangler/bin/wrangler.js",
    "d1",
    "execute",
    "site-creator-d1",
    "--local",
    "--persist-to",
    ".wrangler/state",
    "--config",
    "dist/server/wrangler.json",
    "--file",
    ".wrangler/sync-production.sql",
  ],
  { cwd: projectRoot, stdio: "inherit" },
);

rmSync(syncSqlPath, { force: true });
if (wrangler.status !== 0) {
  throw new Error(`Wrangler 写入本地数据库失败，退出码：${wrangler.status}`);
}

console.log(
  `同步完成：${state.rooms.length} 个房间，${state.containers?.length ?? 0} 个容器，${state.items.length} 个物品。`,
);

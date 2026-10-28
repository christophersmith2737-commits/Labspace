import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import medicineCatalog from "../../../data/medicine-catalog-261021.json";
import {
  activityLogs,
  containers,
  items,
  rooms,
  workspaces,
} from "../../../db/schema";

export const dynamic = "force-dynamic";
const WORKSPACE_ID = "default-workspace";

type RecordLike = Record<string, unknown>;
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const clamp = (value: unknown, min: number, max: number) =>
  Math.max(min, Math.min(max, Number(value) || 0));

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "未知错误";
  if (message.includes("no such table"))
    return "数据库尚未初始化，请先应用迁移。";
  return message;
}

async function log(
  db: ReturnType<typeof getDb>,
  data: {
    action: string;
    entityType: string;
    entityId: string;
    entityName: string;
    message: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await db.insert(activityLogs).values({
    id: id(),
    workspaceId: WORKSPACE_ID,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
    message: data.message,
    beforeData: data.before ? JSON.stringify(data.before) : null,
    afterData: data.after ? JSON.stringify(data.after) : null,
  });
}

async function ensureWorkspace() {
  const db = getDb();
  const found = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, WORKSPACE_ID))
    .limit(1);
  if (!found.length) {
    await db
      .insert(workspaces)
      .values({ id: WORKSPACE_ID, name: "LabSpace 实验室" });
  }
}

async function snapshot() {
  await ensureWorkspace();
  const db = getDb();
  const [[workspace], roomRows, containerRows, itemRows, logRows] =
    await Promise.all([
      db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, WORKSPACE_ID))
        .limit(1),
      db
        .select()
        .from(rooms)
        .where(eq(rooms.workspaceId, WORKSPACE_ID))
        .orderBy(asc(rooms.createdAt)),
      db
        .select()
        .from(containers)
        .orderBy(asc(containers.sortOrder), asc(containers.createdAt)),
      db.select().from(items).orderBy(desc(items.updatedAt)),
      db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.workspaceId, WORKSPACE_ID))
        .orderBy(desc(activityLogs.createdAt))
        .limit(80),
    ]);
  return {
    workspace,
    rooms: roomRows,
    containers: containerRows,
    items: itemRows,
    logs: logRows,
  };
}

export async function GET() {
  try {
    return Response.json(await snapshot());
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureWorkspace();
    const db = getDb();
    const body = (await request.json()) as {
      action?: string;
      payload?: RecordLike;
    };
    const action = body.action ?? "";
    const p = body.payload ?? {};

    if (action === "createRoom") {
      const name = String(p.name ?? "").trim();
      if (!name)
        return Response.json({ error: "房间名称不能为空" }, { status: 400 });
      const room = {
        id: id(),
        workspaceId: WORKSPACE_ID,
        name,
        icon: String(p.icon || "FlaskConical"),
        color: String(p.color || "#2563eb"),
        description: String(p.description || ""),
      };
      await db.insert(rooms).values(room);
      await log(db, {
        action,
        entityType: "room",
        entityId: room.id,
        entityName: name,
        message: `创建房间「${name}」`,
        after: room,
      });
    } else if (action === "updateRoom") {
      const roomId = String(p.id);
      const [before] = await db
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);
      if (!before)
        return Response.json({ error: "房间不存在" }, { status: 404 });
      const patch = {
        name: String(p.name ?? before.name).trim(),
        icon: String(p.icon ?? before.icon),
        color: String(p.color ?? before.color),
        description: String(p.description ?? before.description),
        updatedAt: now(),
      };
      await db.update(rooms).set(patch).where(eq(rooms.id, roomId));
      await log(db, {
        action,
        entityType: "room",
        entityId: roomId,
        entityName: patch.name,
        message: `更新房间「${patch.name}」`,
        before,
        after: patch,
      });
    } else if (action === "deleteRoom") {
      const roomId = String(p.id);
      const [before] = await db
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);
      if (!before)
        return Response.json({ error: "房间不存在" }, { status: 404 });
      await log(db, {
        action,
        entityType: "room",
        entityId: roomId,
        entityName: before.name,
        message: `删除房间「${before.name}」及其内容`,
        before,
      });
      await db.delete(rooms).where(eq(rooms.id, roomId));
    } else if (action === "createContainer") {
      const name = String(p.name ?? "").trim();
      const roomId = String(p.roomId ?? "");
      if (!name || !roomId)
        return Response.json({ error: "名称和房间不能为空" }, { status: 400 });
      const parentId = p.parentId ? String(p.parentId) : null;
      if (parentId) {
        const [parent] = await db
          .select()
          .from(containers)
          .where(
            and(eq(containers.id, parentId), eq(containers.roomId, roomId)),
          )
          .limit(1);
        if (!parent)
          return Response.json({ error: "父容器不存在" }, { status: 400 });
      }
      const row = {
        id: id(),
        roomId,
        parentId,
        name,
        type: String(p.type || "custom"),
        icon: String(p.icon || "Archive"),
        color: String(p.color || "#64748b"),
        description: String(p.description || ""),
      };
      await db.insert(containers).values(row);
      await log(db, {
        action,
        entityType: "container",
        entityId: row.id,
        entityName: name,
        message: `创建容器「${name}」`,
        after: row,
      });
    } else if (action === "updateContainer") {
      const containerId = String(p.id);
      const [before] = await db
        .select()
        .from(containers)
        .where(eq(containers.id, containerId))
        .limit(1);
      if (!before)
        return Response.json({ error: "容器不存在" }, { status: 404 });
      const patch = {
        name: String(p.name ?? before.name).trim(),
        type: String(p.type ?? before.type),
        icon: String(p.icon ?? before.icon),
        color: String(p.color ?? before.color),
        description: String(p.description ?? before.description),
        updatedAt: now(),
      };
      await db
        .update(containers)
        .set(patch)
        .where(eq(containers.id, containerId));
      await log(db, {
        action,
        entityType: "container",
        entityId: containerId,
        entityName: patch.name,
        message: `更新容器「${patch.name}」`,
        before,
        after: patch,
      });
    } else if (action === "deleteContainer") {
      const containerId = String(p.id);
      const [before] = await db
        .select()
        .from(containers)
        .where(eq(containers.id, containerId))
        .limit(1);
      if (!before)
        return Response.json({ error: "容器不存在" }, { status: 404 });
      const all = await db.select().from(containers);
      const descendants = new Set<string>([containerId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of all)
          if (
            c.parentId &&
            descendants.has(c.parentId) &&
            !descendants.has(c.id)
          ) {
            descendants.add(c.id);
            changed = true;
          }
      }
      await db
        .delete(items)
        .where(inArray(items.containerId, [...descendants]));
      await db
        .delete(containers)
        .where(inArray(containers.id, [...descendants]));
      await log(db, {
        action,
        entityType: "container",
        entityId: containerId,
        entityName: before.name,
        message: `删除容器「${before.name}」及 ${descendants.size - 1} 个子容器`,
        before,
      });
    } else if (action === "moveContainer") {
      const containerId = String(p.id);
      const targetRoomId = String(p.roomId);
      const targetParentId = p.parentId ? String(p.parentId) : null;
      const all = await db.select().from(containers);
      const current = all.find((c) => c.id === containerId);
      if (!current)
        return Response.json({ error: "容器不存在" }, { status: 404 });
      const descendants = new Set<string>([containerId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of all)
          if (
            c.parentId &&
            descendants.has(c.parentId) &&
            !descendants.has(c.id)
          ) {
            descendants.add(c.id);
            changed = true;
          }
      }
      if (targetParentId && descendants.has(targetParentId))
        return Response.json(
          { error: "不能移动到自身或后代中" },
          { status: 400 },
        );
      await db
        .update(containers)
        .set({
          roomId: targetRoomId,
          parentId: targetParentId,
          updatedAt: now(),
        })
        .where(eq(containers.id, containerId));
      const childIds = [...descendants].filter((x) => x !== containerId);
      if (childIds.length)
        await db
          .update(containers)
          .set({ roomId: targetRoomId, updatedAt: now() })
          .where(inArray(containers.id, childIds));
      await db
        .update(items)
        .set({ roomId: targetRoomId, updatedAt: now() })
        .where(inArray(items.containerId, [...descendants]));
      await log(db, {
        action,
        entityType: "container",
        entityId: containerId,
        entityName: current.name,
        message: `移动容器「${current.name}」`,
      });
    } else if (action === "createItem") {
      const name = String(p.name ?? "").trim();
      const roomId = String(p.roomId ?? "");
      if (!name || !roomId)
        return Response.json(
          { error: "物品名称和位置不能为空" },
          { status: 400 },
        );
      const stockMode = String(p.stockMode || "percentage");
      const initial =
        p.initialQuantity === "" || p.initialQuantity == null
          ? null
          : Math.max(0, Number(p.initialQuantity));
      const current =
        p.currentQuantity === "" || p.currentQuantity == null
          ? null
          : Math.max(0, Number(p.currentQuantity));
      const percent =
        stockMode === "quantity" && initial && current != null
          ? clamp((current / initial) * 100, 0, 100)
          : clamp(p.stockPercent ?? 100, 0, 100);
      const row = {
        id: id(),
        roomId,
        containerId: p.containerId ? String(p.containerId) : null,
        name,
        icon: String(p.icon || "FlaskConical"),
        iconColor: String(p.iconColor || "#2563eb"),
        category: String(p.category || "其他"),
        stockEnabled: p.stockEnabled !== false,
        stockMode,
        stockPercent: Math.round(percent),
        initialQuantity: initial,
        currentQuantity: current,
        unit: String(p.unit || "个"),
        brand: String(p.brand || ""),
        specification: String(p.specification || ""),
        casNumber: String(p.casNumber || ""),
        expiryDate: p.expiryDate ? String(p.expiryDate) : null,
        notes: String(p.notes || ""),
      };
      await db.insert(items).values(row);
      await log(db, {
        action,
        entityType: "item",
        entityId: row.id,
        entityName: name,
        message: `创建物品「${name}」`,
        after: row,
      });
    } else if (action === "updateItem" || action === "adjustStock") {
      const itemId = String(p.id);
      const [before] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);
      if (!before)
        return Response.json({ error: "物品不存在" }, { status: 404 });
      const stockMode = String(p.stockMode ?? before.stockMode);
      const initial =
        p.initialQuantity === undefined
          ? before.initialQuantity
          : p.initialQuantity === ""
            ? null
            : Math.max(0, Number(p.initialQuantity));
      const current =
        p.currentQuantity === undefined
          ? before.currentQuantity
          : p.currentQuantity === ""
            ? null
            : Math.max(0, Number(p.currentQuantity));
      const percent =
        stockMode === "quantity" && initial && current != null
          ? clamp((current / initial) * 100, 0, 100)
          : clamp(p.stockPercent ?? before.stockPercent, 0, 100);
      const patch = {
        name: String(p.name ?? before.name).trim(),
        icon: String(p.icon ?? before.icon),
        iconColor: String(p.iconColor ?? before.iconColor),
        category: String(p.category ?? before.category),
        stockEnabled:
          p.stockEnabled === undefined
            ? before.stockEnabled
            : Boolean(p.stockEnabled),
        stockMode,
        stockPercent: Math.round(percent),
        initialQuantity: initial,
        currentQuantity: current,
        unit: String(p.unit ?? before.unit),
        brand: String(p.brand ?? before.brand),
        specification: String(p.specification ?? before.specification),
        casNumber: String(p.casNumber ?? before.casNumber),
        expiryDate:
          p.expiryDate === undefined
            ? before.expiryDate
            : p.expiryDate
              ? String(p.expiryDate)
              : null,
        notes: String(p.notes ?? before.notes),
        updatedAt: now(),
      };
      await db.update(items).set(patch).where(eq(items.id, itemId));
      await log(db, {
        action,
        entityType: "item",
        entityId: itemId,
        entityName: patch.name,
        message:
          action === "adjustStock"
            ? `将「${patch.name}」库存调整为 ${patch.stockPercent}%`
            : `更新物品「${patch.name}」`,
        before,
        after: patch,
      });
    } else if (action === "moveItem") {
      const itemId = String(p.id);
      const [before] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);
      if (!before)
        return Response.json({ error: "物品不存在" }, { status: 404 });
      const roomId = String(p.roomId);
      const containerId = p.containerId ? String(p.containerId) : null;
      if (containerId) {
        const [target] = await db
          .select()
          .from(containers)
          .where(
            and(eq(containers.id, containerId), eq(containers.roomId, roomId)),
          )
          .limit(1);
        if (!target)
          return Response.json({ error: "目标位置无效" }, { status: 400 });
      }
      await db
        .update(items)
        .set({ roomId, containerId, updatedAt: now() })
        .where(eq(items.id, itemId));
      await log(db, {
        action,
        entityType: "item",
        entityId: itemId,
        entityName: before.name,
        message: `移动物品「${before.name}」`,
        before,
        after: { roomId, containerId },
      });
    } else if (action === "duplicateItem") {
      const itemId = String(p.id);
      const [before] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);
      if (!before)
        return Response.json({ error: "物品不存在" }, { status: 404 });
      const copy = {
        ...before,
        id: id(),
        name: `${before.name}（副本）`,
        createdAt: now(),
        updatedAt: now(),
      };
      await db.insert(items).values(copy);
      await log(db, {
        action,
        entityType: "item",
        entityId: copy.id,
        entityName: copy.name,
        message: `复制物品「${before.name}」`,
        after: copy,
      });
    } else if (action === "deleteItem") {
      const itemId = String(p.id);
      const [before] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);
      if (!before)
        return Response.json({ error: "物品不存在" }, { status: 404 });
      await log(db, {
        action,
        entityType: "item",
        entityId: itemId,
        entityName: before.name,
        message: `删除物品「${before.name}」`,
        before,
      });
      await db.delete(items).where(eq(items.id, itemId));
    } else if (action === "importMedicineCatalog") {
      const [existingRoomRows, existingContainerRows, existingItemRows] =
        await Promise.all([
          db.select({ id: rooms.id, name: rooms.name }).from(rooms),
          db.select({ id: containers.id }).from(containers),
          db.select({ id: items.id }).from(items),
        ]);
      const existingRoomIds = new Set(existingRoomRows.map((row) => row.id));
      const existingContainerIds = new Set(
        existingContainerRows.map((row) => row.id),
      );
      const existingItemIds = new Set(existingItemRows.map((row) => row.id));
      const targetRoomIds = new Map(
        medicineCatalog.rooms.map((room) => {
          const laboratoryName = room.name.replace("药品柜", "");
          const target =
            existingRoomRows.find((row) => row.name === laboratoryName) ??
            existingRoomRows.find((row) => row.id === room.id);
          return [room.id, target?.id ?? room.id] as const;
        }),
      );
      const missingRooms = medicineCatalog.rooms
        .filter(
          (room) =>
            targetRoomIds.get(room.id) === room.id &&
            !existingRoomIds.has(room.id),
        )
        .map((room) => ({
          id: room.id,
          workspaceId: WORKSPACE_ID,
          name: room.name,
          icon: room.icon,
          color: room.color,
          description: room.description,
        }));
      const missingContainers = medicineCatalog.containers
        .filter((container) => !existingContainerIds.has(container.id))
        .map((container) => ({
          id: container.id,
          roomId: targetRoomIds.get(container.roomId) ?? container.roomId,
          parentId: null,
          name: container.name,
          type: "shelf",
          icon: container.icon,
          color: container.color,
          description: container.description,
          sortOrder: container.sortOrder,
        }));
      const missingItems = medicineCatalog.items
        .filter((item) => !existingItemIds.has(item.id))
        .map((item) => ({
          id: item.id,
          roomId: targetRoomIds.get(item.roomId) ?? item.roomId,
          containerId: item.containerId,
          name: item.name,
          icon: item.icon,
          iconColor: item.iconColor,
          category: item.category,
          stockEnabled: true,
          stockMode: "quantity",
          stockPercent: 100,
          initialQuantity: item.quantity,
          currentQuantity: item.quantity,
          unit: item.unit,
          brand: "",
          specification: "",
          casNumber: "",
          expiryDate: null,
          notes: `原表数量：${item.quantityRaw}；原表位置：${item.sourceSection}（${item.sourceCell}）；来源：${medicineCatalog.source.fileName}。名称按原表保留，未自动修正。`,
        }));

      if (missingRooms.length) await db.insert(rooms).values(missingRooms);
      if (missingContainers.length)
        await db.insert(containers).values(missingContainers);
      for (let start = 0; start < missingItems.length; start += 5) {
        await db.insert(items).values(missingItems.slice(start, start + 5));
      }
      let consolidatedRooms = 0;
      for (const sourceRoom of medicineCatalog.rooms) {
        const targetRoomId = targetRoomIds.get(sourceRoom.id) ?? sourceRoom.id;
        if (targetRoomId === sourceRoom.id) continue;
        await db
          .update(containers)
          .set({ roomId: targetRoomId, updatedAt: now() })
          .where(eq(containers.roomId, sourceRoom.id));
        await db
          .update(items)
          .set({ roomId: targetRoomId, updatedAt: now() })
          .where(eq(items.roomId, sourceRoom.id));
        if (existingRoomIds.has(sourceRoom.id)) {
          await db.delete(rooms).where(eq(rooms.id, sourceRoom.id));
          consolidatedRooms += 1;
        }
      }
      if (
        missingRooms.length ||
        missingContainers.length ||
        missingItems.length ||
        consolidatedRooms
      )
        await log(db, {
          action,
          entityType: "catalog",
          entityId: "medicine-catalog-261021",
          entityName: medicineCatalog.source.title,
          message: consolidatedRooms
            ? `药品清单已归入现有 105 / 103 房间（151 条、8 个分区）`
            : `导入药品清单：新增 ${missingItems.length} 条物品、${missingContainers.length} 个分区`,
          after: {
            rooms: missingRooms.length,
            containers: missingContainers.length,
            items: missingItems.length,
            consolidatedRooms,
          },
        });
    } else if (action === "updateSettings") {
      const [before] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, WORKSPACE_ID))
        .limit(1);
      const patch = {
        name: String(p.name ?? before.name).trim(),
        lowStockThreshold: Math.round(
          clamp(p.lowStockThreshold ?? before.lowStockThreshold, 1, 99),
        ),
        updatedAt: now(),
      };
      await db
        .update(workspaces)
        .set(patch)
        .where(eq(workspaces.id, WORKSPACE_ID));
      await log(db, {
        action,
        entityType: "workspace",
        entityId: WORKSPACE_ID,
        entityName: patch.name,
        message: "更新实验室设置",
        before,
        after: patch,
      });
    } else return Response.json({ error: "不支持的操作" }, { status: 400 });

    return Response.json(await snapshot());
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

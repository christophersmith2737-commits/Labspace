"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Beaker,
  Box,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Copy,
  Cpu,
  DoorOpen,
  Download,
  Edit3,
  FileSpreadsheet,
  FlaskConical,
  FolderOpen,
  GlassWater,
  Grid2X2,
  Hammer,
  History,
  LayoutDashboard,
  Menu,
  Microscope,
  Monitor,
  Moon,
  MoreHorizontal,
  Package,
  Plus,
  Refrigerator,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  TestTube2,
  Trash2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import type { AppState, ContainerNode, Item, Room } from "../lib/types";

const icons: Record<string, LucideIcon> = {
  FlaskConical,
  Archive,
  DoorOpen,
  Refrigerator,
  Wrench,
  Package,
  Boxes,
  Beaker,
  TestTube2,
  Monitor,
  Cpu,
  Hammer,
  GlassWater,
  BriefcaseBusiness,
  Microscope,
  Shield,
  Box,
  Cabinet: Archive,
  Building2,
  FolderOpen,
};
const iconChoices = Object.keys(icons);
const categories = [
  "化学试剂",
  "实验仪器",
  "电子元件",
  "实验耗材",
  "工具",
  "玻璃器皿",
  "办公用品",
  "其他",
];
const units = ["g", "kg", "mg", "mL", "L", "瓶", "盒", "包", "个"];
const containerTypes = [
  ["cabinet", "柜子", "Cabinet"],
  ["desk", "桌子", "BriefcaseBusiness"],
  ["drawer", "抽屉", "Archive"],
  ["shelf", "架子", "Boxes"],
  ["fridge", "冰箱", "Refrigerator"],
  ["box", "盒子", "Box"],
  ["toolbox", "工具箱", "Wrench"],
  ["custom", "自定义", "Archive"],
];
const colors = [
  "#2563eb",
  "#0891b2",
  "#059669",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#64748b",
];

function Icon({
  name,
  size = 20,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  if (name.startsWith("mc:")) {
    const slug = name.slice(3);
    return (
      // Static pixel-art assets should bypass image optimization to preserve crisp edges.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/icons/minecraft/${slug}.png`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{ imageRendering: "pixelated", objectFit: "contain" }}
      />
    );
  }
  const Component = icons[name] ?? Package;
  return <Component size={size} strokeWidth={1.8} color={color} />;
}

type MinecraftIconEntry = { id: string; file: string };

const popularMinecraftIcons = [
  "glass_bottle",
  "potion",
  "honey_bottle",
  "bucket",
  "water_bucket",
  "milk_bucket",
  "paper",
  "book",
  "written_book",
  "compass",
  "clock",
  "spyglass",
  "brush",
  "shears",
  "flint_and_steel",
  "iron_ingot",
  "copper_ingot",
  "gold_ingot",
  "diamond",
  "emerald",
  "redstone",
  "quartz",
  "amethyst_shard",
  "slime_ball",
  "ender_pearl",
  "chest",
  "red_bed",
  "oak_door",
];

const minecraftSearchAliases: Record<string, string[]> = {
  瓶: ["bottle", "potion"],
  烧瓶: ["bottle", "potion"],
  药水: ["potion"],
  桶: ["bucket"],
  书: ["book"],
  纸: ["paper", "map"],
  箱: ["chest", "box"],
  床: ["bed"],
  门: ["door"],
  工具: ["pickaxe", "axe", "shovel", "hoe", "shears", "brush"],
  剪刀: ["shears"],
  刷子: ["brush"],
  指南针: ["compass"],
  钟: ["clock"],
  望远镜: ["spyglass"],
  钻石: ["diamond"],
  铁: ["iron"],
  铜: ["copper"],
  金: ["gold"],
  粉末: ["dust", "powder", "redstone"],
  玻璃: ["glass"],
  地图: ["map"],
  旗帜: ["banner"],
  食物: ["apple", "bread", "carrot", "potato", "beef", "chicken"],
};

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [library, setLibrary] = useState<"lucide" | "minecraft">(
    value.startsWith("mc:") ? "minecraft" : "lucide",
  );
  const [query, setQuery] = useState("");
  const [minecraftIcons, setMinecraftIcons] = useState<MinecraftIconEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (library !== "minecraft" || minecraftIcons.length) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch("/icons/minecraft/manifest.json")
        .then(
          async (response) =>
            (await response.json()) as { items?: MinecraftIconEntry[] },
        )
        .then((manifest) => setMinecraftIcons(manifest.items ?? []))
        .catch(() => toast.error("物品图标库加载失败"))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [library, minecraftIcons.length]);

  const visibleMinecraftIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const aliases = Object.entries(minecraftSearchAliases)
      .filter(
        ([chinese]) =>
          chinese.includes(normalized) || normalized.includes(chinese),
      )
      .flatMap(([, terms]) => terms);
    const bySlug = new Map(
      minecraftIcons.map((entry) => [
        entry.id.replace("minecraft:", ""),
        entry,
      ]),
    );
    const ordered = [
      ...popularMinecraftIcons.map((slug) => bySlug.get(slug)).filter(Boolean),
      ...minecraftIcons.filter(
        (entry) =>
          !popularMinecraftIcons.includes(entry.id.replace("minecraft:", "")),
      ),
    ] as MinecraftIconEntry[];
    return ordered
      .filter((entry) => {
        if (!normalized) return true;
        const slug = entry.id.replace("minecraft:", "").toLowerCase();
        return (
          slug.includes(normalized) ||
          aliases.some((term) => slug.includes(term))
        );
      })
      .slice(0, 120);
  }, [minecraftIcons, query]);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">图标库</div>
        <div className="flex rounded-xl bg-[var(--panel-2)] p-1 text-xs">
          <button
            type="button"
            onClick={() => setLibrary("lucide")}
            className={`rounded-lg px-3 py-1.5 ${library === "lucide" ? "bg-[var(--panel)] font-medium shadow-sm" : "muted"}`}
          >
            基础图标
          </button>
          <button
            type="button"
            onClick={() => setLibrary("minecraft")}
            className={`rounded-lg px-3 py-1.5 ${library === "minecraft" ? "bg-[var(--panel)] font-medium shadow-sm" : "muted"}`}
          >
            物品贴纸 · 802
          </button>
        </div>
      </div>

      {library === "minecraft" && (
        <div className="relative mt-3">
          <Search
            size={16}
            className="muted absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索：瓶、工具、diamond、bucket…"
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="mt-3 grid max-h-[260px] grid-cols-7 gap-2 overflow-auto rounded-2xl border border-[var(--line)] p-2 thin-scroll sm:grid-cols-9">
        {library === "lucide" &&
          iconChoices.map((name) => (
            <button
              type="button"
              key={name}
              title={name}
              aria-label={`选择 ${name} 图标`}
              onClick={() => onChange(name)}
              className={`grid aspect-square place-items-center rounded-xl border ${value === name ? "border-blue-500 bg-[var(--blue-soft)] text-[var(--blue)]" : "border-transparent hover:bg-[var(--panel-2)]"}`}
            >
              <Icon name={name} size={20} />
            </button>
          ))}

        {library === "minecraft" && loading && (
          <div className="muted col-span-full py-10 text-center text-sm">
            正在加载物品贴纸…
          </div>
        )}
        {library === "minecraft" &&
          !loading &&
          visibleMinecraftIcons.map((entry) => {
            const slug = entry.id.replace("minecraft:", "");
            const iconValue = `mc:${slug}`;
            return (
              <button
                type="button"
                key={entry.id}
                title={slug.replaceAll("_", " ")}
                aria-label={`选择 ${slug} 物品贴纸`}
                onClick={() => onChange(iconValue)}
                className={`grid aspect-square place-items-center rounded-xl border p-1 ${value === iconValue ? "border-blue-500 bg-[var(--blue-soft)]" : "border-transparent hover:bg-[var(--panel-2)]"}`}
              >
                <Icon name={iconValue} size={34} />
              </button>
            );
          })}
        {library === "minecraft" &&
          !loading &&
          !visibleMinecraftIcons.length && (
            <div className="muted col-span-full py-10 text-center text-sm">
              没有找到匹配的图标
            </div>
          )}
      </div>
      {library === "minecraft" &&
        !loading &&
        visibleMinecraftIcons.length >= 120 && (
          <p className="muted mt-2 text-xs">
            当前显示前 120 项，可输入关键词缩小范围。
          </p>
        )}
    </div>
  );
}

function stockColor(value: number) {
  return value <= 20 ? "#ef4444" : value < 60 ? "#eab308" : "#22c55e";
}
function dateText(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type ModalState = null | {
  type: "room" | "container" | "item" | "move" | "search";
  entity?: Room | ContainerNode | Item;
};

export function LabSpaceApp() {
  const [data, setData] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<
    "dashboard" | "browse" | "alerts" | "settings"
  >("dashboard");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(
    null,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window === "undefined"
      ? "light"
      : ((localStorage.getItem("labspace-theme") as "light" | "dark" | null) ??
        (matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")),
  );
  const [stockDraft, setStockDraft] = useState(100);
  const [dragItemId, setDragItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      const json = (await response.json()) as AppState & { error?: string };
      if (!response.ok) throw new Error(json.error || "加载失败");
      setData(json);
      setError("");
      setActiveRoomId((current) => current ?? json.rooms[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const mutate = async (
    action: string,
    payload: Record<string, unknown>,
    message?: string,
  ) => {
    setBusy(true);
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const json = (await response.json()) as AppState & { error?: string };
      if (!response.ok) throw new Error(json.error || "操作失败");
      setData(json);
      if (message) toast.success(message);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const selectedItem = data?.items.find((x) => x.id === selectedItemId) ?? null;
  const activeRoom = data?.rooms.find((x) => x.id === activeRoomId) ?? null;
  const activeContainer =
    data?.containers.find((x) => x.id === activeContainerId) ?? null;

  const childContainers = useMemo(
    () =>
      data?.containers.filter(
        (c) => c.roomId === activeRoomId && c.parentId === activeContainerId,
      ) ?? [],
    [data, activeRoomId, activeContainerId],
  );
  const visibleItems = useMemo(
    () =>
      data?.items.filter(
        (i) => i.roomId === activeRoomId && i.containerId === activeContainerId,
      ) ?? [],
    [data, activeRoomId, activeContainerId],
  );
  const lowItems = useMemo(
    () =>
      data?.items.filter(
        (i) =>
          i.stockEnabled &&
          i.stockPercent <= (data.workspace.lowStockThreshold ?? 20),
      ) ?? [],
    [data],
  );
  const medicineCatalogCount = useMemo(
    () =>
      data?.items.filter((item) =>
        item.id.startsWith("medicine-261021-item-"),
      ).length ?? 0,
    [data],
  );
  const medicineCatalogNeedsSync =
    data?.rooms.some((room) => room.id.startsWith("medicine-261021-room-")) ??
    false;

  const containerPath = (containerId: string | null) => {
    const chain: ContainerNode[] = [];
    let current = containerId;
    while (current) {
      const node = data?.containers.find((c) => c.id === current);
      if (!node) break;
      chain.unshift(node);
      current = node.parentId;
    }
    return chain;
  };
  const itemPath = (item: Item) =>
    [
      data?.rooms.find((r) => r.id === item.roomId)?.name,
      ...containerPath(item.containerId).map((c) => c.name),
    ]
      .filter(Boolean)
      .join(" / ");
  const descendantsOf = (containerId: string) => {
    const ids = new Set([containerId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of data?.containers ?? [])
        if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          changed = true;
        }
    }
    return ids;
  };

  const navigateRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setActiveContainerId(null);
    setView("browse");
    setSelectedItemId(null);
  };
  const navigateContainer = (container: ContainerNode) => {
    setActiveRoomId(container.roomId);
    setActiveContainerId(container.id);
    setView("browse");
    setSelectedItemId(null);
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("labspace-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  if (error)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="card max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-semibold">LabSpace 暂时无法启动</h1>
          <p className="muted mt-2">{error}</p>
          <button
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-white"
            onClick={load}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="muted">正在打开实验室…</p>
        </div>
      </div>
    );

  const nav = [
    ["dashboard", "概览", LayoutDashboard],
    ["browse", "空间", Grid2X2],
    ["alerts", "低库存", AlertTriangle],
    ["settings", "设置", Settings],
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Toaster richColors position="top-center" />
      <header className="glass fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-[var(--line)] px-4 md:pl-[244px] md:pr-7">
        <button
          className="mobile-only mr-2 grid h-11 w-11 place-items-center rounded-xl"
          onClick={() => setView("browse")}
          aria-label="打开空间"
        >
          <Menu size={22} />
        </button>
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setModal({ type: "search" })}
        >
          <Search size={19} className="muted" />
          <span className="muted truncate text-sm">
            搜索物品、房间、容器或备注…
          </span>
          <kbd className="desktop-only ml-auto rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 text-xs muted">
            ⌘ K
          </kbd>
        </button>
        <button
          onClick={toggleTheme}
          className="ml-3 grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)]"
          aria-label="切换主题"
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
      </header>

      <aside className="desktop-only fixed inset-y-0 left-0 z-50 w-[220px] border-r border-[var(--line)] bg-[var(--panel)] p-4">
        <div className="mb-8 flex items-center gap-3 px-2 py-1">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-blue-600 text-white">
            <FlaskConical size={22} />
          </div>
          <div>
            <div className="font-bold tracking-tight">LabSpace</div>
            <div className="text-xs muted">实验室物料管理</div>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map(([key, label, NavIcon]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`focus-ring flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium ${view === key ? "bg-[var(--blue-soft)] text-[var(--blue)]" : "muted hover:bg-[var(--panel-2)]"}`}
            >
              <NavIcon size={19} />
              {label}
              {key === "alerts" && lowItems.length > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[11px] text-white">
                  {lowItems.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-8 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-[.12em] muted">
            房间
          </span>
          <button
            onClick={() => setModal({ type: "room" })}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--panel-2)]"
            aria-label="新建房间"
          >
            <Plus size={17} />
          </button>
        </div>
        <div className="mt-2 max-h-[calc(100vh-380px)] space-y-1 overflow-auto thin-scroll">
          {data.rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => navigateRoom(room.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() =>
                dragItemId &&
                void mutate(
                  "moveItem",
                  { id: dragItemId, roomId: room.id, containerId: null },
                  "物品已移动",
                )
              }
              className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm ${activeRoomId === room.id && view === "browse" ? "bg-[var(--panel-2)]" : "hover:bg-[var(--panel-2)]"}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: room.color }}
              />
              <span className="truncate">{room.name}</span>
            </button>
          ))}
        </div>
        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[var(--panel-2)] p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles size={16} className="text-blue-500" />
            极简模式
          </div>
          <p className="muted mt-1 text-xs">创建物品只需一个名称</p>
        </div>
      </aside>

      <main
        className={`min-h-screen pt-16 md:pl-[220px] ${selectedItem ? "xl:pr-[340px]" : ""}`}
      >
        {view === "dashboard" && (
          <Dashboard
            data={data}
            lowItems={lowItems}
            medicineCatalogCount={medicineCatalogCount}
            medicineCatalogNeedsSync={medicineCatalogNeedsSync}
            onRoom={navigateRoom}
            onAddRoom={() => setModal({ type: "room" })}
            onImportMedicineCatalog={() =>
              void mutate(
                "importMedicineCatalog",
                {},
                medicineCatalogNeedsSync
                  ? "药品清单已归入 105 / 103"
                  : medicineCatalogCount
                    ? "药品清单缺失条目已补齐"
                    : "药品清单已导入",
              )
            }
          />
        )}
        {view === "browse" && (
          <Browse
            data={data}
            activeRoom={activeRoom}
            activeContainer={activeContainer}
            childContainers={childContainers}
            visibleItems={visibleItems}
            containerPath={containerPath}
            navigateRoom={navigateRoom}
            navigateContainer={navigateContainer}
            selectItem={(item) => {
              setSelectedItemId(item.id);
              setStockDraft(item.stockPercent);
            }}
            setModal={setModal}
            mutate={mutate}
            dragItemId={dragItemId}
            setDragItemId={setDragItemId}
            descendantsOf={descendantsOf}
          />
        )}
        {view === "alerts" && (
          <Alerts
            items={lowItems}
            itemPath={itemPath}
            onItem={(item) => {
              navigateRoom(item.roomId);
              if (item.containerId) setActiveContainerId(item.containerId);
              setSelectedItemId(item.id);
            }}
            threshold={data.workspace.lowStockThreshold}
          />
        )}
        {view === "settings" && (
          <SettingsView
            data={data}
            mutate={mutate}
            toggleTheme={toggleTheme}
            theme={theme}
          />
        )}
      </main>

      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          path={itemPath(selectedItem)}
          stockDraft={stockDraft}
          setStockDraft={setStockDraft}
          adjust={(value) =>
            mutate(
              "adjustStock",
              { id: selectedItem.id, stockPercent: value },
              "库存已更新",
            )
          }
          close={() => setSelectedItemId(null)}
          edit={() => setModal({ type: "item", entity: selectedItem })}
          move={() => setModal({ type: "move", entity: selectedItem })}
          duplicate={() =>
            mutate("duplicateItem", { id: selectedItem.id }, "已创建副本")
          }
          remove={async () => {
            if (confirm(`确定删除「${selectedItem.name}」？`)) {
              if (
                await mutate(
                  "deleteItem",
                  { id: selectedItem.id },
                  "物品已删除",
                )
              )
                setSelectedItemId(null);
            }
          }}
        />
      )}

      <nav className="mobile-only glass fixed inset-x-0 bottom-0 z-40 grid h-[72px] grid-cols-4 border-t border-[var(--line)] px-2 pb-[env(safe-area-inset-bottom)]">
        {nav.map(([key, label, NavIcon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${view === key ? "text-[var(--blue)]" : "muted"}`}
          >
            <NavIcon size={20} />
            {label}
          </button>
        ))}
      </nav>
      {view === "browse" && activeRoom && (
        <button
          onClick={() => setModal({ type: "item" })}
          className="mobile-only fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl"
          aria-label="新建物品"
        >
          <Plus size={24} />
        </button>
      )}

      {modal && (
        <Modal
          close={() => {
            setModal(null);
            setQuery("");
          }}
        >
          {modal.type === "search" ? (
            <SearchPanel
              data={data}
              query={query}
              setQuery={setQuery}
              itemPath={itemPath}
              goRoom={(room) => {
                navigateRoom(room.id);
                setModal(null);
              }}
              goContainer={(c) => {
                navigateContainer(c);
                setModal(null);
              }}
              goItem={(item) => {
                navigateRoom(item.roomId);
                if (item.containerId) setActiveContainerId(item.containerId);
                setSelectedItemId(item.id);
                setModal(null);
              }}
            />
          ) : modal.type === "move" ? (
            modal.entity ? (
              <MovePanel
                item={modal.entity as Item}
                data={data}
                mutate={async (roomId, containerId) => {
                  if (
                    await mutate(
                      "moveItem",
                      { id: modal.entity!.id, roomId, containerId },
                      "物品已移动",
                    )
                  )
                    setModal(null);
                }}
              />
            ) : null
          ) : (
            <EntityForm
              type={modal.type}
              entity={modal.entity}
              activeRoomId={activeRoomId}
              activeContainerId={activeContainerId}
              busy={busy}
              submit={async (action, payload, message) => {
                if (await mutate(action, payload, message)) setModal(null);
              }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function Dashboard({
  data,
  lowItems,
  medicineCatalogCount,
  medicineCatalogNeedsSync,
  onRoom,
  onAddRoom,
  onImportMedicineCatalog,
}: {
  data: AppState;
  lowItems: Item[];
  medicineCatalogCount: number;
  medicineCatalogNeedsSync: boolean;
  onRoom: (id: string) => void;
  onAddRoom: () => void;
  onImportMedicineCatalog: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1220px] p-5 pb-28 md:p-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="muted text-sm">欢迎回来</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {data.workspace.name}
          </h1>
          <p className="muted mt-2 text-sm">
            像整理现实空间一样，管理每一件实验物料。
          </p>
        </div>
        <button
          onClick={onAddRoom}
          className="desktop-only flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          <Plus size={18} />
          新建房间
        </button>
      </div>
      <section className="card mb-5 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-cyan-50/70 p-5 dark:border-emerald-900/70 dark:from-emerald-950/25 dark:to-cyan-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
              <FileSpreadsheet size={23} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">261021 更新药品清单</h2>
                <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  已录入 {medicineCatalogCount}/151
                </span>
              </div>
              <p className="muted mt-1 text-sm">
                105 药品柜 111 条 · 103 药品柜 40 条 · 共 8 个分区
              </p>
              <p className="muted mt-1 text-xs">
                原名称与数量写法保留；疑似错别字未自动修改。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onImportMedicineCatalog}
            disabled={
              medicineCatalogCount >= 151 && !medicineCatalogNeedsSync
            }
            className="h-11 shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:cursor-default disabled:bg-emerald-600/55"
          >
            {medicineCatalogNeedsSync
              ? "整理到 105 / 103"
              : medicineCatalogCount >= 151
                ? "清单已导入"
                : medicineCatalogCount
                  ? "补齐缺失条目"
                  : "导入到 LabSpace"}
          </button>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="房间"
          value={data.rooms.length}
          icon={DoorOpen}
          color="#2563eb"
        />
        <Stat
          label="物品"
          value={data.items.length}
          icon={Package}
          color="#7c3aed"
        />
        <Stat
          label="容器"
          value={data.containers.length}
          icon={Archive}
          color="#0891b2"
        />
        <Stat
          label="低库存"
          value={lowItems.length}
          icon={AlertTriangle}
          color="#ef4444"
        />
      </div>
      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-lg font-semibold">实验室空间</h2>
        <button
          onClick={onAddRoom}
          className="mobile-only rounded-xl bg-blue-600 px-3 py-2 text-sm text-white"
        >
          + 房间
        </button>
      </div>
      {data.rooms.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.rooms.map((room) => {
            const count = data.items.filter((i) => i.roomId === room.id).length;
            const containers = data.containers.filter(
              (c) => c.roomId === room.id,
            ).length;
            return (
              <button
                key={room.id}
                onClick={() => onRoom(room.id)}
                className="card card-hover group p-5 text-left"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl"
                    style={{ background: `${room.color}18`, color: room.color }}
                  >
                    <Icon name={room.icon} size={23} />
                  </div>
                  <ArrowRight
                    className="muted transition-transform group-hover:translate-x-1"
                    size={18}
                  />
                </div>
                <h3 className="mt-5 font-semibold">{room.name}</h3>
                <p className="muted mt-1 line-clamp-1 text-sm">
                  {room.description || "还没有描述"}
                </p>
                <div className="muted mt-5 flex gap-4 text-xs">
                  <span>{count} 件物品</span>
                  <span>{containers} 个容器</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Empty
          title="还没有房间"
          text="先创建第一个实验室空间，然后添加柜子和物品。"
          action="创建房间"
          onAction={onAddRoom}
        />
      )}
      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">低库存提醒</h2>
          <div className="card p-2">
            {lowItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl p-3"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500">
                  <Icon name={item.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {item.name}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.stockPercent}%`,
                        background: stockColor(item.stockPercent),
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-500">
                  {item.stockPercent}%
                </span>
              </div>
            ))}
            {!lowItems.length && (
              <p className="muted p-6 text-center text-sm">库存状态良好</p>
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">最近操作</h2>
          <div className="card divide-y divide-[var(--line)] px-4">
            {data.logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex gap-3 py-3">
                <History size={17} className="muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm">{log.message}</p>
                  <p className="muted mt-1 text-xs">
                    {dateText(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {!data.logs.length && (
              <p className="muted p-6 text-center text-sm">
                操作记录会显示在这里
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: StatIcon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: `${color}14`, color }}
        >
          <StatIcon size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="muted text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function Browse({
  data,
  activeRoom,
  activeContainer,
  childContainers,
  visibleItems,
  containerPath,
  navigateRoom,
  navigateContainer,
  selectItem,
  setModal,
  mutate,
  dragItemId,
  setDragItemId,
  descendantsOf,
}: {
  data: AppState;
  activeRoom: Room | null;
  activeContainer: ContainerNode | null;
  childContainers: ContainerNode[];
  visibleItems: Item[];
  containerPath: (id: string | null) => ContainerNode[];
  navigateRoom: (id: string) => void;
  navigateContainer: (c: ContainerNode) => void;
  selectItem: (i: Item) => void;
  setModal: (m: ModalState) => void;
  mutate: (
    a: string,
    p: Record<string, unknown>,
    m?: string,
  ) => Promise<boolean>;
  dragItemId: string | null;
  setDragItemId: (v: string | null) => void;
  descendantsOf: (id: string) => Set<string>;
}) {
  if (!activeRoom)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Empty
          title="先创建一个房间"
          text="房间是所有柜子、抽屉和物品的起点。"
          action="新建房间"
          onAction={() => setModal({ type: "room" })}
        />
      </div>
    );
  const path = containerPath(activeContainer?.id ?? null);
  const deleteContainer = async (c: ContainerNode) => {
    const ids = descendantsOf(c.id);
    const itemCount = data.items.filter(
      (i) => i.containerId && ids.has(i.containerId),
    ).length;
    if (
      confirm(
        `删除「${c.name}」？将同时删除 ${ids.size - 1} 个子容器和 ${itemCount} 件物品。`,
      )
    ) {
      if (await mutate("deleteContainer", { id: c.id }, "容器已删除")) {
        if (activeContainer?.id === c.id) navigateRoom(c.roomId);
      }
    }
  };
  return (
    <div className="grid min-h-[calc(100vh-64px)] md:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="desktop-only border-r border-[var(--line)] bg-[var(--panel)] p-3">
        <div className="mb-2 flex items-center justify-between px-2 py-2">
          <span className="text-xs font-semibold uppercase tracking-[.12em] muted">
            位置目录
          </span>
          <button
            onClick={() => setModal({ type: "container" })}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--panel-2)]"
          >
            <Plus size={16} />
          </button>
        </div>
        {data.rooms.map((room) => (
          <div key={room.id}>
            <button
              onClick={() => navigateRoom(room.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${room.id === activeRoom.id && !activeContainer ? "bg-[var(--blue-soft)] text-[var(--blue)]" : "hover:bg-[var(--panel-2)]"}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: room.color }}
              />
              {room.name}
            </button>
            {room.id === activeRoom.id && (
              <Tree
                parentId={null}
                roomId={room.id}
                data={data}
                activeId={activeContainer?.id ?? null}
                go={navigateContainer}
                drop={async (c) => {
                  if (dragItemId)
                    await mutate(
                      "moveItem",
                      { id: dragItemId, roomId: c.roomId, containerId: c.id },
                      "物品已移动",
                    );
                }}
              />
            )}
          </div>
        ))}
      </aside>
      <section className="min-w-0 p-4 pb-28 md:p-7">
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <button
            className="muted hover:text-[var(--text)]"
            onClick={() => navigateRoom(activeRoom.id)}
          >
            {activeRoom.name}
          </button>
          {path.map((c) => (
            <span key={c.id} className="flex items-center gap-1">
              <ChevronRight size={15} className="muted" />
              <button
                onClick={() => navigateContainer(c)}
                className={
                  c.id === activeContainer?.id ? "font-medium" : "muted"
                }
              >
                {c.name}
              </button>
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeContainer?.name ?? activeRoom.name}
            </h1>
            <p className="muted mt-1 text-sm">
              {childContainers.length} 个子容器 · {visibleItems.length} 件物品
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setModal({
                  type: activeContainer ? "container" : "room",
                  entity: activeContainer ?? activeRoom,
                })
              }
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)]"
              aria-label="编辑当前位置"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={async () => {
                if (activeContainer) {
                  await deleteContainer(activeContainer);
                } else {
                  const roomItemCount = data.items.filter(
                    (item) => item.roomId === activeRoom.id,
                  ).length;
                  if (
                    confirm(
                      `删除「${activeRoom.name}」？将同时删除 ${roomItemCount} 件物品和该房间全部容器。`,
                    )
                  ) {
                    if (
                      await mutate(
                        "deleteRoom",
                        { id: activeRoom.id },
                        "房间已删除",
                      )
                    )
                      window.location.reload();
                  }
                }
              }}
              className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 bg-[var(--panel)] text-red-500"
              aria-label="删除当前位置"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setModal({ type: "container" })}
              className="desktop-only flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
            >
              <Archive size={17} />
              子容器
            </button>
            <button
              onClick={() => setModal({ type: "item" })}
              className="desktop-only flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              新建物品
            </button>
            <button
              onClick={() => setModal({ type: "container" })}
              className="mobile-only grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)]"
              aria-label="新建子容器"
            >
              <Archive size={17} />
            </button>
          </div>
        </div>
        {childContainers.length > 0 && (
          <>
            <h2 className="muted mb-3 mt-8 text-xs font-semibold uppercase tracking-[.12em]">
              容器
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {childContainers.map((c) => (
                <div
                  key={c.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() =>
                    dragItemId &&
                    void mutate(
                      "moveItem",
                      { id: dragItemId, roomId: c.roomId, containerId: c.id },
                      "物品已移动",
                    )
                  }
                  className="card card-hover group relative"
                >
                  <button
                    onClick={() => navigateContainer(c)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={{ background: `${c.color}18`, color: c.color }}
                    >
                      <Icon name={c.icon} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="muted mt-1 text-xs">
                        {
                          data.containers.filter((x) => x.parentId === c.id)
                            .length
                        }{" "}
                        子容器 ·{" "}
                        {
                          data.items.filter((x) => x.containerId === c.id)
                            .length
                        }{" "}
                        物品
                      </div>
                    </div>
                    <ChevronRight className="muted ml-auto" size={18} />
                  </button>
                  <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <button
                      onClick={() => setModal({ type: "container", entity: c })}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--panel)] shadow"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => void deleteContainer(c)}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--panel)] text-red-500 shadow"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {visibleItems.length > 0 && (
          <>
            <h2 className="muted mb-3 mt-8 text-xs font-semibold uppercase tracking-[.12em]">
              物品
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleItems.map((item) => (
                <button
                  draggable
                  onDragStart={() => setDragItemId(item.id)}
                  onDragEnd={() => setDragItemId(null)}
                  key={item.id}
                  onClick={() => selectItem(item)}
                  className="card card-hover p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: `${item.iconColor}16`,
                        color: item.iconColor,
                      }}
                    >
                      <Icon name={item.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="muted mt-1 truncate text-xs">
                        {item.category}
                      </div>
                    </div>
                    <MoreHorizontal size={17} className="muted" />
                  </div>
                  {item.stockEnabled && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="muted">剩余量</span>
                        <span
                          className="font-semibold"
                          style={{ color: stockColor(item.stockPercent) }}
                        >
                          {item.stockPercent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--panel-2)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.stockPercent}%`,
                            background: stockColor(item.stockPercent),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
        {!childContainers.length && !visibleItems.length && (
          <Empty
            title="这里还是空的"
            text="添加一个物品，或创建抽屉、隔层等子容器。"
            action="添加第一个物品"
            onAction={() => setModal({ type: "item" })}
          />
        )}
      </section>
    </div>
  );
}

function Tree({
  parentId,
  roomId,
  data,
  activeId,
  go,
  drop,
  depth = 0,
}: {
  parentId: string | null;
  roomId: string;
  data: AppState;
  activeId: string | null;
  go: (c: ContainerNode) => void;
  drop: (c: ContainerNode) => void;
  depth?: number;
}) {
  const nodes = data.containers.filter(
    (c) => c.roomId === roomId && c.parentId === parentId,
  );
  return (
    <div>
      {nodes.map((c) => (
        <div key={c.id}>
          <button
            onClick={() => go(c)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(c)}
            style={{ paddingLeft: 12 + depth * 14 }}
            className={`mt-0.5 flex w-full items-center gap-2 rounded-xl py-2 pr-2 text-left text-sm ${activeId === c.id ? "bg-[var(--blue-soft)] text-[var(--blue)]" : "muted hover:bg-[var(--panel-2)]"}`}
          >
            <Icon name={c.icon} size={15} />
            <span className="truncate">{c.name}</span>
          </button>
          <Tree
            parentId={c.id}
            roomId={roomId}
            data={data}
            activeId={activeId}
            go={go}
            drop={drop}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  );
}

function DetailPanel({
  item,
  path,
  stockDraft,
  setStockDraft,
  adjust,
  close,
  edit,
  move,
  duplicate,
  remove,
}: {
  item: Item;
  path: string;
  stockDraft: number;
  setStockDraft: (v: number) => void;
  adjust: (value: number) => void;
  close: () => void;
  edit: () => void;
  move: () => void;
  duplicate: () => void;
  remove: () => void;
}) {
  return (
    <aside className="fixed bottom-0 right-0 top-16 z-30 w-full overflow-auto border-l border-[var(--line)] bg-[var(--panel)] p-5 pb-24 shadow-[-12px_0_35px_rgba(15,23,42,.05)] md:w-[340px] xl:block">
      <div className="flex items-center justify-between">
        <span className="muted text-xs font-semibold uppercase tracking-[.12em]">
          物品详情
        </span>
        <button
          onClick={close}
          className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--panel-2)]"
        >
          <X size={19} />
        </button>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: `${item.iconColor}18`, color: item.iconColor }}
        >
          <Icon name={item.icon} size={30} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{item.name}</h2>
          <p className="muted mt-1 text-sm">{item.category}</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-[var(--panel-2)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">当前库存</span>
          <span
            className="text-xl font-bold"
            style={{ color: stockColor(stockDraft) }}
          >
            {stockDraft}%
          </span>
        </div>
        <input
          aria-label="库存百分比"
          type="range"
          min="0"
          max="100"
          value={stockDraft}
          onChange={(e) => setStockDraft(Number(e.target.value))}
          onPointerUp={(e) => adjust(Number(e.currentTarget.value))}
          onKeyUp={(e) => adjust(Number(e.currentTarget.value))}
          className="w-full"
        />
        {item.stockMode === "quantity" && (
          <p className="muted mt-2 text-xs">
            {item.currentQuantity ?? 0} / {item.initialQuantity ?? 0}{" "}
            {item.unit}
          </p>
        )}
      </div>
      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="muted text-xs">存放位置</dt>
          <dd className="mt-1 leading-6">{path}</dd>
        </div>
        {item.brand && (
          <div>
            <dt className="muted text-xs">品牌 / 规格</dt>
            <dd className="mt-1">
              {item.brand} {item.specification}
            </dd>
          </div>
        )}
        {item.casNumber && (
          <div>
            <dt className="muted text-xs">CAS 号</dt>
            <dd className="mt-1">{item.casNumber}</dd>
          </div>
        )}
        {item.notes && (
          <div>
            <dt className="muted text-xs">备注</dt>
            <dd className="mt-1 leading-6">{item.notes}</dd>
          </div>
        )}
        <div>
          <dt className="muted text-xs">最近更新</dt>
          <dd className="mt-1">{dateText(item.updatedAt)}</dd>
        </div>
      </dl>
      <div className="mt-7 grid grid-cols-2 gap-2">
        <button
          onClick={edit}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white"
        >
          <Edit3 size={17} />
          编辑
        </button>
        <button
          onClick={move}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line)] text-sm"
        >
          <ArrowRight size={17} />
          移动
        </button>
        <button
          onClick={duplicate}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line)] text-sm"
        >
          <Copy size={17} />
          复制
        </button>
        <button
          onClick={remove}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm text-red-500"
        >
          <Trash2 size={17} />
          删除
        </button>
      </div>
    </aside>
  );
}

function Alerts({
  items,
  itemPath,
  onItem,
  threshold,
}: {
  items: Item[];
  itemPath: (i: Item) => string;
  onItem: (i: Item) => void;
  threshold: number;
}) {
  return (
    <div className="mx-auto max-w-5xl p-5 pb-28 md:p-8">
      <div className="mb-7">
        <p className="muted text-sm">库存预警阈值 ≤ {threshold}%</p>
        <h1 className="mt-1 text-3xl font-bold">低库存物品</h1>
      </div>
      {items.length ? (
        <div className="card overflow-hidden">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItem(item)}
              className="flex w-full items-center gap-4 border-b border-[var(--line)] p-4 text-left last:border-0 hover:bg-[var(--panel-2)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-500">
                <Icon name={item.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="muted mt-1 truncate text-xs">
                  {itemPath(item)}
                </div>
              </div>
              <div className="w-28">
                <div className="mb-1 text-right text-sm font-bold text-red-500">
                  {item.stockPercent}%
                </div>
                <div className="h-2 rounded-full bg-[var(--panel-2)]">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${item.stockPercent}%` }}
                  />
                </div>
              </div>
              <ChevronRight className="muted" size={18} />
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title="没有低库存物品"
          text="所有开启库存跟踪的物品都高于预警阈值。"
        />
      )}
    </div>
  );
}

function SettingsView({
  data,
  mutate,
  toggleTheme,
  theme,
}: {
  data: AppState;
  mutate: (
    a: string,
    p: Record<string, unknown>,
    m?: string,
  ) => Promise<boolean>;
  toggleTheme: () => void;
  theme: string;
}) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `labspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="mx-auto max-w-3xl p-5 pb-28 md:p-8">
      <h1 className="text-3xl font-bold">设置</h1>
      <div className="card mt-7 divide-y divide-[var(--line)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void mutate(
              "updateSettings",
              { name: f.get("name"), lowStockThreshold: f.get("threshold") },
              "设置已保存",
            );
          }}
          className="p-5"
        >
          <h2 className="font-semibold">实验室设置</h2>
          <label className="mt-4 block text-sm">
            实验室名称
            <input
              name="name"
              defaultValue={data.workspace.name}
              className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
            />
          </label>
          <label className="mt-4 block text-sm">
            低库存阈值：{data.workspace.lowStockThreshold}%
            <input
              name="threshold"
              type="range"
              min="1"
              max="50"
              defaultValue={data.workspace.lowStockThreshold}
              className="mt-3 w-full"
            />
          </label>
          <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">
            保存设置
          </button>
        </form>
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-semibold">外观</h2>
            <p className="muted mt-1 text-sm">
              当前为{theme === "light" ? "浅色" : "深色"}主题
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)]"
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-semibold">数据导出</h2>
            <p className="muted mt-1 text-sm">
              下载包含全部空间、物品与日志的 JSON 备份
            </p>
          </div>
          <button
            onClick={exportData}
            className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] px-4 text-sm"
          >
            <Download size={17} />
            导出
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchPanel({
  data,
  query,
  setQuery,
  itemPath,
  goRoom,
  goContainer,
  goItem,
}: {
  data: AppState;
  query: string;
  setQuery: (v: string) => void;
  itemPath: (i: Item) => string;
  goRoom: (r: Room) => void;
  goContainer: (c: ContainerNode) => void;
  goItem: (i: Item) => void;
}) {
  const q = query.trim().toLowerCase();
  const rooms = q
    ? data.rooms.filter((x) =>
        (x.name + x.description).toLowerCase().includes(q),
      )
    : [];
  const containers = q
    ? data.containers.filter((x) =>
        (x.name + x.description + x.type).toLowerCase().includes(q),
      )
    : [];
  const items = q
    ? data.items.filter((x) =>
        (x.name + x.category + x.notes + x.casNumber + x.brand)
          .toLowerCase()
          .includes(q),
      )
    : [];
  const count = rooms.length + containers.length + items.length;
  return (
    <div className="w-[min(680px,calc(100vw-28px))]">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
        <Search size={20} className="muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 TiO₂、试剂柜、分类或备注…"
          className="h-10 min-w-0 flex-1 bg-transparent outline-none"
        />
      </div>
      <div className="max-h-[65vh] overflow-auto p-2 thin-scroll">
        {!q && (
          <div className="muted p-10 text-center text-sm">
            输入关键词即可全局搜索
          </div>
        )}
        {q && !count && (
          <div className="muted p-10 text-center text-sm">没有匹配结果</div>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => goItem(item)}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[var(--panel-2)]"
          >
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{
                background: `${item.iconColor}16`,
                color: item.iconColor,
              }}
            >
              <Icon name={item.icon} />
            </div>
            <div className="min-w-0">
              <div className="font-medium">{item.name}</div>
              <div className="muted mt-1 truncate text-xs">
                {itemPath(item)}
              </div>
            </div>
            <span className="ml-auto text-xs muted">物品</span>
          </button>
        ))}
        {containers.map((c) => (
          <button
            key={c.id}
            onClick={() => goContainer(c)}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[var(--panel-2)]"
          >
            <Icon name={c.icon} />
            <span>{c.name}</span>
            <span className="ml-auto text-xs muted">容器</span>
          </button>
        ))}
        {rooms.map((r) => (
          <button
            key={r.id}
            onClick={() => goRoom(r)}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[var(--panel-2)]"
          >
            <Icon name={r.icon} />
            <span>{r.name}</span>
            <span className="ml-auto text-xs muted">房间</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MovePanel({
  item,
  data,
  mutate,
}: {
  item: Item;
  data: AppState;
  mutate: (roomId: string, containerId: string | null) => void;
}) {
  return (
    <div className="w-[min(520px,calc(100vw-28px))] p-5">
      <h2 className="text-xl font-bold">移动「{item.name}」</h2>
      <p className="muted mt-1 text-sm">选择新的存放位置</p>
      <div className="mt-5 max-h-[60vh] overflow-auto thin-scroll">
        {data.rooms.map((room) => (
          <div key={room.id} className="mb-3">
            <button
              onClick={() => mutate(room.id, null)}
              className="flex w-full items-center gap-3 rounded-xl bg-[var(--panel-2)] p-3 text-left font-medium"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: room.color }}
              />
              {room.name}
              <span className="ml-auto text-xs muted">房间根目录</span>
            </button>
            <LocationTree
              roomId={room.id}
              parentId={null}
              data={data}
              select={mutate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
function LocationTree({
  roomId,
  parentId,
  data,
  select,
  depth = 0,
}: {
  roomId: string;
  parentId: string | null;
  data: AppState;
  select: (r: string, c: string | null) => void;
  depth?: number;
}) {
  return (
    <>
      {data.containers
        .filter((c) => c.roomId === roomId && c.parentId === parentId)
        .map((c) => (
          <div key={c.id}>
            <button
              onClick={() => select(roomId, c.id)}
              style={{ paddingLeft: 20 + depth * 18 }}
              className="flex w-full items-center gap-2 rounded-xl py-2.5 pr-3 text-left text-sm hover:bg-[var(--panel-2)]"
            >
              <Icon name={c.icon} size={16} />
              {c.name}
            </button>
            <LocationTree
              roomId={roomId}
              parentId={c.id}
              data={data}
              select={select}
              depth={depth + 1}
            />
          </div>
        ))}
    </>
  );
}

function EntityForm({
  type,
  entity,
  activeRoomId,
  activeContainerId,
  busy,
  submit,
}: {
  type: "room" | "container" | "item";
  entity?: Room | ContainerNode | Item;
  activeRoomId: string | null;
  activeContainerId: string | null;
  busy: boolean;
  submit: (a: string, p: Record<string, unknown>, m: string) => void;
}) {
  const [icon, setIcon] = useState(
    entity?.icon ??
      (type === "item"
        ? "FlaskConical"
        : type === "room"
          ? "Building2"
          : "Archive"),
  );
  const [color, setColor] = useState(
    (entity as Item)?.iconColor ??
      (entity as Room | ContainerNode)?.color ??
      "#2563eb",
  );
  const [more, setMore] = useState(Boolean(entity));
  const edit = Boolean(entity);
  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries()) as Record<string, unknown>;
    payload.icon = icon;
    if (type === "item") payload.iconColor = color;
    else payload.color = color;
    if (entity) payload.id = entity.id;
    if (type === "container") {
      payload.roomId = (entity as ContainerNode)?.roomId ?? activeRoomId;
      payload.parentId =
        (entity as ContainerNode)?.parentId ?? activeContainerId;
    }
    if (type === "item") {
      payload.roomId = (entity as Item)?.roomId ?? activeRoomId;
      payload.containerId = (entity as Item)?.containerId ?? activeContainerId;
      payload.stockEnabled = true;
    }
    submit(
      `${edit ? "update" : "create"}${type[0].toUpperCase() + type.slice(1)}`,
      payload,
      `${type === "room" ? "房间" : type === "container" ? "容器" : "物品"}已${edit ? "更新" : "创建"}`,
    );
  };
  return (
    <form onSubmit={handle} className="w-[min(560px,calc(100vw-28px))] p-5">
      <h2 className="text-xl font-bold">
        {edit ? "编辑" : "新建"}
        {type === "room" ? "房间" : type === "container" ? "容器" : "物品"}
      </h2>
      <p className="muted mt-1 text-sm">
        {type === "item"
          ? "只填名称即可立即创建，其余信息以后再补。"
          : "名称为必填项，其余均可稍后修改。"}
      </p>
      <label className="mt-5 block text-sm font-medium">
        名称
        <input
          autoFocus
          required
          name="name"
          defaultValue={entity?.name ?? ""}
          placeholder={type === "item" ? "例如 TiO₂" : "请输入名称"}
          className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 outline-none focus:border-blue-500"
        />
      </label>
      {type === "container" && (
        <label className="mt-4 block text-sm font-medium">
          类型
          <select
            name="type"
            defaultValue={(entity as ContainerNode)?.type ?? "custom"}
            className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
          >
            {containerTypes.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      )}
      <IconPicker value={icon} onChange={setIcon} />
      <div className="mt-4 flex gap-2">
        {colors.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-[var(--text)]" : "border-transparent"}`}
            style={{ background: c }}
            aria-label={`选择颜色 ${c}`}
          />
        ))}
      </div>
      {type === "item" && (
        <button
          type="button"
          onClick={() => setMore(!more)}
          className="muted mt-5 flex items-center gap-2 text-sm"
        >
          <ChevronRight size={16} className={more ? "rotate-90" : ""} />
          更多选项
        </button>
      )}
      {(type !== "item" || more) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {type === "item" && (
            <>
              <label className="text-sm">
                分类
                <select
                  name="category"
                  defaultValue={(entity as Item)?.category ?? "其他"}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                库存模式
                <select
                  name="stockMode"
                  defaultValue={(entity as Item)?.stockMode ?? "percentage"}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                >
                  <option value="percentage">百分比</option>
                  <option value="quantity">数量</option>
                </select>
              </label>
              <label className="text-sm">
                库存百分比
                <input
                  name="stockPercent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={(entity as Item)?.stockPercent ?? 100}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
              <label className="text-sm">
                单位
                <select
                  name="unit"
                  defaultValue={(entity as Item)?.unit ?? "个"}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                >
                  {units.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                初始数量
                <input
                  name="initialQuantity"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={(entity as Item)?.initialQuantity ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
              <label className="text-sm">
                当前数量
                <input
                  name="currentQuantity"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={(entity as Item)?.currentQuantity ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
              <label className="text-sm">
                品牌
                <input
                  name="brand"
                  defaultValue={(entity as Item)?.brand ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
              <label className="text-sm">
                规格
                <input
                  name="specification"
                  defaultValue={(entity as Item)?.specification ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
              <label className="text-sm">
                CAS 号
                <input
                  name="casNumber"
                  defaultValue={(entity as Item)?.casNumber ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
              <label className="text-sm">
                有效期
                <input
                  name="expiryDate"
                  type="date"
                  defaultValue={(entity as Item)?.expiryDate ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3"
                />
              </label>
            </>
          )}
          {type !== "item" && (
            <label className="text-sm sm:col-span-2">
              描述
              <textarea
                name="description"
                defaultValue={
                  (entity as Room | ContainerNode | undefined)?.description ??
                  ""
                }
                rows={3}
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3"
              />
            </label>
          )}
          {type === "item" && (
            <label className="text-sm sm:col-span-2">
              备注
              <textarea
                name="notes"
                defaultValue={(entity as Item)?.notes ?? ""}
                rows={3}
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3"
              />
            </label>
          )}
        </div>
      )}
      <button
        disabled={busy}
        className="mt-6 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "正在保存…" : edit ? "保存修改" : "立即创建"}
      </button>
    </form>
  );
}

function Modal({
  children,
  close,
}: {
  children: ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-3 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative max-h-[90vh] overflow-auto rounded-[20px] border border-[var(--line)] bg-[var(--panel)] shadow-2xl thin-scroll">
        <button
          onClick={close}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl bg-[var(--panel-2)]"
          aria-label="关闭"
        >
          <X size={17} />
        </button>
        {children}
      </div>
    </div>
  );
}
function Empty({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="my-10 rounded-[20px] border border-dashed border-[var(--line)] p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--panel-2)]">
        <Package className="muted" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="muted mx-auto mt-2 max-w-sm text-sm">{text}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} className="mr-1 inline" />
          {action}
        </button>
      )}
    </div>
  );
}

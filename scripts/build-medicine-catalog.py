from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from openpyxl import load_workbook


ROOMS = {
    "105药品柜": {
        "id": "medicine-261021-room-105",
        "name": "105药品柜",
        "icon": "mc:chest",
        "color": "#0f766e",
        "description": "来源：261021 更新药品清单；共 5 层。",
    },
    "103药品柜": {
        "id": "medicine-261021-room-103",
        "name": "103药品柜",
        "icon": "mc:chest",
        "color": "#7c3aed",
        "description": "来源：261021 更新药品清单；按药品类别和柜层整理。",
    },
}

SECTIONS = {
    3: ("105药品柜", "一层", "一层"),
    16: ("105药品柜", "二层", "二层"),
    25: ("105药品柜", "三层", "三层"),
    32: ("105药品柜", "四层", "四层"),
    41: ("105药品柜", "五层", "五层"),
    51: ("103药品柜", "一层 · 稀土/金属醋酸盐类", "稀土/金属醋酸盐类（一层）"),
    61: ("103药品柜", "一层 · 稀土氯化物", "稀土氯化物（一层）"),
    69: ("103药品柜", "二层 · 乙酰丙酮/其他类", "乙酰丙酮/其他类（二层）"),
}

SKIP_ROWS = {1, 2, 49, 50, 59, 67, 72, 73}
METAL_ACETATES = {"Ag", "Zr", "In", "Pb", "Cu", "Mg"}


def category_for(name: str, room_name: str, section: str) -> str:
    if room_name == "103药品柜":
        if "醋酸盐" in section:
            symbol_match = re.search(r"[（(]([A-Za-z]+)[）)]", name)
            if symbol_match and symbol_match.group(1) in METAL_ACETATES:
                return "金属醋酸盐"
            return "稀土醋酸盐"
        if "氯化物" in section:
            return "稀土氯化物"
        if name == "其他试剂":
            return "其他"
        return "乙酰丙酮盐"

    if "氧化" in name or name.startswith(("二氧化", "三氧化")):
        return "氧化物"
    if any(token in name for token in ("氟化", "氯化", "溴化", "碘化")):
        return "卤化物"
    if "碳酸" in name:
        return "碳酸盐"
    if "硫酸" in name:
        return "硫酸盐"
    if "乙酸" in name or "醋酸" in name:
        return "醋酸盐"
    if "氢氧化" in name:
        return "碱类"
    if name.endswith("酸"):
        return "酸类"
    if any(token in name for token in ("硅酸", "磷酸", "硼酸")):
        return "其他盐类"
    return "其他无机物"


def quantity_parts(raw: str) -> tuple[float, str, str]:
    match = re.match(r"\s*(\d+(?:\.\d+)?)", raw)
    quantity = float(match.group(1)) if match else 1.0
    if "瓶" in raw and "袋" in raw:
        unit = "瓶+半袋"
        icon = "mc:bundle"
    elif "袋" in raw:
        unit = "袋（25kg）" if "25KG" in raw.upper() else "袋"
        icon = "mc:white_dye"
    else:
        unit = "瓶"
        icon = "mc:glass_bottle"
    return quantity, unit, icon


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build-medicine-catalog.py INPUT.xlsx OUTPUT.json")

    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    workbook = load_workbook(source, data_only=False)
    sheet = workbook["样品清单"]

    containers = []
    section_by_row: dict[int, tuple[str, str, str, str]] = {}
    for index, (row, (room_name, display_name, source_name)) in enumerate(SECTIONS.items()):
        room_id = ROOMS[room_name]["id"]
        container_id = f"medicine-261021-container-{index + 1:02d}"
        containers.append(
            {
                "id": container_id,
                "roomId": room_id,
                "name": display_name,
                "sourceName": source_name,
                "icon": "mc:bundle",
                "color": ROOMS[room_name]["color"],
                "description": f"原表分区：{source_name}",
                "sortOrder": index + 1,
            }
        )
        section_by_row[row] = (room_name, display_name, source_name, container_id)

    items = []
    current: tuple[str, str, str, str] | None = None
    for row in range(1, sheet.max_row + 1):
        if row in section_by_row:
            current = section_by_row[row]
            continue
        if row in SKIP_ROWS or current is None:
            continue
        room_name, _, source_section, container_id = current
        for column in (1, 3, 5):
            name = sheet.cell(row, column).value
            raw_quantity = sheet.cell(row, column + 1).value
            if name in (None, ""):
                continue
            cell = sheet.cell(row, column).coordinate
            raw = "" if raw_quantity in (None, "") else str(raw_quantity).strip()
            quantity, unit, icon = quantity_parts(raw)
            items.append(
                {
                    "id": f"medicine-261021-item-{cell.lower()}",
                    "roomId": ROOMS[room_name]["id"],
                    "containerId": container_id,
                    "name": str(name).strip(),
                    "category": category_for(str(name).strip(), room_name, source_section),
                    "icon": icon,
                    "iconColor": ROOMS[room_name]["color"],
                    "quantity": quantity,
                    "unit": unit,
                    "quantityRaw": raw,
                    "sourceCell": cell,
                    "sourceSection": source_section,
                }
            )

    room_counts = {
        room["name"]: sum(item["roomId"] == room["id"] for item in items)
        for room in ROOMS.values()
    }
    data = {
        "source": {
            "fileName": source.name,
            "sheet": sheet.title,
            "updatedDate": "2026-10-21",
            "title": "261021 更新药品清单",
            "itemCount": len(items),
            "uniqueNameCount": len({item["name"] for item in items}),
            "roomCounts": room_counts,
            "note": "原表名称与数量写法原样保留；未擅自修正疑似错别字。",
        },
        "rooms": list(ROOMS.values()),
        "containers": containers,
        "items": items,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(data["source"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

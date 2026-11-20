#!/usr/bin/env python3
"""weread-editions —— 按书名把微信读书上**所有版本**的封面与出版信息一次拉齐。

为什么需要它：微信读书同一本书有十几个版本，搜索结果按热度排序、`publishTime`
最“新”的那条不一定是真在卖的版本（可能是 publisher / isbn 全空、封面是白底
模板的预备条目）。做读书号内容时，封面与橱窗版本对不上就会翻车，所以这里把
每一版都摊开，标清「出版时间 / 出版社 / ISBN / 评分 / 评价数」，并对缺字段的
条目打 ⚠ 标记。

用法：
    python3 scripts/weread-editions.py "自卑与超越"
    python3 scripts/weread-editions.py "自卑与超越" --out ~/Desktop/wr --cols 6
    python3 scripts/weread-editions.py 3300129930          # 也可以直接给 bookId

密钥：优先读环境变量 WEREAD_API_KEY；没有就去 macOS 钥匙串取
（service=weread / account=当前用户名），不会写盘、不会打印。
输出：<out>/editions.json、<out>/covers/*.jpg、<out>/sheet.jpg，并在终端打印表格。
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.request
from typing import Any

GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.6"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) weread-editions/1.0"
COVER_PREFIXES = ("t9_", "t6_", "t5_", "t3_", "s_")


def read_key() -> str:
    key = os.environ.get("WEREAD_API_KEY", "").strip()
    if key:
        return key
    try:
        out = subprocess.run(
            ["security", "find-generic-password", "-s", "weread", "-a", os.environ.get("USER", ""), "-w"],
            capture_output=True, text=True, timeout=10,
        )
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except Exception:
        pass
    sys.exit("没有 WEREAD_API_KEY，钥匙串里也没找到（service=weread）。先按技能文档入匙。")


def call(key: str, payload: dict[str, Any]) -> dict[str, Any]:
    payload = {**payload, "skill_version": SKILL_VERSION}
    req = urllib.request.Request(
        GATEWAY,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": UA},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def search_editions(key: str, keyword: str) -> list[str]:
    """按书名搜，返回所有候选 bookId（去重、保持接口顺序）。"""
    ids: list[str] = []
    for scope in (10, 0):  # 10=电子书；0=全部（兜底，避免漏掉特殊条目）
        try:
            data = call(key, {"api_name": "/store/search", "keyword": keyword, "scope": scope,
                              "context": f"拉取《{keyword}》全部版本的封面与出版信息，用于和橱窗核对版本"})
        except Exception as exc:  # 网络抖动不该让整件事失败
            print(f"  ! 搜索 scope={scope} 失败：{exc}", file=sys.stderr)
            continue
        for group in data.get("results") or []:
            for item in group.get("books") or []:
                bid = (item.get("bookInfo") or {}).get("bookId")
                if bid and bid not in ids:
                    ids.append(str(bid))
        if len(ids) >= 5:
            break
    return ids


def book_info(key: str, book_id: str) -> dict[str, Any] | None:
    try:
        info = call(key, {"api_name": "/book/info", "bookId": book_id})
    except Exception as exc:
        print(f"  ! /book/info {book_id} 失败：{exc}", file=sys.stderr)
        return None
    if not info.get("title"):
        return None
    return info


def download_cover(url: str, dest: pathlib.Path) -> bool:
    """接口给的 URL 形态不统一（cdn.weread.qq.com / outpic / myqcloud），只替换前缀。"""
    if not url:
        return False
    for prefix in COVER_PREFIXES:
        cand = re.sub(r"/(s_|t\d_|b_|m_|l_)", "/" + prefix, url, count=1)
        if prefix not in cand.lower():
            continue
        try:
            req = urllib.request.Request(cand, headers={"User-Agent": UA})
            blob = urllib.request.urlopen(req, timeout=20).read()
            if len(blob) > 2000:
                dest.write_bytes(blob)
                return True
        except Exception:
            continue
    try:  # 原 URL 兜底
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        blob = urllib.request.urlopen(req, timeout=20).read()
        dest.write_bytes(blob)
        return True
    except Exception:
        return False


def iso_date(raw: str | None) -> str:
    return (raw or "")[:10]


def flags_for(info: dict[str, Any]) -> list[str]:
    flags = []
    if not (info.get("publisher") or "").strip():
        flags.append("无出版社")
    if not (info.get("isbn") or "").strip():
        flags.append("无ISBN")
    if not (info.get("wordCount") or 0):
        flags.append("无字数")
    return flags


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("query", help="书名或 bookId")
    ap.add_argument("--out", default="", help="输出目录（默认 ~/Desktop/weread-editions/<书名>）")
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--limit", type=int, default=0, help="最多下载多少张封面（默认全部）")
    args = ap.parse_args()

    key = read_key()
    query = args.query.strip()
    slug = re.sub(r"[^\w\u4e00-\u9fff-]+", "-", query)[:40] or "book"
    out_dir = pathlib.Path(args.out).expanduser() if args.out else pathlib.Path.home() / "Desktop" / "weread-editions" / slug
    covers_dir = out_dir / "covers"
    covers_dir.mkdir(parents=True, exist_ok=True)

    print(f"→ 检索「{query}」…")
    ids = [query] if query.isdigit() else search_editions(key, query)
    if not ids:
        sys.exit("没搜到任何版本")

    rows: list[dict[str, Any]] = []
    for i, bid in enumerate(ids, 1):
        info = book_info(key, bid)
        if not info:
            continue
        rows.append({
            "bookId": bid,
            "title": info.get("title", ""),
            "author": info.get("author", ""),
            "translator": info.get("translator", ""),
            "publishTime": iso_date(info.get("publishTime")),
            "publisher": info.get("publisher", ""),
            "isbn": info.get("isbn", ""),
            "category": info.get("category", ""),
            "wordCount": info.get("wordCount", 0),
            "rating": info.get("newRating") or 0,
            "ratingCount": info.get("newRatingCount") or 0,
            "cover": info.get("cover", ""),
            "readerLink": info.get("readerLink", ""),
            "deepLink": info.get("deepLink", ""),
            "flags": flags_for(info),
        })
        print(f"  [{i}/{len(ids)}] {rows[-1]['publishTime'] or '----------'}  {bid}  {rows[-1]['ratingCount']}评")

    # 只保留书名相关的版本（搜索会带出同作者其它书），按出版时间倒序
    related = [r for r in rows if not query.isdigit() and query in r["title"]] or rows
    related.sort(key=lambda r: r["publishTime"] or "", reverse=True)
    if args.limit:
        related = related[: args.limit]

    print("→ 下载封面…")
    for r in related:
        dest = covers_dir / f"{r['bookId']}.jpg"
        r["coverFile"] = str(dest) if (dest.exists() or download_cover(r["cover"], dest)) else ""

    (out_dir / "editions.json").write_text(json.dumps(related, ensure_ascii=False, indent=1), encoding="utf-8")

    sheet = build_sheet(related, args.cols, out_dir / "sheet.jpg")
    print_table(related)
    print(f"\n封面拼图：{sheet}\n清单：{out_dir / 'editions.json'}")


def build_sheet(rows: list[dict[str, Any]], cols: int, dest: pathlib.Path) -> str:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception:
        return "(未安装 Pillow，跳过拼图)"
    if not rows:
        return "(无数据)"
    cw, ch, pad, label_h = 250, 382, 14, 74
    lines = (len(rows) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cw + pad) + pad, lines * (ch + label_h + pad) + pad), (250, 250, 248))
    draw = ImageDraw.Draw(sheet)
    font = None
    for cand in ("/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
                 "/System/Library/Fonts/PingFang.ttc",
                 "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"):
        if os.path.exists(cand):
            try:
                font = ImageFont.truetype(cand, 15)
                break
            except Exception:
                pass
    if font is None:
        font = ImageFont.load_default()
    for i, r in enumerate(rows):
        x = pad + (i % cols) * (cw + pad)
        y = pad + (i // cols) * (ch + label_h + pad)
        try:
            im = Image.open(r["coverFile"]).convert("RGB")
            im.thumbnail((cw, ch))
            sheet.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
        except Exception:
            draw.text((x + 8, y + 8), "no cover", fill=(150, 0, 0), font=font)
        score = (r["rating"] or 0) / 10
        meta = " · ".join([p for p in (r["publisher"] or "?"[:0],) if p])
        head = f"{r['publishTime'] or '????-??-??'}  {r['bookId']}"
        info = f"{r['ratingCount']}评 / {score:.1f}分" + (f"  {'/'.join(r['flags'])}" if r["flags"] else "")
        draw.text((x + 2, y + ch + 6), head, fill=(40, 40, 40), font=font)
        draw.text((x + 2, y + ch + 25), info, fill=(90, 90, 90), font=font)
        title = r["title"] or ""
        if title:
            draw.text((x + 2, y + ch + 44), title[:16] + ("…" if len(title) > 16 else ""), fill=(60, 60, 60), font=font)
    sheet.save(dest, quality=88)
    return str(dest)


def print_table(rows: list[dict[str, Any]]) -> None:
    print("\n| 出版时间 | bookId | 评分 | 评价数 | 出版社 | ISBN | 书名 | 提示 |")
    print("|---|---|---|---|---|---|---|---|")
    for r in rows:
        print("| {pt} | `{bid}` | {rt:.1f} | {rc} | {pub} | {isbn} | {title} | {fl} |".format(
            pt=r["publishTime"] or "—", bid=r["bookId"], rt=(r["rating"] or 0) / 10,
            rc=r["ratingCount"], pub=r["publisher"] or "—", isbn=r["isbn"] or "—",
            title=r["title"][:28], fl="/".join(r["flags"]) or "",
        ))


if __name__ == "__main__":
    main()

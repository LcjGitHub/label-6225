"""SQLite 数据库初始化与连接管理。"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "falsefriends.db"


def get_connection() -> sqlite3.Connection:
    """获取 SQLite 连接，启用 Row 工厂以便按列名访问。"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def batch_import_entries(pair_id: int, items: list[dict]) -> dict:
    """批量导入词条，跳过与现有甲乙词完全相同的重复项。

    返回 {"imported": 成功条数, "skipped": 跳过条数}。
    """
    imported = 0
    skipped = 0
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT word_a, word_b FROM entries WHERE pair_id = ?",
            (pair_id,),
        ).fetchall()
        existing_set = {(r["word_a"], r["word_b"]) for r in existing}

        to_insert = []
        for item in items:
            word_a = (item.get("word_a") or "").strip()
            word_b = (item.get("word_b") or "").strip()
            meaning = (item.get("meaning") or "").strip()
            pitfall = (item.get("pitfall") or "").strip()
            if not word_a or not word_b or not meaning:
                skipped += 1
                continue
            if (word_a, word_b) in existing_set:
                skipped += 1
                continue
            to_insert.append((pair_id, word_a, word_b, meaning, pitfall))
            existing_set.add((word_a, word_b))

        if to_insert:
            conn.executemany(
                """
                INSERT INTO entries (pair_id, word_a, word_b, meaning, pitfall)
                VALUES (?, ?, ?, ?, ?)
                """,
                to_insert,
            )
            conn.commit()
            imported = len(to_insert)

    return {"imported": imported, "skipped": skipped}


def init_db() -> None:
    """创建表结构（若不存在）。"""
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS language_pairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lang_a TEXT NOT NULL,
                lang_b TEXT NOT NULL,
                label TEXT NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_language_pairs_unique
            ON language_pairs (lang_a, lang_b);

            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pair_id INTEGER NOT NULL,
                word_a TEXT NOT NULL,
                word_b TEXT NOT NULL,
                meaning TEXT NOT NULL,
                pitfall TEXT NOT NULL DEFAULT '',
                FOREIGN KEY (pair_id) REFERENCES language_pairs(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()

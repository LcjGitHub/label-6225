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

"""种子数据：1 个语言对 + 5 条假朋友词条。"""

from database import get_connection


def seed_if_empty() -> None:
    """若数据库为空则写入示例数据。"""
    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM language_pairs").fetchone()[0]
        if count > 0:
            return

        cursor = conn.execute(
            """
            INSERT INTO language_pairs (lang_a, lang_b, label)
            VALUES (?, ?, ?)
            """,
            ("法语", "英语", "法语 ↔ 英语"),
        )
        pair_id = cursor.lastrowid

        entries = [
            (
                "actuellement",
                "actually",
                "法语：目前、现在；英语 actually：实际上、其实",
                "法语 actuellement 不是「实际上」，而是「目前」。",
            ),
            (
                "préservatif",
                "preservative",
                "法语：避孕套；英语 preservative：防腐剂",
                "极易误解：préservatif 在法语日常指避孕套，与食品防腐剂无关。",
            ),
            (
                "librairie",
                "library",
                "法语：书店；英语 library：图书馆",
                "librairie 是卖书的地方，不是借书的图书馆。",
            ),
            (
                "assister",
                "assist",
                "法语：出席、参加；英语 assist：协助、帮助",
                "assister à 表示「到场参加」，不是「提供帮助」。",
            ),
            (
                "sensible",
                "sensible",
                "法语：敏感的；英语 sensible：明智的、合理的",
                "拼写相同但含义不同：法语 sensible = sensitive。",
            ),
        ]

        conn.executemany(
            """
            INSERT INTO entries (pair_id, word_a, word_b, meaning, pitfall)
            VALUES (?, ?, ?, ?, ?)
            """,
            [(pair_id, w_a, w_b, meaning, pitfall) for w_a, w_b, meaning, pitfall in entries],
        )
        conn.commit()

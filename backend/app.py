"""假朋友词对照表 API 服务。"""

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import init_db
from seed import seed_if_empty

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def row_to_dict(row):
    """将 sqlite3.Row 转为 dict。"""
    return dict(row) if row else None


@app.get("/api/health")
def health():
    """健康检查。"""
    return jsonify({"status": "ok"})


@app.get("/api/pairs")
def list_pairs():
    """获取所有语言对。"""
    from database import get_connection

    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT p.*,
                   (SELECT COUNT(*) FROM entries e WHERE e.pair_id = p.id) AS entry_count
            FROM language_pairs p
            ORDER BY p.id
            """
        ).fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/api/pairs/<int:pair_id>")
def get_pair(pair_id: int):
    """获取单个语言对。"""
    from database import get_connection

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
    if not row:
        return jsonify({"error": "语言对不存在"}), 404
    return jsonify(row_to_dict(row))


@app.post("/api/pairs")
def create_pair():
    """创建语言对。"""
    from database import get_connection

    data = request.get_json(silent=True) or {}
    lang_a = (data.get("lang_a") or "").strip()
    lang_b = (data.get("lang_b") or "").strip()
    label = (data.get("label") or "").strip()

    if not lang_a or not lang_b or not label:
        return jsonify({"error": "语言甲名称、语言乙名称、展示标题为必填项"}), 400

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM language_pairs WHERE lang_a = ? AND lang_b = ?",
            (lang_a, lang_b),
        ).fetchone()
        if existing:
            return jsonify({"error": "该语言组合已存在"}), 400

        cursor = conn.execute(
            """
            INSERT INTO language_pairs (lang_a, lang_b, label)
            VALUES (?, ?, ?)
            """,
            (lang_a, lang_b, label),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM language_pairs WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return jsonify(row_to_dict(row)), 201


@app.put("/api/pairs/<int:pair_id>")
def update_pair(pair_id: int):
    """更新语言对。"""
    from database import get_connection

    data = request.get_json(silent=True) or {}
    lang_a = (data.get("lang_a") or "").strip()
    lang_b = (data.get("lang_b") or "").strip()
    label = (data.get("label") or "").strip()

    if not lang_a or not lang_b or not label:
        return jsonify({"error": "语言甲名称、语言乙名称、展示标题为必填项"}), 400

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "语言对不存在"}), 404

        duplicate = conn.execute(
            "SELECT id FROM language_pairs WHERE lang_a = ? AND lang_b = ? AND id != ?",
            (lang_a, lang_b, pair_id),
        ).fetchone()
        if duplicate:
            return jsonify({"error": "该语言组合已存在"}), 400

        conn.execute(
            """
            UPDATE language_pairs
            SET lang_a = ?, lang_b = ?, label = ?
            WHERE id = ?
            """,
            (lang_a, lang_b, label, pair_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()

    return jsonify(row_to_dict(row))


@app.delete("/api/pairs/<int:pair_id>")
def delete_pair(pair_id: int):
    """删除语言对。"""
    from database import get_connection

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "语言对不存在"}), 404

        conn.execute("DELETE FROM language_pairs WHERE id = ?", (pair_id,))
        conn.commit()

    return "", 204


@app.get("/api/pairs/<int:pair_id>/entries")
def list_entries(pair_id: int):
    """获取某语言对下的全部词条。"""
    from database import get_connection

    with get_connection() as conn:
        pair = conn.execute(
            "SELECT id FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not pair:
            return jsonify({"error": "语言对不存在"}), 404
        rows = conn.execute(
            """
            SELECT * FROM entries WHERE pair_id = ? ORDER BY id
            """,
            (pair_id,),
        ).fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.post("/api/pairs/<int:pair_id>/entries")
def create_entry(pair_id: int):
    """新增词条。"""
    from database import get_connection

    data = request.get_json(silent=True) or {}
    word_a = (data.get("word_a") or "").strip()
    word_b = (data.get("word_b") or "").strip()
    meaning = (data.get("meaning") or "").strip()
    pitfall = (data.get("pitfall") or "").strip()

    if not word_a or not word_b or not meaning:
        return jsonify({"error": "语言A词、语言B词、含义为必填项"}), 400

    with get_connection() as conn:
        pair = conn.execute(
            "SELECT id FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not pair:
            return jsonify({"error": "语言对不存在"}), 404

        cursor = conn.execute(
            """
            INSERT INTO entries (pair_id, word_a, word_b, meaning, pitfall)
            VALUES (?, ?, ?, ?, ?)
            """,
            (pair_id, word_a, word_b, meaning, pitfall),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM entries WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return jsonify(row_to_dict(row)), 201


@app.put("/api/entries/<int:entry_id>")
def update_entry(entry_id: int):
    """更新词条。"""
    from database import get_connection

    data = request.get_json(silent=True) or {}
    word_a = (data.get("word_a") or "").strip()
    word_b = (data.get("word_b") or "").strip()
    meaning = (data.get("meaning") or "").strip()
    pitfall = (data.get("pitfall") or "").strip()

    if not word_a or not word_b or not meaning:
        return jsonify({"error": "语言A词、语言B词、含义为必填项"}), 400

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "词条不存在"}), 404

        conn.execute(
            """
            UPDATE entries
            SET word_a = ?, word_b = ?, meaning = ?, pitfall = ?
            WHERE id = ?
            """,
            (word_a, word_b, meaning, pitfall, entry_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()

    return jsonify(row_to_dict(row))


@app.delete("/api/entries/<int:entry_id>")
def delete_entry(entry_id: int):
    """删除词条。"""
    from database import get_connection

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "词条不存在"}), 404

        conn.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
        conn.commit()

    return "", 204


if __name__ == "__main__":
    init_db()
    seed_if_empty()
    app.run(host="0.0.0.0", port=7000, debug=True)

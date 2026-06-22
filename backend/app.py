"""假朋友词对照表 API 服务。"""

import json
from urllib.parse import quote

from flask import Flask, Response, jsonify, request
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
            """
            SELECT id FROM language_pairs 
            WHERE (lang_a = ? AND lang_b = ?) OR (lang_a = ? AND lang_b = ?)
            """,
            (lang_a, lang_b, lang_b, lang_a),
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
            """
            SELECT id FROM language_pairs 
            WHERE ((lang_a = ? AND lang_b = ?) OR (lang_a = ? AND lang_b = ?))
            AND id != ?
            """,
            (lang_a, lang_b, lang_b, lang_a, pair_id),
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
    """获取某语言对下的词条，支持关键词模糊搜索。"""
    from database import get_connection

    keyword = (request.args.get("keyword") or "").strip()

    with get_connection() as conn:
        pair = conn.execute(
            "SELECT id FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not pair:
            return jsonify({"error": "语言对不存在"}), 404

        if keyword:
            like_pattern = f"%{keyword}%"
            rows = conn.execute(
                """
                SELECT * FROM entries
                WHERE pair_id = ?
                  AND (word_a LIKE ? OR word_b LIKE ? OR meaning LIKE ? OR pitfall LIKE ?)
                ORDER BY id
                """,
                (pair_id, like_pattern, like_pattern, like_pattern, like_pattern),
            ).fetchall()
        else:
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


@app.get("/api/pairs/<int:pair_id>/entries/export")
def export_entries(pair_id: int):
    """将指定语言对下全部词条导出为 JSON 文件。"""
    from database import get_connection

    with get_connection() as conn:
        pair = conn.execute(
            "SELECT * FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not pair:
            return jsonify({"error": "语言对不存在"}), 404

        rows = conn.execute(
            "SELECT word_a, word_b, meaning, pitfall FROM entries WHERE pair_id = ? ORDER BY id",
            (pair_id,),
        ).fetchall()

    payload = {
        "pair": {
            "lang_a": pair["lang_a"],
            "lang_b": pair["lang_b"],
            "label": pair["label"],
        },
        "entries": [dict(r) for r in rows],
    }
    ascii_name = f"entries_pair{pair_id}.json"
    utf8_name = f"entries_{pair['lang_a']}_{pair['lang_b']}.json"
    encoded = quote(utf8_name, safe="")
    content = json.dumps(payload, ensure_ascii=False, indent=2)
    return Response(
        content,
        mimetype="application/json",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded}'
            )
        },
    )


@app.post("/api/pairs/<int:pair_id>/entries/import")
def import_entries(pair_id: int):
    """从上传的 JSON 文件批量导入词条，跳过与现有甲乙词完全相同的重复项。"""
    from database import batch_import_entries, get_connection

    with get_connection() as conn:
        pair = conn.execute(
            "SELECT id FROM language_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
        if not pair:
            return jsonify({"error": "语言对不存在"}), 404

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "未上传文件"}), 400

    try:
        raw = file.read().decode("utf-8")
        data = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        return jsonify({"error": f"文件解析失败：{exc}"}), 400

    if isinstance(data, dict) and "entries" in data:
        items = data["entries"]
    elif isinstance(data, list):
        items = data
    else:
        return jsonify({"error": "文件格式不正确，需要包含 entries 数组或直接为数组"}), 400

    if not isinstance(items, list):
        return jsonify({"error": "entries 字段必须为数组"}), 400

    result = batch_import_entries(pair_id, items)
    return jsonify(result)


if __name__ == "__main__":
    init_db()
    seed_if_empty()
    app.run(host="0.0.0.0", port=7000, debug=True)

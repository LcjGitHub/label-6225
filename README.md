# 假朋友词对照表

跨语言「假朋友词」（False Friends）对照与 CRUD 管理 MVP。

| 层级 | 技术栈 | 端口 |
|------|--------|------|
| 前端 | React + MUI · TanStack Query + axios | **7101** |
| 后端 | Flask + SQLite (`./data/falsefriends.db`) | **7000** |

## 功能

- **语言对列表**：展示已有语言对及词条数量
- **词条对照表**：字段含语言 A 词、语言 B 词、含义、易错说明，支持增删改查
- **种子数据**：1 个语言对（法语 ↔ 英语）+ 5 条示例词条

## 目录结构

```
├── backend/          # Flask API
├── frontend/         # React 前端
├── data/             # SQLite 数据库（首次启动自动生成）
└── README.md
```

## 环境要求

- Python 3.10+
- Node.js 18+（使用项目内 `npm`，无需全局 pnpm/yarn）

## 启动

### 1. 后端（端口 7000）

```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```

首次运行会自动创建 `data/falsefriends.db` 并写入种子数据。

### 2. 前端（端口 7101）

另开终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问：<http://localhost:7101>

> 开发模式下，前端通过 Vite 代理将 `/api` 请求转发至 `http://localhost:7000`。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pairs` | 语言对列表 |
| GET | `/api/pairs/:id` | 单个语言对 |
| GET | `/api/pairs/:id/entries` | 词条列表 |
| POST | `/api/pairs/:id/entries` | 新增词条 |
| PUT | `/api/entries/:id` | 更新词条 |
| DELETE | `/api/entries/:id` | 删除词条 |

## 重置数据库

删除 `data/falsefriends.db` 后重启后端，将重新建表并 seed。

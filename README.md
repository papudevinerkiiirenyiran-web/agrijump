# 🥏 AgriJump

> Find your next drop on campus and Jump In.

AgriJump 是一个 mobile-first 的 PWA，主打「地图上一键加入校园活动」——飞盘局、咖啡自习、胶片漫步、Aperitivo……。视觉走 Spotify + 复古胶片校园风（复古草坪绿 / 日落暖橙 / 胶片米白），开箱即用支持深色模式、可安装到桌面。

## ✨ 关键能力

- **Discovery Map 主页**：上下分屏（Leaflet + OSM + Emoji 大头针 / 可拖拽卡片抽屉），滑动卡片自动联动地图
- **Drop Zone 详情页**：满宽沉浸式头图 + 黑色渐变遮罩 + 发起人 + Facepile + 悬浮全宽亮橙 FAB `🚀 Send It!`
- **干净的数据契约**：`lib/types.ts` 是前后端唯一约定；`lib/adapters.ts` 把 Supabase / Google Sheets 行转成 `CampusEvent[]`，UI 一行不动
- **PWA**：`manifest.webmanifest` + `sw.js` + iOS Web App Meta，浏览器「添加到主屏幕」即像原生 App
- **设计系统**：`tailwind.config.ts` 定义了 moss / sunset / paper / ink 四套色板和胶囊、阴影、动效

## 🚀 本地预览

```bash
cd agrijump
npm install
npm run dev          # http://localhost:3000
```

生产构建：

```bash
npm run build
npm start
```

## 🐙 推送到 GitHub + Vercel 部署

Vercel 对 Next.js 零配置开箱支持，PWA 资源自动按 `/public` 提供。

1. 在 GitHub 上创建空仓库，例如 `agrijump`。
2. 本地首次推送：
   ```bash
   cd agrijump
   git init
   git add .
   git commit -m "feat: AgriJump v0.1 — Discovery Map + Drop Zone"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/agrijump.git
   git push -u origin main
   ```
3. 打开 https://vercel.com → **New Project** → Import 这个 GitHub 仓库。
4. 框架预设会自动识别为 Next.js，保持默认 → **Deploy**。
5. 部署完成后会得到一个 `https://agrijump-<hash>.vercel.app` 的链接——直接复制发给你的同学，他们可以在 Safari / Chrome「添加到主屏幕」，桌面/App 列表里就会出现 🌿 AgroJump 图标。

> iOS Safari 首次需点底部「分享 → 添加到主屏幕」；Android Chrome 通常会自动弹出安装横幅。

## 🔌 切换到真实后端

只需修改 `app/api/events/route.ts`：

```ts
import { createClient } from '@supabase/supabase-js';
import { rowsToEvents } from '@/lib/adapters';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET() {
  const { data } = await db.from('events').select('*').order('starts_at');
  return NextResponse.json({ events: rowsToEvents(data ?? []) });
}
```

字段对照写在 `lib/adapters.ts`——后端只需保持那套 CSV/列名即可，前端一行不动。

## 🎨 设计令牌速查

| Token | 颜色 |
| --- | --- |
| moss-500（主色） | `#6A8343` |
| moss-600（已加入） | `#566B36` |
| sunset-500（FAB） | `#FF7F26` |
| paper-100（背景） | `#F5F2E9` |
| ink-900（深色背景） | `#111209` |

字体：`Bricolage Grotesque`（display）+ `Figtree`（body），由 `next/font/google` 在构建时下载并自托管，零 CDN 依赖。
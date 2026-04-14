# PixivCollection

![preview](docs/screenshot.jpg)

这是一个基于上游项目二次维护的个人 fork，当前主要围绕 Cloudflare Pages 部署、AI 作品识别与筛选、以及日常浏览体验做了持续优化。

在线示例：

- 当前 fork 部署：[pixivcollection.pages.dev](https://pixivcollection.pages.dev/)
- 上游仓库：[orilights/PixivCollection](https://github.com/orilights/PixivCollection)

## 说明

本 README 只记录这个 fork 自上游之后新增或调整的内容。

关于项目原始介绍、基础功能、数据抓取脚本、完整部署流程、环境变量说明等，请直接查看上游仓库文档：

- 上游项目主页：[orilights/PixivCollection](https://github.com/orilights/PixivCollection)
- 上游脚本说明：[python_scripts/pixiv_collection](https://github.com/orilights/PixivCollection/tree/main/python_scripts/pixiv_collection)

## 相对上游的更新

### AI 作品外显与筛选

- 为识别到 AI 标签的作品增加了显式角标，文案为“AI生成”
- AI 角标支持在设置中开启或关闭
- 新增“AI生成作品”筛选开关，可一键显示或排除 AI 作品
- AI 判定采用前端归一化后的精确别名匹配，避免普通标签误伤

### 浏览体验优化

- 增加顶部快捷筛选条，集中放置搜索、AI、R18、排序、收藏数预设等高频操作
- 侧边栏“已选项”区域补充了更完整的筛选摘要
- 页面会记住更多浏览状态，包括筛选条件、侧边栏状态、滚动位置等
- 主界面增加当前结果统计与数据更新时间展示

### 加载与查看优化

- 首屏加载改为更明确的加载提示，并增加骨架屏占位
- 区分“加载失败”“数据为空”“筛选后无结果”三种状态
- 元数据加载失败时支持直接重试
- 缩略图加载失败时，卡片内可直接点击重试
- 图片查看器增加当前位置显示、键盘提示与双击缩放

### 默认设置调整

- 默认图片间隙调整为 `10px`
- 默认图片最小宽度调整为 `280px`
- 默认最高不健全度调整为 `6`
- 默认显示 AI 作品
- 默认显示卡片阴影

## 部署

这个 fork 仍然保持静态站部署方式，最常见的部署方式是 Cloudflare Pages。

构建命令：

```bash
pnpm install
pnpm build
```

构建输出目录：

```bash
dist
```

如果你已经准备好了 `images.json` 和图片资源目录，部署方式与上游保持一致。

## 致谢

感谢上游项目提供基础架构与原始实现。

- 上游仓库：[orilights/PixivCollection](https://github.com/orilights/PixivCollection)

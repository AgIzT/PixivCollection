# PixivCollection 个人修改版

本仓库基于上游项目 [orilights/PixivCollection](https://github.com/orilights/PixivCollection) 继续。


![preview](docs/screenshot.jpg)

## 增强

### 1. AI 作品识别与外显

- 数据加载时会根据标签自动识别 AI 作品，并写入 `aiGenerated` 字段。
- 侧栏新增 AI 作品筛选开关，可选择是否显示 AI 生成作品。
- 瀑布流卡片支持 AI 角标，方便在浏览时直接识别。
- 上传本地 JSON 或在线模式加载数据时都会进行同样的 AI 标记归一化。

### 2. 视觉润色

- 瀑布流图片加载占位不再只是纯色块，而是基于 `dominant_color` 生成模糊渐变背景。
- 图片未加载完成时增加 shimmer 扫光动画，让等待状态更自然。
- 缩略图加载完成后继续使用淡入淡出过渡，避免突兀切换。
- 滚动中新进入视口的卡片增加轻量 fade-up 入场动画。
- 首屏内容不会整体弹入，动画主要作用于后续进入视口的卡片。

### 3. 浏览增强

- 侧栏“图片排序”新增 **色相排序**。
- 色相排序会把 `dominant_color` 转成 HSL，按 hue / saturation / lightness 排列图片，形成更接近颜色墙的浏览体验。
- 图片查看器底部新增 **相似图片推荐条**。
- 推荐逻辑基于共享标签，不依赖机器学习；同作者会获得额外权重。
- 推荐会排除 `users入り` 这类泛标签，减少无效匹配。
- 拖动或缩放主图时，推荐条会自动隐藏，避免遮挡操作。

### 4. 统计仪表盘

- 新增基于 Chart.js 的统计面板，可从顶部导航栏或侧栏打开。
- 图表数据基于当前筛选结果 `imagesFiltered`，因此筛选后统计会同步变化。
- 当前包含 5 个图表：
  - 收藏时间线：按月份统计收藏作品数量。
  - Top 作者：展示收藏数量最高的作者。
  - Top 标签：展示出现频率最高的标签，并排除泛标签。
  - 收藏数分布：按收藏数区间统计图片数量。
  - 图片尺寸散点：按宽高散点展示图片尺寸，并区分横向、竖向、方形。
- 统计面板支持暗色模式、关闭按钮和 `Esc` 关闭。

## 原上游能力

- 静态 SPA，无后端依赖。
- 默认从 `images.json` 加载收藏数据。
- 支持瀑布流布局，可调整列数、间距、最小图片宽度。
- 支持虚拟列表，适合较大规模图片集合。
- 支持图片查看器，包括鼠标/触控缩放、拖动、上一张/下一张。
- 支持按年份、形状、尺寸、不健全度、R18、作者、标签、收藏数筛选。
- 支持按图片 ID、标题、作者、标签和标签翻译搜索。
- 支持夜间模式、全屏模式。
- 支持基于 HibiAPI 的在线模式。

## 使用方式

安装依赖：

```bash
pnpm i
```

本地开发：

```bash
pnpm dev
```

生产构建：

```bash
pnpm build
```

构建后的静态文件位于 `dist/`。部署时将 `dist/` 上传到静态服务器即可。

## 数据文件

默认读取项目根路径下的 `images.json`。图片文件默认路径如下：

- 原图：`./image/original/`
- 预览图：`./image/preview/`
- 缩略图：`./image/thumbnail/`

图片文件名默认格式为：

```text
{id}_p{part}.{ext}
```

数据爬取脚本仍可参考上游作者的工具：

[orilights/python_scripts - pixiv_collection](https://github.com/orilights/python_scripts/tree/main/pixiv_collection)

## 可用环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_DATA_FILE` | `./images.json` | 数据文件路径 |
| `VITE_IMAGE_PATH_ORIGINAL` | `./image/original/` | 原图目录 |
| `VITE_IMAGE_PATH_PREVIEW` | `./image/preview/` | 预览图目录 |
| `VITE_IMAGE_PATH_THUMBNAIL` | `./image/thumbnail/` | 缩略图目录 |
| `VITE_IMAGE_FILENAME` | `{id}_p{part}.{ext}` | 图片文件名格式 |
| `VITE_IMAGE_FORMAT_PREVIEW` | `webp` | 预览图格式，设置为 `<ext>` 时使用原图格式 |
| `VITE_IMAGE_FORMAT_THUMBNAIL` | `webp` | 缩略图格式，设置为 `<ext>` 时使用原图格式 |
| `VITE_IMAGE_ALLOW_DOWNLOAD_ORIGINAL` | `true` | 是否允许下载原图 |
| `VITE_MASONRY_LOAD_DELAY` | `300` | 瀑布流图片加载延迟，单位毫秒 |
| `VITE_MASONRY_COLOR_HUE_SORT_START` | `240` | 色相排序的起始色相角度，默认从蓝色开始，紫色可设为 `270` |
| `VITE_ONLINE_MODE` | `false` | 是否开启在线模式 |
| `VITE_ONLINE_API` | 空 | HibiAPI Pixiv 收藏夹接口 |
| `VITE_ONLINE_USER_ID` | 空 | Pixiv 用户 ID |
| `VITE_ONLINE_PXIMG` | `pximg.orilight.top` | Pixiv 图片代理 |
| `INJECT_HEAD` | 空 | 构建时插入到 HTML head 末尾的内容 |

## 技术栈变化

上游主要技术栈保持不变：

- Vue 3 + TypeScript
- Pinia
- Tailwind CSS
- Vite
- OverlayScrollbars
- `@orilight/vue-settings`

本版本新增：

- `chart.js`：用于统计仪表盘图表渲染。

## 待审查技术债

以下问题暂不影响当前功能：

1. `MasonryItem.vue` 里的 `normalizeHexColor` / `hexToRgb` 等颜色工具函数和 `utils/index.ts` 中已有颜色工具存在重复，后续可以统一迁移到 `utils`。
2. `StatsPanel` 的图表更新目前采用 `destroy + new Chart`，可以改成更新 `chart.data` 后调用 `chart.update()`，以获得更平滑的过渡动画并减少重建成本。
3. `MasonryItem` 的 `will-change: opacity, transform` 在动画结束后仍保留，图片数量很大时可能占用额外 GPU 内存；可以在动画完成后移除该提示。

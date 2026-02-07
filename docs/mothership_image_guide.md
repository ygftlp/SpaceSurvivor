# 母舰图片资源使用指南

## 快速开始

### 1. 下载免费素材

推荐几个高质量的免费母舰素材：

**方案A：OpenGameArt（推荐）**
- 访问：https://opengameart.org/content/mother-ship-with-fighter
- 下载 ships.png
- 里面包含母舰和战斗机

**方案B：UFO Sprites 套装**
- 访问：https://opengameart.org/content/ufo-sprites
- 下载 ufo_game_art.zip
- 包含母舰、战斗机、UFO等完整素材

**方案C：Google搜索**
- 搜索关键词："sci-fi mothership sprite png transparent"
- 或使用："space carrier sprite top down"

### 2. 放置图片

将下载的图片重命名为 `mothership.png`，放到项目文件夹：
```
SpaceSurvivor/
├── images/
│   └── mothership.png  <-- 放在这里
├── js/
│   └── object/
│       └── Mothership.js
```

### 3. 切换使用图片版本

编辑 `js/scene/battleScene.js`：

```javascript
// 第7行，修改导入
import Mothership from '../object/Mothership_v2.js';  // 使用新版本
```

或者直接将 `Mothership_v2.js` 重命名为 `Mothership.js` 覆盖原文件。

## 图片要求

### 理想规格
- **格式**：PNG（支持透明背景）
- **尺寸**：256x256 到 512x512 像素
- **视角**：俯视视角（top-down view）
- **风格**：科幻风格，有飞船/航母的感觉

### 推荐特征
母舰图片最好包含以下元素：
- ✅ 宽大的主体（像航母甲板）
- ✅ 指挥塔/舰桥结构
- ✅ 引擎喷口（底部）
- ✅ 金属质感和细节
- ✅ 发光部件（窗户、引擎等）

## 如果找不到合适的图片

### 方案1：AI生成
使用 AI 工具生成：
- **Midjourney**：`/imagine prompt: sci-fi mothership carrier spaceship top down view, transparent background, game sprite, detailed, 256x256`
- **DALL-E**：类似提示词
- **Stable Diffusion**：本地生成

### 方案2：自己绘制
使用免费工具：
- **GIMP**（免费）
- **Krita**（免费，适合绘画）
- **Photoshop**（如果你有）

### 方案3：继续使用代码绘制
如果暂时找不到图片，可以继续使用旧版本。我已经优化了绘制代码，效果会好一些。

## 故障排除

### 图片不显示
1. 检查文件路径：`images/mothership.png`
2. 检查文件名是否完全匹配（区分大小写）
3. 打开浏览器控制台（F12）查看错误信息

### 图片变形
代码会自动保持图片的宽高比，但如果图片本身比例太奇怪，可能会显得不协调。

### 需要调整大小
在 `Mothership_v2.js` 第12行修改：
```javascript
this.width = 240;  // 改为你想要的大小
```

## 推荐的免费资源网站

1. **OpenGameArt.org** - 免费游戏素材
2. **itch.io** - 搜索 "spaceship asset" 或 "sci-fi sprite"
3. **GameArt2D.com** - 部分免费
4. **CraftPix.net** - 部分免费
5. **Flaticon.com** - 简单的矢量图标

## 版权注意

使用免费素材时请注意：
- ✅ CC0 - 可商用，无需署名
- ✅ CC-BY - 可商用，需要署名
- ❌ 禁止商用 - 只能个人使用

建议在游戏 credits 中注明素材来源。

## 下一步

有了母舰图片后，你还可以考虑：
1. 为战机（J-20/F-22/Su-57）也找图片替换
2. 为背景找星空图片
3. 为敌人找虫族/外星飞船图片

整个游戏的视觉效果会大幅提升！

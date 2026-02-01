# 项目开发规范 (Project Rules)

## 1. 语言规范 (Localization)
*   **[必须]** 所有面向用户的 UI 展示文字必须使用 **简体中文**。
*   包括但不限于：
    *   按钮文字 (e.g., "开始游戏" 而不是 "Start")
    *   标签与标题 (e.g., "金币" 而不是 "Gold")
    *   状态提示 (e.g., "加载中..." 而不是 "Loading")
    *   物品名称 (e.g., "主炮" 而不是 "MainGun")

## 2. 目录结构
*   `js/scene/`: 游戏场景 (场景管理)
*   `js/ui/`: 通用 UI 组件 (弹窗、HUD)
*   `js/object/`: 游戏实体 (玩家、敌人、掉落物)
*   `js/platform/`: 平台适配 (微信/抖音)

## 3. 代码风格
*   使用 ES6 Module (`import`/`export`).
*   类名使用 CamelCase (大驼峰), 变量/方法使用 lowerCamelCase (小驼峰).

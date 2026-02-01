# Space Survivor Implementation Walkthrough

## 1. 架构概览 (Architecture)

```mermaid
graph TD
    Main[Main.js] --> SceneManager
    Main --> PlatformAdapter[Platform (wx/douyin)]
    
    SceneManager --> Splash[SplashScene]
    SceneManager --> Home[HomeScene]
    SceneManager --> Battle[BattleScene]
    SceneManager --> Result[ResultScene]
    SceneManager --> Profile[ProfileScene]
    
    Home --> Popup[EquipmentPopup]
    
    Battle --> Menu[Tactical Backpack]
    Battle --> WaveMgr[WaveManager]
    Battle --> DataMgr[DataManager]
    
    DataMgr --> Fighters[Fighters Config]
```

## 2. 核心场景 (Scenes)

### 2.3 个人中心 (ProfileScene)
*   **功能**: 统一管理入口。
*   **标签页 (Tabs)**:
    *   **账户**: 显示指挥官等级、金币、钻石。
    *   **战机 (Hangar)**: **[新增]** 战机选择界面。
        *   **渲染技术**: 全面采用 **Canvas API** 实时绘制，支持动态特效与无损缩放。
        *   **威龙 (J-20)**: 银灰渐变，鸭翼布局，蓝色引擎光效。
        *   **猛禽 (F-22)**: 隐身涂装，菱形机翼，矢量喷口细节。
        *   **幽灵 (Su-57)**: 数字迷彩，扁平宽体，紫色科技光效。
    *   **装备**: 网格化展示所有装备 (仓库)。

### 2.4 战斗 (BattleScene)
*   **核心玩法**:
    *   摇杆控制战机移动，自动射击。
    *   **战术背包**: 不暂停游戏，即时选择增益 (火力/射速/散射)。
    *   **动态边界**: 适配各种屏幕尺寸。
    *   **个性化战机**: 玩家驾驶当前选中的战机出战，拥有不同的外观和基础属性。

## 3. 本地化与规范 (Localization & Rules)
*   所有面向用户的 UI 展示文字必须使用 **简体中文**。

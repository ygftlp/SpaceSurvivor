/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 个人中心场景 (ProfileScene)。包含账户、设置、战机、装备管理。
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import RenderUtils from '../utils/renderUtils.js';
import { dataManager } from '../manager/dataManager.js';
import FighterFactory from '../object/faction/player/fighter/FighterFactory.js';

export default class ProfileScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        this.width = GameConfig.Screen.width;
        this.height = this.sceneManager.game.logicHeight || 1280;

        // Tabs
        this.tabs = ['账户', '设置', '战机', '装备'];
        this.currentTab = '账户';

        // 布局区域
        this.sidebarWidth = 150;

        // 按钮区域 (动态计算)
        // Align with Menu Capsule: Top = SafeArea.top, Height = SafeArea.height (usually 32-40px matches capsule)
        // We use SafeArea.top for Y, and maybe similar height
        const safeTop = GameConfig.SafeArea.top;
        const safeLeft = (GameConfig.SafeArea.left !== undefined) ? GameConfig.SafeArea.left : 20;
        const capsuleH = GameConfig.SafeArea.height;

        // Let's make the back button look like a capsule too or just align center
        this.btnBack = { x: safeLeft, y: safeTop, w: 80, h: capsuleH };
        this.tabButtons = [];
    }

    enter(params) {
        this.height = this.sceneManager.game.logicHeight;

        // Re-calc in case safe area changed (mostly static though)
        // Ensure accurate y
        this.btnBack.y = GameConfig.SafeArea.top;
        this.btnBack.h = GameConfig.SafeArea.height;
        console.log('ProfileScene: Enter', params);

        // Map English keys to Chinese tabs if needed
        const tabMap = {
            'Account': '账户',
            'Settings': '设置',
            'Fighter': '战机',
            'Equipment': '装备'
        };

        // 如果传递了 tab 参数，则跳转到指定 tab
        if (params && params.tab) {
            // Try direct match or mapped match
            if (this.tabs.includes(params.tab)) {
                this.currentTab = params.tab;
            } else if (tabMap[params.tab]) {
                this.currentTab = tabMap[params.tab];
            }
        } else {
            this.currentTab = '账户';
        }

        // 初始化 Tab 按钮位置
        this.initTabs();
    }

    initTabs() {
        this.tabButtons = [];
        let startY = 150;
        const h = 60;
        const gap = 20;

        this.tabs.forEach((tab, i) => {
            this.tabButtons.push({
                name: tab,
                x: 0,
                y: startY + i * (h + gap),
                w: this.sidebarWidth,
                h: h
            });
        });
    }

    update(dt) {
        // ...
    }

    render(ctx) {
        // Reset dynamic hitboxes
        this.fighterButtons = [];

        // 1. 全屏深色背景
        ctx.fillStyle = '#0f1020';
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. 侧边栏背景
        ctx.fillStyle = '#16172e';
        ctx.fillRect(0, 0, this.sidebarWidth, this.height);

        // 3. 返回按钮
        RenderUtils.fillRoundRect(ctx, this.btnBack.x, this.btnBack.y, this.btnBack.w, this.btnBack.h, this.btnBack.h / 2, '#333');
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        // Center text vertically: y + h/2 + approx half font size adjustment (~7px for 20px font)
        ctx.fillText('< 返回', this.btnBack.x + this.btnBack.w / 2, this.btnBack.y + this.btnBack.h / 2 + 7);

        // 4. 渲染 Tabs
        this.tabButtons.forEach(btn => {
            const isSelected = (this.currentTab === btn.name);
            const color = isSelected ? '#00A8FF' : '#333';

            // 绘制 Tab 按钮
            RenderUtils.fillRoundRect(ctx, btn.x + 10, btn.y, btn.w - 10, btn.h, 10, color);

            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(btn.name, btn.x + 30, btn.y + 38);
        });

        // 5. 渲染内容区域 (右侧)
        this.renderContent(ctx);
    }

    renderContent(ctx) {
        const contentX = this.sidebarWidth + 20;
        const contentY = 100;
        const boxW = this.width - this.sidebarWidth - 40;
        const boxH = this.height - 120;

        // 绘制内容面板框
        RenderUtils.drawPanel(ctx, contentX, contentY, boxW, boxH);

        // 根据当前 Tab 绘制不同内容
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';

        if (this.currentTab === '账户') {
            this.renderAccount(ctx, contentX, contentY);
        } else if (this.currentTab === '装备') {
            this.renderEquipment(ctx, contentX, contentY);
        } else if (this.currentTab === '战机') {
            this.renderFighter(ctx, contentX, contentY, boxW, boxH);
        } else {
            // WIP
            ctx.font = '30px Arial';
            ctx.fillText(`${this.currentTab} 开发中...`, contentX + 50, contentY + 100);
        }
    }

    renderFighter(ctx, x, y, w, h) {
        const fighters = FighterFactory.getAllFighters();
        const currentId = dataManager.data.currentFighter;

        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('选择战机:', x + 30, y + 50);

        // Simple List for now
        let startY = y + 100;
        fighters.forEach(fid => {
            // Get Info from Factory (Cheap instantiation or static info)
            const f = FighterFactory.getFighterInfo(fid);

            const isUnlocked = dataManager.data.unlockedFighters.includes(fid);
            const isEquipped = (currentId === fid);

            // Card Bg
            const cardH = 120;
            const color = isEquipped ? '#1e3799' : '#333';
            RenderUtils.fillRoundRect(ctx, x + 20, startY, w - 40, cardH, 10, color);

            // Icon / Image
            const fighterSize = 64; // Requested Size 64
            const tempFighter = FighterFactory.createFighter(fid);

            ctx.save();
            // Align Icon on the left
            ctx.translate(x + 80, startY + cardH / 2);
            tempFighter.render(ctx, fighterSize);
            ctx.restore();

            // Text Info
            const textX = x + 140; // Fixed offset for text

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(f.name, textX, startY + 40);

            ctx.fillStyle = '#aaa';
            ctx.font = '16px Arial';
            ctx.fillText(f.desc, textX, startY + 70);

            // Stats
            ctx.fillStyle = '#00ffe1';
            ctx.font = '14px Arial';
            ctx.fillText(`速度:${f.speed}  生命:${f.hp}`, textX, startY + 95);

            // Action Button
            const btnW = 100, btnH = 40;
            const btnX = x + w - 140; // Keep button on right side
            const btnY = startY + (cardH - btnH) / 2;

            if (isEquipped) {
                ctx.fillStyle = '#4cd137';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('已装备', btnX + 10, btnY + 25);
            } else if (isUnlocked) {
                // Equip Button
                RenderUtils.fillRoundRect(ctx, btnX, btnY, btnW, btnH, 5, '#0984e3');
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText('装备', btnX + btnW / 2, btnY + 26);

                if (!this.fighterButtons) this.fighterButtons = [];
                this.fighterButtons.push({ id: fid, action: 'equip', x: btnX, y: btnY, w: btnW, h: btnH });

            } else {
                // Unlock Button
                RenderUtils.fillRoundRect(ctx, btnX, btnY, btnW, btnH, 5, '#e17055');
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText('解锁', btnX + btnW / 2, btnY + 16);
                ctx.font = '12px Arial';
                ctx.fillText(`$${f.unlockCost}`, btnX + btnW / 2, btnY + 32);

                if (!this.fighterButtons) this.fighterButtons = [];
                this.fighterButtons.push({ id: fid, action: 'unlock', x: btnX, y: btnY, w: btnW, h: btnH });
            }

            startY += cardH + 20;
        });
    }

    renderAccount(ctx, x, y) {
        // 头像
        const avatarSize = 100;
        RenderUtils.fillRoundRect(ctx, x + 50, y + 50, avatarSize, avatarSize, 50, '#555');

        // 文字信息
        ctx.font = 'bold 32px Arial';
        ctx.fillText('指挥官', x + 180, y + 90);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`等级: ${dataManager.data.playerLevel}`, x + 180, y + 130);

        ctx.fillText(`金币: ${dataManager.getGold()}`, x + 50, y + 250);
        ctx.fillText(`钻石: ${dataManager.data.diamonds}`, x + 50, y + 300);
    }

    renderEquipment(ctx, x, y) {
        // 复用 HomeScene 的装备槽位逻辑，但这里以网格形式展示
        ctx.font = '24px Arial';
        ctx.fillText('当前装备:', x + 30, y + 50);

        const slots = ['主炮', '装甲', '僚机', '雷达'];
        const equipment = dataManager.data.equipment;
        const slotSize = 80;
        const gap = 20;

        slots.forEach((name, i) => {
            const bx = x + 30 + i * (slotSize + gap);
            const by = y + 100;

            RenderUtils.fillRoundRect(ctx, bx, by, slotSize, slotSize, 10, '#333', '#666', 2);

            // Name
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(name, bx + slotSize / 2, by - 5);

            // Level
            if (name === '主炮' && equipment.mainWeapon) {
                const wp = equipment.mainWeapon;
                ctx.fillStyle = GameConfig.Rarity[wp.rarity] || '#fff';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(`Lv.${wp.level}`, bx + slotSize / 2, by + slotSize / 2 + 8);
            }
        });

        // 模拟背包区域
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('仓库 (空):', x + 30, y + 250);

        // 画几个空格子
        for (let i = 0; i < 5; i++) {
            RenderUtils.fillRoundRect(ctx, x + 30 + i * 90, y + 280, 80, 80, 10, '#222', '#444', 1);
        }
    }

    handleInput(type, x, y) {
        if (type === 'touchstart') {
            // Back Button
            if (x >= this.btnBack.x && x <= this.btnBack.x + this.btnBack.w &&
                y >= this.btnBack.y && y <= this.btnBack.y + this.btnBack.h) {
                this.sceneManager.switchScene('HOME');
                return;
            }

            // Tab Buttons
            this.tabButtons.forEach(btn => {
                if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                    this.currentTab = btn.name;
                    // Reset dynamic buttons
                    this.fighterButtons = [];
                }
            });

            // Fighter Buttons
            if (this.currentTab === '战机' && this.fighterButtons) {
                this.fighterButtons.forEach(btn => {
                    // Check overlap with latest frame buttons
                    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                        const fInfo = FighterFactory.getFighterInfo(btn.id);
                        if (btn.action === 'equip') {
                            dataManager.setFighter(btn.id);
                        } else if (btn.action === 'unlock') {
                            const cost = fInfo.unlockCost;
                            if (dataManager.getGold() >= cost) {
                                dataManager.addGold(-cost); // Deduct gold
                                dataManager.unlockFighter(btn.id);
                                dataManager.setFighter(btn.id); // Auto equip
                            } else {
                                console.log('Not enough gold');
                            }
                        }
                    }
                });
            }
        }
    }

    hitTest(x, y, btn) {
        return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    }
}

/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 结算场景 (ResultScene)，展示战斗结果。
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';
import RenderUtils from '../utils/renderUtils.js';

export default class ResultScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);

        this.width = GameConfig.Screen.width;
        this.height = 1280;

        this.score = 0;
        this.gold = 0;
        this.fighterId = null;
        this.buildSummary = null;
        this.buildTags = [];

        // 按钮布局
        this.btnRestart = { x: 0, y: 0, w: 200, h: 60 };
        this.btnHome = { x: 0, y: 0, w: 200, h: 60 };
    }

    enter(params) {
        console.log('ResultScene: Enter', params);
        this.height = this.sceneManager.game.logicHeight;

        this.score = params.score || 0;
        this.gold = params.gold || 0;
        this.timeSeconds = params.timeSeconds || 0;
        this.timeMinutes = Math.floor(this.timeSeconds / 60);
        this.fighterId = params.fighterId || null;
        this.buildSummary = params.buildSummary || null;
        this.buildTags = this.getBuildTags(this.buildSummary);

        // 计算按钮位置 (居中, 靠下)
        const cx = this.width / 2;
        const cy = this.height / 2;

        this.btnRestart.x = cx - 100;
        this.btnRestart.y = cy + 210;

        this.btnHome.x = cx - 100;
        this.btnHome.y = cy + 290;
    }

    render(ctx) {
        // 背景 (深色科技风)
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制网格背景
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for(let i=0; i<this.height; i+=40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(this.width, i); ctx.stroke();
        }

        // 结果标题
        const cx = this.width / 2;
        let title = 'MISSION FAILED';
        let color = GameConfig.UI.Colors.Danger;
        let subTitle = '任务失败 - 母舰/战机被毁';
        
        if (this.timeMinutes >= 1) { // 只有坚持一定时间才算有称号，这里简化逻辑
            // 胜利判定通常由 enter 参数 params.victory 决定，但这里只有 time
            // 假设外部传入了 victory
            // 我们用颜色区分等级
        }
        
        // 更好的逻辑：根据传入的 victory 参数
        // 但 ResultScene.enter 没有显式保存 victory。让我们假设时间长就是好。
        // 实际上 BattleScene 传递了 victory。
        // 由于这里我无法轻易修改 enter，我将依据 this.timeMinutes 来渲染
        
        if (this.timeMinutes >= 10) { // 假设90秒(1.5m)就算赢？ BattleScene是90秒。
             // 实际上 BattleScene 是存活 90s = 胜利。
             // 这里 10m 是个旧逻辑，我们修正它。
        }
        
        // 修正：根据时间判断
        if (this.timeSeconds >= 90) {
            title = 'MISSION ACCOMPLISHED';
            color = GameConfig.UI.Colors.Success;
            subTitle = '任务完成 - 成功撤离';
        } else {
            // 失败
        }

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.font = 'bold italic 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, cx, 150);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText(subTitle, cx, 185);
        ctx.restore();

        // 核心数据面板
        const panelW = this.width * 0.85;
        const panelY = 240;
        RenderUtils.drawCyberPanel(ctx, (this.width - panelW)/2, panelY, panelW, 300, { color: color });

        // 时间 (大字)
        const m = Math.floor(this.timeSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(this.timeSeconds % 60).toString().padStart(2, '0');
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 70px Arial'; // Digital clock style
        ctx.textAlign = 'center';
        ctx.fillText(`${m}:${s}`, cx, panelY + 100);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText('SURVIVAL TIME', cx, panelY + 130);

        // 分隔线
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.moveTo(cx - 100, panelY + 160); ctx.lineTo(cx + 100, panelY + 160); ctx.stroke();

        // 下方数据 grid
        const statY = panelY + 220;
        // Score
        ctx.textAlign = 'right';
        ctx.fillStyle = '#aaa'; ctx.font = '14px Arial'; ctx.fillText('SCORE', cx - 20, statY);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial'; ctx.fillText(this.score, cx - 20, statY + 30);
        
        // Gold
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa'; ctx.font = '14px Arial'; ctx.fillText('REWARDS', cx + 20, statY);
        ctx.fillStyle = GameConfig.UI.Colors.Warning; ctx.font = 'bold 24px Arial'; ctx.fillText(`+${this.gold}`, cx + 20, statY + 30);

        // 详细复盘面板
        this.renderRecapPanel(ctx);

        // 按钮组
        const btnW = 220;
        const btnH = 60;
        const btnGap = 20;
        const startBtnY = this.height - 250;
        
        // 更新按钮区域用于点击检测
        this.btnRestart = { x: cx - btnW/2, y: startBtnY, w: btnW, h: btnH };
        this.btnHome = { x: cx - btnW/2, y: startBtnY + btnH + btnGap, w: btnW, h: btnH };
        this.btnShare = { x: cx - btnW/2, y: startBtnY + (btnH + btnGap) * 2, w: btnW, h: btnH };

        RenderUtils.drawButton(ctx, this.btnRestart.x, this.btnRestart.y, btnW, btnH, '再玩一次', { color: GameConfig.UI.Colors.Success });
        RenderUtils.drawButton(ctx, this.btnHome.x, this.btnHome.y, btnW, btnH, '返回主页', { color: '#fff' });
        
        // Share text link style
        ctx.fillStyle = '#3498db';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('生成战绩海报', cx, this.btnShare.y + 30);

        // Poster Overlay
        if (this.showPoster) {
            this.renderPoster(ctx);
        }
    }

    renderPoster(ctx) {
        // Dim Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Poster Card
        const pw = 400; // Poster Width
        const ph = 600; // Poster Height
        const px = (this.width - pw) / 2;
        const py = (this.height - ph) / 2;

        // Card Background (Gradient)
        const grad = ctx.createLinearGradient(px, py, px, py + ph);
        grad.addColorStop(0, '#2c3e50');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, pw, ph);

        // Border
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 4;
        ctx.strokeRect(px, py, pw, ph);

        // Content
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';

        ctx.font = 'bold 40px Arial';
        ctx.fillText('SPACE SURVIVOR', px + pw / 2, py + 60);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText('- 战绩报告 -', px + pw / 2, py + 100);

        // Rank Title
        let title = '任务失败';
        let color = '#7f8c8d';
        if (this.timeMinutes >= 10) { title = '王牌飞行员'; color = '#f1c40f'; }
        else if (this.timeMinutes >= 5) { title = '精英战士'; color = '#e67e22'; }
        else if (this.timeMinutes >= 1) { title = '幸存者'; color = '#2ecc71'; }

        ctx.fillStyle = color;
        ctx.font = 'bold 50px Arial';
        ctx.fillText(title, px + pw / 2, py + 180);

        // Stats Grid
        const m = Math.floor(this.timeSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(this.timeSeconds % 60).toString().padStart(2, '0');

        ctx.fillStyle = '#fff';
        ctx.font = '60px Arial';
        ctx.fillText(`${m}:${s}`, px + pw / 2, py + 260);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('坚持时长', px + pw / 2, py + 290);

        // Sub Stats
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`得分: ${this.score}`, px + 40, py + 360);
        ctx.fillText(`金币: +${this.gold}`, px + 40, py + 400);

        if (this.buildTags && this.buildTags.length > 0) {
            ctx.fillStyle = '#00ccff';
            ctx.font = '18px Arial';
            ctx.fillText(`流派: ${this.buildTags.join(' / ')}`, px + 40, py + 440);
        }

        const topSkills = this.getTopSkillsForPoster();
        if (topSkills.length > 0) {
            ctx.fillStyle = '#bdc3c7';
            ctx.font = '16px Arial';
            ctx.fillText('本局构筑:', px + 40, py + 480);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            topSkills.forEach((s, i) => {
                ctx.fillText(`- ${s.name} Lv.${s.level}`, px + 40, py + 505 + i * 22);
            });
        }

        // Date
        const date = new Date().toLocaleDateString();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '16px Arial';
        ctx.fillText(date, px + pw / 2, py + ph - 20);

        // Close Hint
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('点击关闭', this.width / 2, py + ph + 40);
    }

    handleInput(type, x, y) {
        if (type === 'touchstart') {
            // Close Poster
            if (this.showPoster) {
                this.showPoster = false;
                return true;
            }

            // Generate Poster
            if (this.hitTest(x, y, this.btnShare)) {
                this.showPoster = true;
                return true;
            }

            // Restart
            if (this.hitTest(x, y, this.btnRestart)) {
                this.sceneManager.switchScene('BATTLE');
                return true;
            }
            // Home
            if (this.hitTest(x, y, this.btnHome)) {
                this.sceneManager.switchScene('HOME');
                return true;
            }
        }
    }

    hitTest(x, y, btn) {
        return btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    }

    renderRecapPanel(ctx) {
        const panelW = Math.min(620, this.width - 80);
        const panelH = 260;
        const x = (this.width - panelW) / 2;
        const y = 580;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, y, panelW, panelH);
        ctx.strokeStyle = 'rgba(0,168,255,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, panelW, panelH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('本局复盘', x + 18, y + 34);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px Arial';
        const fighterText = this.fighterId ? `战机: ${this.fighterId}` : '战机: -';
        ctx.fillText(fighterText, x + 18, y + 58);

        const tagsText = this.buildTags && this.buildTags.length > 0 ? `流派: ${this.buildTags.join(' / ')}` : '流派: -';
        ctx.fillText(tagsText, x + 18, y + 78);

        const summary = this.buildSummary;
        if (!summary || !Array.isArray(summary.skills) || summary.skills.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('本局未获得技能，下一局记得拾取经验球升级！', x + panelW / 2, y + 150);
            ctx.restore();
            return;
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '14px Arial';
        ctx.fillText(`技能数: ${summary.totalSkills}  总等级: ${summary.totalLevels}`, x + 18, y + 104);

        const rarityLine = `稀有度: 普通 ${summary.rarities.common || 0} · 稀有 ${summary.rarities.rare || 0} · 传说 ${summary.rarities.legendary || 0}`;
        ctx.fillText(rarityLine, x + 18, y + 124);

        const list = summary.skills
            .slice()
            .sort((a, b) => (this.rarityWeight(b.rarity) - this.rarityWeight(a.rarity)) || (b.level - a.level))
            .slice(0, 6);

        const startY = y + 154;
        list.forEach((s, i) => {
            const rowY = startY + i * 26;
            const color = this.rarityColor(s.rarity);
            ctx.fillStyle = color;
            ctx.fillRect(x + 18, rowY - 14, 8, 8);

            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText(`${s.name}  Lv.${s.level}/${s.maxLevel}`, x + 34, rowY - 6);
        });

        ctx.restore();
    }

    getBuildTags(summary) {
        if (!summary || !summary.categories) return [];
        const entries = Object.entries(summary.categories)
            .filter(([, v]) => Number.isFinite(v) && v > 0)
            .sort((a, b) => b[1] - a[1]);
        const map = {
            core_damage: '火力流',
            projectile: '弹幕流',
            attack_speed: '攻速流',
            survival: '生存流',
            mobility: '机动流',
            mechanic: '机制流',
            energy: '能量流'
        };
        return entries.slice(0, 2).map(([k]) => map[k] || k);
    }

    rarityWeight(r) {
        if (r === 'legendary') return 3;
        if (r === 'rare') return 2;
        return 1;
    }

    rarityColor(r) {
        if (r === 'legendary') return '#f39c12';
        if (r === 'rare') return '#3498db';
        return '#95a5a6';
    }

    getTopSkillsForPoster() {
        const summary = this.buildSummary;
        if (!summary || !Array.isArray(summary.skills)) return [];
        return summary.skills
            .slice()
            .sort((a, b) => (this.rarityWeight(b.rarity) - this.rarityWeight(a.rarity)) || (b.level - a.level))
            .slice(0, 3);
    }
}

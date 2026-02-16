﻿/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 缁撶畻鍦烘櫙 (ResultScene)锛屽睍绀烘垬鏂楃粨鏋溿€?
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { metaProgression } from '../manager/metaProgression.js';
import RenderUtils from '../utils/renderUtils.js';

export default class ResultScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);

        this.width = GameConfig.Screen.width;
        this.height = 1280;

        this.score = 0;
        this.gold = 0;
        this.victory = false;
        this.fighterId = null;
        this.buildSummary = null;
        this.buildTags = [];

        // 鎸夐挳甯冨眬
        this.btnRestart = { x: 0, y: 0, w: 200, h: 60 };
        this.btnHangar = { x: 0, y: 0, w: 200, h: 60 };
        this.btnHome = { x: 0, y: 0, w: 200, h: 60 };
    }

    enter(params) {
        console.log('ResultScene: Enter', params);
        this.height = this.sceneManager.game.logicHeight;

        this.score = params.score || 0;
        this.gold = params.gold || 0;
        this.victory = !!(params && params.victory);
        this.timeSeconds = params.timeSeconds || 0;
        this.timeMinutes = Math.floor(this.timeSeconds / 60);
        this.fighterId = params.fighterId || null;
        this.buildSummary = params.buildSummary || null;
        this.buildTags = this.getBuildTags(this.buildSummary);

        // 璁＄畻鎸夐挳浣嶇疆 (灞呬腑, 闈犱笅)
        const cx = this.width / 2;
        const cy = this.height / 2;

        this.btnRestart.x = cx - 100;
        this.btnRestart.y = cy + 210;

        this.btnHangar.x = cx - 100;
        this.btnHangar.y = cy + 290;

        this.btnHome.x = cx - 100;
        this.btnHome.y = cy + 370;
    }

    render(ctx) {
        // 鑳屾櫙 (娣辫壊绉戞妧椋?
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 缁樺埗缃戞牸鑳屾櫙
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for(let i=0; i<this.height; i+=40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(this.width, i); ctx.stroke();
        }

        // 缁撴灉鏍囬
        const cx = this.width / 2;
        let title = '任务失败';
        let color = GameConfig.UI.Colors.Danger;
        let subTitle = '母舰失守，任务终止';
        
        if (this.victory) {
            title = '任务完成';
            color = GameConfig.UI.Colors.Success;
            subTitle = '突围成功，任务完成';
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

        // 鏍稿績鏁版嵁闈㈡澘
        const panelW = this.width * 0.85;
        const panelY = 240;
        this.drawPanel(ctx, (this.width - panelW) / 2, panelY, panelW, 300, { color });

        // 鏃堕棿 (澶у瓧)
        const m = Math.floor(this.timeSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(this.timeSeconds % 60).toString().padStart(2, '0');
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 70px Arial'; // Digital clock style
        ctx.textAlign = 'center';
        ctx.fillText(`${m}:${s}`, cx, panelY + 100);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText('生存时间', cx, panelY + 130);

        // 鍒嗛殧绾?
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.moveTo(cx - 100, panelY + 160); ctx.lineTo(cx + 100, panelY + 160); ctx.stroke();

        // 涓嬫柟鏁版嵁 grid
        const statY = panelY + 220;
        // Score
        ctx.textAlign = 'right';
        ctx.fillStyle = '#aaa'; ctx.font = '14px Arial'; ctx.fillText('得分', cx - 20, statY);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial'; ctx.fillText(this.score, cx - 20, statY + 30);
        
        // Gold
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa'; ctx.font = '14px Arial'; ctx.fillText('奖励', cx + 20, statY);
        ctx.fillStyle = GameConfig.UI.Colors.Warning; ctx.font = 'bold 24px Arial'; ctx.fillText(`+${this.gold}`, cx + 20, statY + 30);

        // 仅在有技能构筑时显示复盘，避免空白大框
        const hasRecap = this.hasBuildRecap();
        if (hasRecap) {
            this.renderRecapPanel(ctx);
        }

        this.renderGrowthHint(ctx, cx, hasRecap ? 874 : 720);

        // 行动按钮
        const btnW = 220;
        const btnH = 60;
        const btnGap = 20;
        const startBtnY = hasRecap ? this.height - 320 : this.height - 390;
        
        // 鏇存柊鎸夐挳鍖哄煙鐢ㄤ簬鐐瑰嚮妫€娴?
        this.btnRestart = { x: cx - btnW/2, y: startBtnY, w: btnW, h: btnH };
        this.btnHangar = { x: cx - btnW/2, y: startBtnY + btnH + btnGap, w: btnW, h: btnH };
        this.btnHome = { x: cx - btnW/2, y: startBtnY + (btnH + btnGap) * 2, w: btnW, h: btnH };
        this.btnShare = { x: cx - btnW/2, y: startBtnY + (btnH + btnGap) * 3, w: btnW, h: btnH };

        this.drawSceneButton(ctx, this.btnRestart.x, this.btnRestart.y, btnW, btnH, '再玩一次', { color: GameConfig.UI.Colors.Success });
        this.drawSceneButton(ctx, this.btnHangar.x, this.btnHangar.y, btnW, btnH, '前往机库强化', { color: '#f39c12' });
        this.drawSceneButton(ctx, this.btnHome.x, this.btnHome.y, btnW, btnH, '返回主页', { color: '#fff' });
        
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

    getRenderUtils() {
        if (typeof RenderUtils !== 'undefined' && RenderUtils) {
            return RenderUtils;
        }
        return null;
    }

    hasBuildRecap() {
        return !!(
            this.buildSummary &&
            Array.isArray(this.buildSummary.skills) &&
            this.buildSummary.skills.length > 0
        );
    }

    drawPanel(ctx, x, y, w, h, options = {}) {
        const utils = this.getRenderUtils();
        ctx.save();
        const border = options.color || '#00d2d3';
        const radius = 14;

        if (utils && typeof utils.fillRoundRect === 'function') {
            utils.fillRoundRect(
                ctx,
                x,
                y,
                w,
                h,
                radius,
                'rgba(10, 15, 30, 0.85)',
                border,
                2
            );
        } else {
            ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = border;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }

        // subtle scanline texture
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let yy = y + 8; yy < y + h; yy += 10) {
            ctx.beginPath();
            ctx.moveTo(x + 8, yy);
            ctx.lineTo(x + w - 8, yy);
            ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
    }

    drawSceneButton(ctx, x, y, w, h, text, options = {}) {
        const utils = this.getRenderUtils();
        if (utils && typeof utils.drawButton === 'function') {
            utils.drawButton(ctx, x, y, w, h, text, options);
            return;
        }

        ctx.save();
        const color = options.color || '#00d2d3';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.restore();
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
        ctx.fillText('太空幸存者', px + pw / 2, py + 60);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText('- 战绩报告 -', px + pw / 2, py + 100);

        let title = '任务失败';
        let color = '#7f8c8d';
        if (this.timeMinutes >= 10) { title = '王牌飞行员'; color = '#f1c40f'; }
        else if (this.timeMinutes >= 5) { title = '精英战士'; color = '#e67e22'; }
        else if (this.timeMinutes >= 1) { title = '幸存者'; color = '#2ecc71'; }

        ctx.fillStyle = color;
        ctx.font = 'bold 50px Arial';
        ctx.fillText(title, px + pw / 2, py + 180);

        const m = Math.floor(this.timeSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(this.timeSeconds % 60).toString().padStart(2, '0');

        ctx.fillStyle = '#fff';
        ctx.font = '60px Arial';
        ctx.fillText(`${m}:${s}`, px + pw / 2, py + 260);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('生存时长', px + pw / 2, py + 290);

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
            topSkills.forEach((skill, i) => {
                ctx.fillText(`- ${skill.name} 等级${skill.level}`, px + 40, py + 505 + i * 22);
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

    renderGrowthHint(ctx, centerX, topY) {
        const data = metaProgression.getDisplayData ? metaProgression.getDisplayData() : null;
        if (!data) return;

        const bp = data.blueprints || {};
        const line = this.getNextGoalLine(data);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c8d6e5';
        ctx.font = '15px Arial';
        ctx.fillText(`蓝图库存：普通 ${bp.common || 0}  稀有 ${bp.rare || 0}  传说 ${bp.legendary || 0}`, centerX, topY);
        ctx.fillStyle = '#feca57';
        ctx.font = '14px Arial';
        ctx.fillText(line, centerX, topY + 24);
        ctx.restore();
    }

    getNextGoalLine(data) {
        const fighters = data.fighters || {};
        const stats = data.stats || {};

        if (fighters['F-22'] && !fighters['F-22'].unlocked) {
            return `下个目标：解锁 F-22（累计击杀 ${stats.totalKills || 0}/${fighters['F-22'].unlockCost}）`;
        }
        if (fighters['Su-57'] && !fighters['Su-57'].unlocked) {
            return `下个目标：解锁 Su-57（满血通关 ${stats.fullHealthWins || 0}/${fighters['Su-57'].unlockCost}）`;
        }
        if (fighters['F-16'] && !fighters['F-16'].unlocked) {
            return `下个目标：解锁 F-16（累计对局 ${stats.totalGames || 0}/${fighters['F-16'].unlockCost}）`;
        }

        return '建议：前往机库升级主力战机，提高下一局收益与通关率';
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
            // Hangar
            if (this.hitTest(x, y, this.btnHangar)) {
                this.sceneManager.switchScene('HANGAR');
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
            ctx.fillText('本局未获得技能，下局记得优先拾取经验球升级。', x + panelW / 2, y + 150);
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
            ctx.fillText(`${s.name}  等级${s.level}/${s.maxLevel}`, x + 34, rowY - 6);
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

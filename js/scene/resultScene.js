/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 结算场景 (ResultScene)，展示战斗结果。
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { dataManager } from '../manager/dataManager.js';

export default class ResultScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);

        this.width = GameConfig.Screen.width;
        this.height = 1280;

        this.score = 0;
        this.gold = 0;

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

        // 计算按钮位置 (居中, 靠下)
        const cx = this.width / 2;
        const cy = this.height / 2;

        this.btnRestart.x = cx - 100;
        this.btnRestart.y = cy + 100;

        this.btnHome.x = cx - 100;
        this.btnHome.y = cy + 180;
    }

    render(ctx) {
        // 背景 (半透明叠加在战斗场景上? 不，SceneManager 这里的简单实现是替换场景)
        // 所以我们画一个全黑背景
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, this.width, this.height);

        // Result Title based on Time
        let title = '任务失败';
        let color = '#7f8c8d';
        if (this.timeMinutes >= 10) { title = '王牌飞行员'; color = '#f1c40f'; }
        else if (this.timeMinutes >= 5) { title = '精英战士'; color = '#e67e22'; }
        else if (this.timeMinutes >= 1) { title = '幸存者'; color = '#2ecc71'; }

        // 标题
        ctx.fillStyle = color;
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, this.width / 2, 200);

        // 统计 - 生存时间
        ctx.font = '30px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('生存时间', this.width / 2, 300);

        const m = Math.floor(this.timeSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(this.timeSeconds % 60).toString().padStart(2, '0');
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${m}:${s}`, this.width / 2, 360);

        // 统计 - 分数
        ctx.font = '24px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('击杀分数', this.width / 2 - 100, 480);
        ctx.fillStyle = '#fff';
        ctx.fillText(this.score, this.width / 2 - 100, 520);

        // 统计 - 金币
        ctx.fillStyle = '#aaa';
        ctx.fillText('获得金币', this.width / 2 + 100, 480);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`+${this.gold}`, this.width / 2 + 100, 520);

        // 按钮 - Restart
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.btnRestart.x, this.btnRestart.y, this.btnRestart.w, this.btnRestart.h);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('再玩一次', this.btnRestart.x + 100, this.btnRestart.y + 38);

        // 按钮 - Home
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.btnHome.x, this.btnHome.y, this.btnHome.w, this.btnHome.h);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('返回主页', this.btnHome.x + 100, this.btnHome.y + 38);

        // 按钮 - Generate Poster (Share)
        this.btnShare = { x: this.width / 2 - 100, y: this.btnHome.y + 80, w: 200, h: 50 };
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.btnShare.x, this.btnShare.y, this.btnShare.w, this.btnShare.h);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('生成战绩海报', this.btnShare.x + 100, this.btnShare.y + 33);

        // Render Poster Overlay if active
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
}

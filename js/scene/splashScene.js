/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 启动/加载场景 (SplashScene)。用于预加载资源和展示 Logo。
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import { platform } from '../platform/index.js';

export default class SplashScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        this.width = GameConfig.Screen.width;
        this.height = 1280;

        this.progress = 0;
        this.loaded = false;
    }

    enter() {
        console.log('SplashScene: Enter');
        this.height = this.sceneManager.game.logicHeight;
        this.progress = 0;

        // 模拟资源加载过程
        this.loadResources();
    }

    loadResources() {
        // 实际开发中这里会加载图片、音频、JSON配置
        // 这里用定时器模拟进度条
        const interval = setInterval(() => {
            this.progress += 2;
            if (this.progress >= 100) {
                this.progress = 100;
                clearInterval(interval);
                this.onLoadComplete();
            }
        }, 30); // 30ms * 50 = 1.5s Loading time
    }

    onLoadComplete() {
        this.loaded = true;
        setTimeout(() => {
            // 加载完成后跳转到剧情场景（让玩家理解世界观）
            this.sceneManager.switchScene('STORY');
        }, 200);
    }

    render(ctx) {
        // 背景色 (深空)
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);

        const cx = this.width / 2;
        const cy = this.height / 2;

        // 装饰圆环
        const time = Date.now() / 1000;
        ctx.save();
        ctx.translate(cx, cy - 30);
        
        // 旋转外圈
        ctx.strokeStyle = 'rgba(0, 210, 211, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 120, time, time + Math.PI * 1.5);
        ctx.stroke();
        
        // 反向旋转内圈
        ctx.strokeStyle = 'rgba(95, 39, 205, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 100, -time * 1.5, -time * 1.5 + Math.PI);
        ctx.stroke();
        ctx.restore();

        // Logo 文字
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00d2d3';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', cx, cy - 40);
        
        ctx.shadowColor = '#5f27cd';
        ctx.fillStyle = '#00d2d3';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('SURVIVOR', cx, cy + 10);
        ctx.restore();

        // 进度条背景
        const barW = this.width * 0.7;
        const barH = 6;
        const barX = (this.width - barW) / 2;
        const barY = cy + 150;

        // 进度条发光槽
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(barX, barY, barW, barH);
        
        // 进度条前景 (渐变)
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, '#00d2d3');
        grad.addColorStop(1, '#5f27cd');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d2d3';
        ctx.fillRect(barX, barY, barW * (this.progress / 100), barH);
        ctx.shadowBlur = 0;

        // Loading 文字
        ctx.fillStyle = '#rgba(255,255,255,0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`SYSTEM INITIALIZING... ${this.progress}%`, cx, barY + 30);

        // 版权信息
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('VER 1.0.0 | POWERED BY OPENCODE', cx, this.height - 40);
    }
}

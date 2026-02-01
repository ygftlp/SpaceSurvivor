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
        // 背景色 (品牌色)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.width, this.height);

        // Logo 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('太空', this.width / 2, this.height / 2 - 60);
        ctx.fillStyle = '#00A8FF';
        ctx.fillText('幸存者', this.width / 2, this.height / 2);

        // 进度条背景
        const barW = 400;
        const barH = 10;
        const barX = (this.width - barW) / 2;
        const barY = this.height / 2 + 100;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        // 进度条前景
        ctx.fillStyle = '#00A8FF';
        ctx.fillRect(barX, barY, barW * (this.progress / 100), barH);

        // Loading 文字
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText(`加载中... ${this.progress}%`, this.width / 2, barY + 40);

        // 版权信息
        ctx.fillStyle = '#444';
        ctx.font = '12px Arial';
        ctx.fillText('© 2026 yangguangftlp', this.width / 2, this.height - 50);
    }
}

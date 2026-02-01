/**
 * StoryScene - 开场剧情场景
 * 讲述游戏世界观，让玩家理解为什么而战
 * 地球沦陷、人类流亡、保护母舰跃迁
 */

import BaseScene from './baseScene.js';
import { GameConfig } from '../config.js';
import Button from '../object/ui/Button.js';

export default class StoryScene extends BaseScene {
    constructor(sceneManager) {
        super(sceneManager);
        
        // 剧情文本 - 每行独立显示，避免重叠
        this.storyLines = [
            { text: '公元2147年', color: '#ff6b6b', size: 48, showTime: 0, duration: 2.5 },
            { text: '地球沦陷', color: '#ff6b6b', size: 48, showTime: 2.5, duration: 2.5 },
            { text: '异星虫潮吞噬了我们的家园', color: '#a0aec0', size: 32, showTime: 5, duration: 3 },
            { text: '人类文明仅存最后的一艘母舰', color: '#63b3ed', size: 32, showTime: 8, duration: 3 },
            { text: '', showTime: 11, duration: 0.5 }, // 间隔
            { text: '你是人类最后的王牌飞行员', color: '#f6e05e', size: 36, showTime: 11.5, duration: 3 },
            { text: '', showTime: 14.5, duration: 0.5 }, // 间隔
            { text: '你的使命：', color: '#ff6b6b', size: 40, showTime: 20, duration: 2.5 },
            { text: '保护母舰完成跃迁充能', color: '#63b3ed', size: 34, showTime: 22.5, duration: 2.5 },
            { text: '抵挡异星虫潮的疯狂进攻', color: '#ff6b6b', size: 34, showTime: 25, duration: 2.5 },
            { text: '为了人类的未来，战斗到底', color: '#f6e05e', size: 38, showTime: 27.5, duration: 3 }
        ];
        
        this.currentTime = 0;
        this.showSkipButton = false;
        this.skipBtn = null;
        this.stars = [];
    }
    
    enter() {
        console.log('StoryScene: Enter - 播放开场剧情');
        this.currentTime = 0;
        this.showSkipButton = false;
        
        // 创建跳过按钮
        const width = GameConfig.Screen.width;
        const height = this.sceneManager.game.logicHeight;
        this.skipBtn = new Button(width - 100, 30, 80, 40, '跳过 >');
        this.skipBtn.setStyle('rgba(0,0,0,0.5)', '#fff', 16, 8);
        this.skipBtn.setCallback(() => {
            this.skipStory();
        });
        
        // 初始化星空
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    update(dt) {
        this.currentTime += dt;
        
        // 3秒后显示跳过按钮
        if ( this.currentTime > 3 && !this.showSkipButton) {
            this.showSkipButton = true;
        }
        
        // 剧情结束自动跳转（最后一行结束后3秒）
        const lastLine = this.storyLines[this.storyLines.length - 1];
        const storyEndTime = lastLine.showTime + lastLine.duration + 3;
        if (this.currentTime > storyEndTime) {
            this.gotoHome();
        }
        
        // 更新星空
        const height = this.sceneManager.game.logicHeight;
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > height) {
                star.y = 0;
                star.x = Math.random() * GameConfig.Screen.width;
            }
        });
    }
    
    render(ctx) {
        const width = GameConfig.Screen.width;
        const height = this.sceneManager.game.logicHeight;
        
        // 深空背景
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制星空
        ctx.fillStyle = '#fff';
        this.stars.forEach(star => {
            ctx.globalAlpha = Math.random() * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // 绘制剧情文字 - 一次只显示一行，避免重叠
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 找到当前应该显示的文字行
        let currentLine = null;
        for (let line of this.storyLines) {
            const endTime = line.showTime + line.duration;
            if (this.currentTime >= line.showTime && this.currentTime < endTime) {
                currentLine = line;
                break;
            }
        }
        
        // 渲染当前文字行
        if (currentLine && currentLine.text) {
            const age = this.currentTime - currentLine.showTime;
            const fadeInDuration = 0.4; // 淡入0.4秒
            const fadeOutDuration = 0.4; // 淡出0.4秒
            let alpha = 1;
            let yOffset = 0;
            
            // 淡入效果
            if (age < fadeInDuration) {
                alpha = age / fadeInDuration;
                yOffset = (1 - alpha) * 30; // 从下方30像素处滑入
            }
            // 淡出效果
            else if (age > currentLine.duration - fadeOutDuration) {
                alpha = Math.max(0, 1 - (age - (currentLine.duration - fadeOutDuration)) / fadeOutDuration);
                yOffset = (1 - alpha) * (-20); // 向上滑出
            }
            
            if (alpha > 0) {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = currentLine.color;
                ctx.font = `bold ${currentLine.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.shadowColor = currentLine.color;
                ctx.shadowBlur = 15;
                ctx.fillText(currentLine.text, centerX, centerY + yOffset);
                ctx.restore();
            }
        }
        
        // 绘制进度提示（最后一句出现后显示）
        const lastLineStart = this.storyLines[this.storyLines.length - 1].showTime;
        if (this.currentTime > lastLineStart) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            const blink = Math.sin(this.currentTime * 4) > 0;
            if (blink) {
                ctx.fillText('点击任意处开始', width / 2, height - 80);
            }
            ctx.restore();
        }
        
        // 绘制跳过按钮
        if (this.showSkipButton) {
            this.skipBtn.render(ctx);
        }
    }
    
    handleInput(type, x, y) {
        if (type === 'touchstart') {
            // 检查跳过按钮
            if (this.showSkipButton && this.skipBtn.handleInput(type, x, y)) {
                return;
            }
            
            // 点击跳过剧情（3秒后）
            if (this.currentTime > 3) {
                this.skipStory();
            }
        }
    }
    
    skipStory() {
        console.log('StoryScene: 跳过剧情');
        this.gotoHome();
    }
    
    gotoHome() {
        this.sceneManager.switchScene('HOME');
    }
}

import { GameConfig } from '../../config.js';
import Button from './Button.js';

/**
 * 技能选择界面 - 升级时弹出
 * 显示3个技能卡片，包含图标、描述、当前等级
 */
export default class SkillSelectionModal {
    constructor(scene, skills, onSelect, playerSkills = []) {
        this.scene = scene;
        this.skills = skills;
        this.onSelect = onSelect;
        this.playerSkills = playerSkills; // 玩家已拥有的技能（用于显示等级）
        this.active = true;

        this.width = GameConfig.Screen.width;
        this.height = this.scene.game.logicHeight || GameConfig.Screen.height;

        // 卡片布局
        this.cardWidth = 220;
        this.cardHeight = 340;
        this.gap = 25;
        this.startX = (this.width - (3 * this.cardWidth + 2 * this.gap)) / 2;
        this.centerY = this.height / 2;

        // 颜色配置
        this.rarityColors = {
            'common': { border: '#95a5a6', bg: 'rgba(149, 165, 166, 0.1)', text: '#bdc3c7' },
            'rare': { border: '#3498db', bg: 'rgba(52, 152, 219, 0.15)', text: '#5dade2' },
            'legendary': { border: '#f39c12', bg: 'rgba(243, 156, 18, 0.2)', text: '#f5b041' }
        };
        
        // 分类颜色
        this.categoryColors = {
            'core_damage': '#e74c3c',
            'projectile': '#e67e22', 
            'attack_speed': '#f39c12',
            'survival': '#27ae60',
            'mobility': '#3498db',
            'mechanic': '#9b59b6',
            'energy': '#00ccff'
        };

        // 创建卡片按钮
        this.cards = [];
        this.initCards();
        
        // 动画
        this.animationTime = 0;
        this.cardsRevealed = false;
    }

    initCards() {
        this.skills.forEach((skill, index) => {
            const x = this.startX + index * (this.cardWidth + this.gap) + this.cardWidth / 2;
            const y = this.centerY;
            
            // 检查是否已拥有此技能
            const existingSkill = this.playerSkills.find(s => s.id === skill.id);
            const currentLevel = existingSkill ? existingSkill.level : 0;
            const isMaxLevel = currentLevel >= skill.maxLevel;
            
            const card = {
                skill: skill,
                x: x,
                y: y,
                width: this.cardWidth,
                height: this.cardHeight,
                currentLevel: currentLevel,
                isMaxLevel: isMaxLevel,
                hovered: false,
                scale: 1,
                targetScale: 1
            };
            
            this.cards.push(card);
        });
        
        // 延迟显示动画
        setTimeout(() => {
            this.cardsRevealed = true;
        }, 100);
    }

    select(skillId) {
        if (!this.active) return;
        this.active = false;
        if (this.onSelect) this.onSelect(skillId);
    }

    update(dt) {
        if (!this.active) return;
        
        this.animationTime += dt;
        
        // 卡片悬停动画
        this.cards.forEach((card, index) => {
            if (this.cardsRevealed) {
                // 依次显示卡片
                const revealDelay = index * 0.15;
                if (this.animationTime > revealDelay) {
                    card.scale += (card.targetScale - card.scale) * 0.2;
                }
            }
        });
    }

    handleInput(type, x, y) {
        if (!this.active) return false;
        
        if (type === 'touchstart' || type === 'mousedown') {
            for (let card of this.cards) {
                const halfW = card.width / 2;
                const halfH = card.height / 2;
                
                if (x >= card.x - halfW && x <= card.x + halfW &&
                    y >= card.y - halfH && y <= card.y + halfH) {
                    
                    // 检查是否已满级
                    if (card.isMaxLevel) {
                        // 播放错误音效或提示
                        return true;
                    }
                    
                    this.select(card.skill.id);
                    return true;
                }
            }
        } else if (type === 'touchmove' || type === 'mousemove') {
            // 悬停检测
            this.cards.forEach(card => {
                const halfW = card.width / 2;
                const halfH = card.height / 2;
                const hovered = x >= card.x - halfW && x <= card.x + halfW &&
                               y >= card.y - halfH && y <= card.y + halfH;
                
                card.hovered = hovered;
                card.targetScale = hovered ? 1.05 : 1;
            });
        }
        
        return true; // 阻挡其他输入
    }

    render(ctx) {
        if (!this.active) return;

        // 深色背景遮罩 (模糊感)
        ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
        ctx.fillRect(0, 0, this.width, this.height);

        // 顶部光晕
        const cx = this.width / 2;
        const grad = ctx.createRadialGradient(cx, 0, 10, cx, 0, 400);
        grad.addColorStop(0, 'rgba(0, 210, 211, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, 300);

        // 标题
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00d2d3';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM UPGRADE', cx, 100);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '16px Arial';
        ctx.fillText('SELECT MODIFICATION MODULE', cx, 130);
        ctx.restore();

        // 绘制3张技能卡
        this.cards.forEach((card, index) => {
            this.renderSkillCard(ctx, card, index);
        });
        
        // 底部提示
        // 呼吸效果
        const alpha = 0.5 + Math.sin(this.animationTime * 3) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TAP TO INSTALL', cx, this.height - 80);
    }

    renderSkillCard(ctx, card, index) {
        const skill = card.skill;
        const colors = this.rarityColors[skill.rarity];
        const categoryColor = this.categoryColors[skill.category] || '#fff';
        
        const x = card.x;
        const y = card.y;
        const w = card.width * card.scale;
        const h = card.height * card.scale;
        const halfW = w / 2;
        const halfH = h / 2;
        
        ctx.save();
        
        // 卡片阴影
        if (card.hovered) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = colors.border;
        }
        
        // 卡片背景
        ctx.fillStyle = colors.bg;
        ctx.fillRect(x - halfW, y - halfH, w, h);
        
        // 稀有度边框
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = card.hovered ? 4 : 3;
        ctx.strokeRect(x - halfW, y - halfH, w, h);
        
        // 顶部稀有度条
        ctx.fillStyle = colors.border;
        ctx.fillRect(x - halfW, y - halfH, w, 6);
        
        ctx.shadowBlur = 0;
        
        // ========== 技能图标 ==========
        const iconY = y - halfH + 60;
        this.renderSkillIcon(ctx, skill, x, iconY, categoryColor);
        
        // ========== 技能名称 ==========
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(skill.name, x, iconY + 70);
        
        // ========== 稀有度标签 ==========
        ctx.fillStyle = colors.border;
        ctx.font = '12px Arial';
        const rarityText = skill.rarity === 'common' ? '普通' : 
                          skill.rarity === 'rare' ? '稀有' : '传说';
        ctx.fillText(rarityText, x, iconY + 90);
        
        // ========== 当前等级 / 最大等级 ==========
        const levelY = iconY + 120;
        if (card.currentLevel > 0) {
            // 已拥有，显示升级
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`当前等级: ${card.currentLevel}`, x, levelY);
            
            if (card.isMaxLevel) {
                // 已满级
                ctx.fillStyle = '#e74c3c';
                ctx.font = '14px Arial';
                ctx.fillText('✕ 已达上限', x, levelY + 22);
            } else {
                // 可升级
                ctx.fillStyle = '#27ae60';
                ctx.font = '14px Arial';
                ctx.fillText(`↑ 升级到 ${card.currentLevel + 1}`, x, levelY + 22);
            }
        } else {
            // 新技能
            ctx.fillStyle = '#3498db';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('新技能', x, levelY);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.fillText(`最高 ${skill.maxLevel} 级`, x, levelY + 22);
        }
        
        // ========== 分隔线 ==========
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - halfW + 20, levelY + 40);
        ctx.lineTo(x + halfW - 20, levelY + 40);
        ctx.stroke();
        
        // ========== 技能描述 ==========
        ctx.fillStyle = '#ccc';
        ctx.font = '15px Arial';
        this.wrapText(ctx, skill.description, x, levelY + 70, w - 30, 22);
        
        // ========== 分类标签 ==========
        const categoryNames = {
            'core_damage': '伤害',
            'projectile': '弹道',
            'attack_speed': '攻速',
            'survival': '生存',
            'mobility': '机动',
            'mechanic': '机制',
            'energy': '能量'
        };
        
        ctx.fillStyle = categoryColor;
        ctx.font = '11px Arial';
        ctx.fillText(categoryNames[skill.category] || skill.category, x, y + halfH - 15);
        
        ctx.restore();
    }

    /**
     * 绘制技能图标（Canvas绘制简单图形）
     */
    renderSkillIcon(ctx, skill, x, y, color) {
        const size = 70;
        const halfSize = size / 2;
        
        ctx.save();
        
        // 图标背景
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(x, y, halfSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 图标边框
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, halfSize - 3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // 根据图标类型绘制不同图形
        switch(skill.icon) {
            case 'bullet_plus': // 弹道+
                ctx.beginPath();
                ctx.moveTo(x, y - 20);
                ctx.lineTo(x - 8, y + 15);
                ctx.lineTo(x, y + 10);
                ctx.lineTo(x + 8, y + 15);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('+', x + 15, y - 10);
                break;
                
            case 'damage_up': // 伤害提升
                ctx.beginPath();
                ctx.moveTo(x, y - 25);
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const px = x + Math.cos(angle) * 25;
                    const py = y + Math.sin(angle) * 25;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'speed_up': // 攻速
                ctx.beginPath();
                ctx.moveTo(x - 15, y - 20);
                ctx.lineTo(x + 20, y);
                ctx.lineTo(x - 15, y + 20);
                ctx.lineTo(x - 5, y);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'hp_up': // 生命
                ctx.beginPath();
                const topCurveHeight = 15;
                ctx.moveTo(x, y + 15);
                ctx.bezierCurveTo(x, y + 5, x - 25, y - 20, x - 25, y - 5);
                ctx.bezierCurveTo(x - 25, y + 10, x, y + 25, x, y + 30);
                ctx.bezierCurveTo(x, y + 25, x + 25, y + 10, x + 25, y - 5);
                ctx.bezierCurveTo(x + 25, y - 20, x, y + 5, x, y + 15);
                ctx.fill();
                break;
                
            case 'shield': // 护盾
                ctx.beginPath();
                ctx.arc(x, y, 22, Math.PI, 0);
                ctx.lineTo(x + 22, y + 10);
                ctx.arc(x, y + 10, 22, 0, Math.PI, true);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'heal': // 治疗
                ctx.lineWidth = 8;
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y - 18);
                ctx.lineTo(x, y + 18);
                ctx.moveTo(x - 15, y);
                ctx.lineTo(x + 15, y);
                ctx.stroke();
                break;
                
            case 'move_speed': // 移速
                ctx.beginPath();
                ctx.moveTo(x + 20, y - 15);
                ctx.lineTo(x - 15, y);
                ctx.lineTo(x + 5, y);
                ctx.lineTo(x - 15, y + 20);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.stroke();
                // 速度线
                ctx.beginPath();
                ctx.moveTo(x - 25, y - 10);
                ctx.lineTo(x - 35, y);
                ctx.moveTo(x - 25, y + 10);
                ctx.lineTo(x - 35, y);
                ctx.stroke();
                break;
                
            case 'dodge': // 闪避
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
                ctx.arc(x + 8, y - 5, 5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                break;
                
            case 'energy': // 能量
                ctx.fillRect(x - 10, y - 20, 20, 40);
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 5, y - 25, 10, 8);
                break;
                
            case 'cooling': // 冷却
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 1.5);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y - 25);
                ctx.lineTo(x + 8, y - 15);
                ctx.lineTo(x - 8, y - 15);
                ctx.fill();
                break;
                
            case 'bounce': // 跳弹
                ctx.beginPath();
                ctx.moveTo(x - 20, y + 15);
                ctx.lineTo(x - 10, y - 15);
                ctx.lineTo(x, y + 15);
                ctx.lineTo(x + 10, y - 15);
                ctx.lineTo(x + 20, y + 15);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
                break;
                
            case 'lightning': // 闪电链
                ctx.beginPath();
                ctx.moveTo(x - 5, y - 25);
                ctx.lineTo(x + 10, y - 5);
                ctx.lineTo(x - 5, y - 5);
                ctx.lineTo(x + 15, y + 25);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.stroke();
                break;
                
            case 'multicast': // 多重
                ctx.beginPath();
                ctx.arc(x - 15, y, 8, 0, Math.PI * 2);
                ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
                ctx.arc(x + 15, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                break;
                
            case 'execution': // 斩杀
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('☠', x, y + 10);
                break;
                
            case 'crit': // 暴击
                ctx.beginPath();
                ctx.moveTo(x, y - 25);
                ctx.lineTo(x + 8, y - 5);
                ctx.lineTo(x + 25, y - 5);
                ctx.lineTo(x + 12, y + 8);
                ctx.lineTo(x + 18, y + 25);
                ctx.lineTo(x, y + 15);
                ctx.lineTo(x - 18, y + 25);
                ctx.lineTo(x - 12, y + 8);
                ctx.lineTo(x - 25, y - 5);
                ctx.lineTo(x - 8, y - 5);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'omega': // 欧米加
                ctx.beginPath();
                ctx.arc(x, y, 22, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Ω', x, y + 8);
                break;
                
            case 'perpetual': // 永动
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                break;
                
            case 'phoenix': // 凤凰
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🔥', x, y + 10);
                break;
                
            case 'piercing': // 穿甲
                ctx.beginPath();
                ctx.moveTo(x, y - 25);
                ctx.lineTo(x + 15, y + 5);
                ctx.lineTo(x + 5, y + 5);
                ctx.lineTo(x + 5, y + 25);
                ctx.lineTo(x - 5, y + 25);
                ctx.lineTo(x - 5, y + 5);
                ctx.lineTo(x - 15, y + 5);
                ctx.closePath();
                ctx.fill();
                break;
                
            default: // 默认显示技能ID首字母
                ctx.fillStyle = color;
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(skill.id.charAt(0), x, y + 10);
        }
        
        ctx.restore();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let testLine = '';
        
        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}

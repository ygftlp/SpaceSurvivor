import BaseFighter from './BaseFighter.js';

/**
 * J-20 威龙 - 隐身刺客型
 * 战术定位：伏击、绕后、优先击杀精英
 * 独特能力：【隐身模式】周期性进入隐身状态，敌人无法锁定
 */
export default class J20 extends BaseFighter {
    constructor() {
        super();
        this.name = '威龙 J-20';
        this.desc = '【隐身刺客】重型隐身空优战机。周期性进入隐身模式，敌人无法锁定你。适合喜欢高风险高回报的玩家。';
        this.hp = 120;
        this.speed = 8;
        this.damage = 14; // High Firepower
        this.unlockCost = 0;
        this.engineOffsets = [{ x: -17, y: 95 }, { x: 17, y: 95 }];
        this.thrustColor = '#00f0ff';

        // Hardpoints: Side Bays (Closed in stealth), Wing (External)
        this.hardpoints = [
            { x: -60, y: 50, type: 'pylon' },
            { x: 60, y: 50, type: 'pylon' },
            { x: -85, y: 55, type: 'pylon' },
            { x: 85, y: 55, type: 'pylon' }
        ];

        // === J-20 独特系统：隐身模式 ===
        this.stealth = {
            active: false,
            cooldown: 0,
            maxCooldown: 8, // 8秒冷却
            duration: 0,
            maxDuration: 3, // 隐身持续3秒
            ready: true
        };
    }

    /**
     * 激活隐身模式
     */
    activateStealth() {
        if (!this.stealth.ready) return false;

        this.stealth.active = true;
        this.stealth.duration = this.stealth.maxDuration;
        this.stealth.ready = false;
        this.stealth.cooldown = this.stealth.maxCooldown;

        console.log('J-20: 隐身模式激活!');
        return true;
    }

    /**
     * 更新隐身系统
     */
    update(dt) {
        super.update(dt);

        // 隐身持续时间
        if (this.stealth.active) {
            this.stealth.duration -= dt;
            if (this.stealth.duration <= 0) {
                this.stealth.active = false;
                console.log('J-20: 隐身模式结束');
            }
        }

        // 冷却恢复
        if (!this.stealth.ready) {
            this.stealth.cooldown -= dt;
            if (this.stealth.cooldown <= 0) {
                this.stealth.ready = true;
                this.stealth.cooldown = 0;
                console.log('J-20: 隐身系统就绪');
            }
        }
    }

    /**
     * 检查是否处于隐身状态（供外部调用）
     */
    isStealthed() {
        return this.stealth.active;
    }

    /**
     * 获取隐身冷却百分比（供UI显示）
     */
    getStealthCooldownPercent() {
        if (this.stealth.ready) return 1;
        return 1 - (this.stealth.cooldown / this.stealth.maxCooldown);
    }

    renderEngineNozzle(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Nozzle Base (Dark Metal)
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(4, 8); ctx.lineTo(-4, 8);
        ctx.fill();

        // Serrated Edges (Stealth)
        ctx.fillStyle = '#17202A';
        ctx.beginPath();
        ctx.moveTo(-4, 8);
        for (let i = 0; i <= 4; i++) {
            ctx.lineTo(-4 + i * 2, (i % 2 === 0) ? 8 : 10);
        }
        ctx.lineTo(4, 8);
        ctx.fill();

        // Inner Glow (Heat)
        const heat = Math.sin(this.time * 10) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(0, 255, 255, ${heat})`;
        ctx.fillRect(-2, 2, 4, 6);

        ctx.restore();
    }

    render(ctx, size = 100) {
        const scale = size / 100;
        ctx.save();
        ctx.scale(scale, scale);

        // === 隐身效果 ===
        if (this.stealth.active) {
            ctx.globalAlpha = 0.3; // 隐身时半透明

            // 隐身轮廓线
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f0ff';
        }

        // Idle Hover Effect
        this.applyHover(ctx);

        // --- 0. Particles (Trails) ---
        this.renderParticles(ctx);

        // --- Thrusters (Neon Blue) ---
        this.renderThruster(ctx, -17, 95, this.thrustColor);
        this.renderThruster(ctx, 17, 95, this.thrustColor);

        // --- J-20 "Mighty Dragon" Realistic Render ---
        // Style: Long fuselage, Canards, Delta Wing, DSI Intakes, Ventral Fins

        // 1. Common Shadow/Glow
        // 1. Common Shadow/Glow (Inlined for compatibility)
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;

        // 2. Main Body Base (Silver/Grey Stealth Coating)
        const bodyGrad = ctx.createLinearGradient(0, -90, 0, 90);
        if (this.mainColor) {
            bodyGrad.addColorStop(0, this.adjustColor(this.mainColor, 50));
            bodyGrad.addColorStop(0.4, this.mainColor);
            bodyGrad.addColorStop(1, this.adjustColor(this.mainColor, -50));
        } else {
            bodyGrad.addColorStop(0, '#B0B8B9');   // Light Silver Top
            bodyGrad.addColorStop(0.4, '#707B7C'); // Stealth Grey
            bodyGrad.addColorStop(1, '#2C3E50');   // Dark Underside
        }

        ctx.beginPath();
        // Nose (Chined)
        ctx.moveTo(0, -115);
        ctx.lineTo(-6, -85);
        ctx.lineTo(-10, -70); // Cockpit start width

        // Canards (Forward Swept, Moving Surface)
        // J-20 Canards are set high and forward
        ctx.lineTo(-12, -55); // Canard Root Front
        ctx.lineTo(-38, -65); // Canard Tip (Swept forward/out)
        ctx.lineTo(-38, -50); // Canard Tip Rear
        ctx.lineTo(-15, -35); // Canard Root Rear

        // Main Wing (Delta)
        ctx.lineTo(-85, 45);  // Wing Tip Front
        ctx.lineTo(-85, 55);  // Wing Tip Rear
        ctx.lineTo(-20, 80);  // Wing Root Rear

        // Ventral Fins (Under tail)
        ctx.lineTo(-20, 100); // Fin Start
        ctx.lineTo(-25, 110); // Fin Tip
        ctx.lineTo(-15, 105); // Fin End

        // Engine Nozzles
        ctx.lineTo(-17, 95);  // Engine Left Center

        // Stinger (Tail boom between engines)
        ctx.lineTo(0, 105);

        // Mirror Right
        ctx.lineTo(17, 95);
        ctx.lineTo(15, 105);
        ctx.lineTo(25, 110);
        ctx.lineTo(20, 100);
        ctx.lineTo(20, 80);
        ctx.lineTo(85, 55);
        ctx.lineTo(85, 45);
        ctx.lineTo(15, -35);
        ctx.lineTo(38, -50);
        ctx.lineTo(38, -65);
        ctx.lineTo(12, -55);
        ctx.lineTo(10, -70);
        ctx.lineTo(6, -85);
        ctx.lineTo(0, -115);

        ctx.closePath();
        ctx.fill();

        // --- 3D Details ---
        ctx.save();
        ctx.clip();

        // Chine Line Highlight (The sharp edge)
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -115); ctx.lineTo(-10, -70); ctx.lineTo(-20, -30);
        ctx.moveTo(0, -115); ctx.lineTo(10, -70); ctx.lineTo(20, -30);
        ctx.stroke();

        // Vertical Stabilizers (Canted Outwards)
        // Draw separate to look "on top"
        ctx.restore(); // End clip for body

        // Render Vertical Stabs
        const stabGrad = ctx.createLinearGradient(0, 0, 0, 100);
        stabGrad.addColorStop(0, '#5D6D7E');
        stabGrad.addColorStop(1, '#2C3E50');
        ctx.fillStyle = stabGrad;

        // Left Stab
        ctx.beginPath();
        ctx.moveTo(-18, 60);
        ctx.lineTo(-35, 95);
        ctx.lineTo(-20, 90);
        ctx.lineTo(-15, 65);
        ctx.fill();

        // Right Stab
        ctx.beginPath();
        ctx.moveTo(18, 60);
        ctx.lineTo(35, 95);
        ctx.lineTo(20, 90);
        ctx.lineTo(15, 65);
        ctx.fill();

        // --- Render Skins (Paint) ---
        this.renderSkins(ctx);

        // --- Cockpit (Dragon's Eye) ---
        // J-20 has a frameless canopy with a golden/silver coating
        const cockpitGrad = ctx.createLinearGradient(0, -85, 0, -45);
        cockpitGrad.addColorStop(0, '#F7DC6F');   // Gold Reflection
        cockpitGrad.addColorStop(0.3, '#D4AC0D'); // Deep Gold
        cockpitGrad.addColorStop(0.6, '#5D6D7E'); // Grey/Silver Transition
        cockpitGrad.addColorStop(1, '#17202A');   // Dark Base

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#F1C40F';

        ctx.beginPath();
        // Teardrop shape
        ctx.moveTo(0, -85);
        ctx.bezierCurveTo(-7, -75, -7, -55, -6, -45);
        ctx.quadraticCurveTo(0, -42, 6, -45);
        ctx.bezierCurveTo(7, -55, 7, -75, 0, -85);
        ctx.closePath();

        ctx.fillStyle = cockpitGrad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Internal Cockpit Details (Clipped)
        ctx.save();
        ctx.clip();

        // 1. Ejection Seat Headrest
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(-3, -55, 6, 8);

        // 2. HUD Hologram
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, -75);
        ctx.lineTo(-4, -60);
        ctx.lineTo(4, -60);
        ctx.fill();

        // 3. Specular Highlight (Sharp)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-3, -65, 1.5, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Detonating Cord (Zig-zag on canopy top - typical for J-20)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -80);
        ctx.lineTo(0, -50);
        ctx.stroke();

        // Render Equipment
        this.renderDevices(ctx);

        ctx.restore(); // End Main Save
    }
}

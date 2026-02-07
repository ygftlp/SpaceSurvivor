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
        this.desc = '【隐身刺客】重型隐身空优战机。周期性进入隐身模式，敌人无法锁定你。';
        this.hp = 120;
        this.speed = 10;
        this.damage = 16;
        this.unlockCost = 0;
        this.engineOffsets = [{ x: -17, y: 95 }, { x: 17, y: 95 }];
        this.thrustColor = '#00f0ff';

        // Hardpoints
        this.hardpoints = [
            { x: -60, y: 50, type: 'pylon' },
            { x: 60, y: 50, type: 'pylon' },
            { x: -85, y: 55, type: 'pylon' },
            { x: 85, y: 55, type: 'pylon' }
        ];

        // Stealth System
        this.stealth = {
            active: false,
            cooldown: 0,
            maxCooldown: 8,
            duration: 0,
            maxDuration: 3,
            ready: true
        };
    }

    activateStealth() {
        if (!this.stealth.ready) return false;
        this.stealth.active = true;
        this.stealth.duration = this.stealth.maxDuration;
        this.stealth.ready = false;
        this.stealth.cooldown = this.stealth.maxCooldown;
        return true;
    }

    update(dt) {
        super.update(dt);
        if (this.stealth.active) {
            this.stealth.duration -= dt;
            if (this.stealth.duration <= 0) this.stealth.active = false;
        }
        if (!this.stealth.ready) {
            this.stealth.cooldown -= dt;
            if (this.stealth.cooldown <= 0) {
                this.stealth.ready = true;
                this.stealth.cooldown = 0;
            }
        }
    }

    isStealthed() { return this.stealth.active; }

    render(ctx, size = 100) {
        const scale = size / 100;
        ctx.save();
        ctx.scale(scale, scale);

        // Stealth Transparency
        if (this.stealth.active) {
            ctx.globalAlpha = 0.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f0ff';
        } else {
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }

        // Hover
        this.applyHover(ctx);
        
        // Particles
        this.renderParticles(ctx);

        // Thrusters
        this.renderThruster(ctx, -17, 95, this.thrustColor);
        this.renderThruster(ctx, 17, 95, this.thrustColor);

        // === Body Rendering ===
        // Common Shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;

        // Gradient
        const bodyGrad = ctx.createLinearGradient(0, -90, 0, 90);
        const mainColor = this.mainColor || '#707B7C'; // Fallback color
        
        try {
            if (this.mainColor) {
                bodyGrad.addColorStop(0, this.adjustColor(mainColor, 50));
                bodyGrad.addColorStop(0.4, mainColor);
                bodyGrad.addColorStop(1, this.adjustColor(mainColor, -50));
            } else {
                bodyGrad.addColorStop(0, '#B0B8B9');
                bodyGrad.addColorStop(0.4, '#707B7C');
                bodyGrad.addColorStop(1, '#2C3E50');
            }
        } catch (e) {
            // Fallback if adjustColor fails
            bodyGrad.addColorStop(0, '#B0B8B9');
            bodyGrad.addColorStop(1, '#2C3E50');
        }

        ctx.fillStyle = bodyGrad;
        
        // Draw J-20 Shape (Simplified and Verified)
        ctx.beginPath();
        // Left Side
        ctx.moveTo(0, -115); // Nose
        ctx.lineTo(-6, -85);
        ctx.lineTo(-10, -70);
        ctx.lineTo(-12, -55); // Canard Front
        ctx.lineTo(-38, -65); // Canard Tip
        ctx.lineTo(-38, -50); // Canard Rear
        ctx.lineTo(-15, -35);
        ctx.lineTo(-85, 45);  // Wing Front
        ctx.lineTo(-85, 55);  // Wing Tip
        ctx.lineTo(-20, 80);  // Wing Rear
        ctx.lineTo(-20, 100); // Tail
        ctx.lineTo(-25, 110);
        ctx.lineTo(-15, 105);
        ctx.lineTo(-17, 95);  // Engine
        ctx.lineTo(0, 105);   // Center Rear

        // Right Side (Mirror)
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

        // Details (Canopy)
        ctx.fillStyle = '#17202A';
        ctx.beginPath();
        ctx.moveTo(0, -85);
        ctx.bezierCurveTo(-7, -75, -7, -55, 0, -45);
        ctx.bezierCurveTo(7, -55, 7, -75, 0, -85);
        ctx.fill();

        // Equipment
        this.renderEquipment(ctx);

        ctx.restore();
    }
}

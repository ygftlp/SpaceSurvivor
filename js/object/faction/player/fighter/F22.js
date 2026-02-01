import BaseFighter from './BaseFighter.js';

/**
 * F-22 猛禽 - 矢量冲刺型
 * 战术定位：快速突进、紧急避险、全能多面手
 * 独特能力：【矢量冲刺】可以向任意方向快速冲刺一段距离，冷却短
 */
export default class F22 extends BaseFighter {
    constructor() {
        super();
        this.name = '猛禽 F-22';
        this.desc = '【矢量冲刺】全能空优战机，拥有矢量推力系统。可以向任意方向快速冲刺，适合新手玩家和灵活战术。';
        this.hp = 110;
        this.speed = 10;
        this.damage = 12;
        this.unlockCost = 1000;
        this.engineOffsets = [{ x: -15, y: 85 }, { x: 15, y: 85 }];
        this.thrustColor = '#ff5500';

        // Hardpoints
        this.hardpoints = [
            { x: -65, y: 40, type: 'pylon' },
            { x: 65, y: 40, type: 'pylon' },
            { x: -90, y: 45, type: 'pylon' },
            { x: 90, y: 45, type: 'pylon' }
        ];

        // === F-22 独特系统：矢量冲刺 ===
        this.dash = {
            ready: true,
            cooldown: 0,
            maxCooldown: 3, // 3秒冷却
            duration: 0,
            maxDuration: 0.3, // 冲刺持续0.3秒
            speedMultiplier: 4, // 冲刺时4倍速度
            direction: { x: 0, y: 0 }
        };
    }

    /**
     * 激活矢量冲刺
     * @param {number} dirX - 冲刺方向X (-1到1)
     * @param {number} dirY - 冲刺方向Y (-1到1)
     */
    activateDash(dirX, dirY) {
        if (!this.dash.ready) return false;

        // 归一化方向
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len === 0) return false;

        this.dash.direction.x = dirX / len;
        this.dash.direction.y = dirY / len;
        this.dash.active = true;
        this.dash.duration = this.dash.maxDuration;
        this.dash.ready = false;
        this.dash.cooldown = this.dash.maxCooldown;

        console.log('F-22: 矢量冲刺激活!');
        return true;
    }

    /**
     * 获取当前速度倍数（供Player调用）
     */
    getSpeedMultiplier() {
        if (this.dash.active) {
            return this.dash.speedMultiplier;
        }
        return 1;
    }

    update(dt) {
        super.update(dt);

        // 冲刺持续时间
        if (this.dash.active) {
            this.dash.duration -= dt;
            if (this.dash.duration <= 0) {
                this.dash.active = false;
                console.log('F-22: 冲刺结束');
            }
        }

        // 冷却恢复
        if (!this.dash.ready) {
            this.dash.cooldown -= dt;
            if (this.dash.cooldown <= 0) {
                this.dash.ready = true;
                this.dash.cooldown = 0;
                console.log('F-22: 冲刺系统就绪');
            }
        }
    }

    getDashCooldownPercent() {
        if (this.dash.ready) return 1;
        return 1 - (this.dash.cooldown / this.dash.maxCooldown);
    }

    render(ctx, size = 100) {
        const scale = size / 100;
        ctx.save();
        ctx.scale(scale, scale);

        this.applyHover(ctx);
        this.renderParticles(ctx);

        // --- Thrusters (Magenta/Purple Neon) ---
        this.renderThruster(ctx, -15, 85, this.thrustColor);
        this.renderThruster(ctx, 15, 85, this.thrustColor);

        // --- F-22 "Raptor" Realistic Render ---
        // Style: Stealth Geometry, Diamond Wings, CARET Intakes, 2D Vectoring

        // 1. Common Shadow/Glow
        // 1. Common Shadow/Glow (Inlined)
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;

        // 2. Main Body (Stealth Grey/Silver with Purple Tint)
        const bodyGrad = ctx.createLinearGradient(0, -80, 0, 80);
        if (this.mainColor) {
            bodyGrad.addColorStop(0, this.adjustColor(this.mainColor, 50));
            bodyGrad.addColorStop(0.3, this.mainColor);
            bodyGrad.addColorStop(0.7, this.adjustColor(this.mainColor, -30));
            bodyGrad.addColorStop(1, this.adjustColor(this.mainColor, -60));
        } else {
            bodyGrad.addColorStop(0, '#D7BDE2');   // Pale Lavender Silver (Highlight)
            bodyGrad.addColorStop(0.3, '#767d92'); // Cool Stealth Grey
            bodyGrad.addColorStop(0.7, '#4A235A'); // Deep Purple Shadow
            bodyGrad.addColorStop(1, '#1B2631');   // Dark Base
        }

        ctx.beginPath();
        // Nose (Radome)
        ctx.moveTo(0, -100);
        ctx.lineTo(-8, -65);

        // CARET Intakes (Diamond Shape)
        ctx.lineTo(-20, -50); // Intake Top Inner
        ctx.lineTo(-28, -35); // Intake Lip (Angled back)
        ctx.lineTo(-22, -25); // Intake Bottom blend

        // Leading Edge
        ctx.lineTo(-90, 30);  // Wing Tip Front
        ctx.lineTo(-90, 45);  // Wing Tip Rear

        // Trailing Edge (Forward Swept)
        ctx.lineTo(-45, 65);  // Flap End

        // Horizontal Stabilizer (Large, separate surface visually merged here for top-down 2D)
        // F-22 Stabs overlap engines slightly
        ctx.lineTo(-60, 95);  // Stab Tip
        ctx.lineTo(-25, 95);  // Stab Root

        // Engine Housing (Boom)
        ctx.lineTo(-20, 90);

        // Vectoring Nozzle Cutout (Rectangular)
        ctx.lineTo(-10, 85);
        ctx.lineTo(0, 90);    // Stinger
        ctx.lineTo(10, 85);

        // Mirror Right
        ctx.lineTo(20, 90);
        ctx.lineTo(25, 95);
        ctx.lineTo(60, 95);
        ctx.lineTo(45, 65);
        ctx.lineTo(90, 45);
        ctx.lineTo(90, 30);
        ctx.lineTo(22, -25);
        ctx.lineTo(28, -35);
        ctx.lineTo(20, -50);
        ctx.lineTo(8, -65);
        ctx.closePath();

        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // --- 3D Diamond Profile & Metallic Sheen ---
        ctx.save();
        ctx.clip(); // Clip to Body

        // 1. Nose/Fuselage Diamond Ridge
        const ridgeGrad = ctx.createLinearGradient(-20, 0, 20, 0);
        ridgeGrad.addColorStop(0, 'rgba(0,0,0,0.4)');    // Left Shadow
        ridgeGrad.addColorStop(0.4, 'rgba(255,255,255,0.0)'); // Blend
        ridgeGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)'); // Sharp Ridge
        ridgeGrad.addColorStop(0.6, 'rgba(255,255,255,0.0)'); // Blend
        ridgeGrad.addColorStop(1, 'rgba(0,0,0,0.4)');    // Right Shadow

        ctx.fillStyle = ridgeGrad;
        ctx.fillRect(-90, -120, 180, 240);

        // 2. Wing "Chine" Highlight (Leading Edge)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        // Left Wing LE
        ctx.moveTo(-22, -25); ctx.lineTo(-90, 30);
        // Right Wing LE
        ctx.moveTo(22, -25); ctx.lineTo(90, 30);
        ctx.stroke();

        // 3. Metallic Sheen (Anisotropic reflection simulation)
        const sheenGrad = ctx.createRadialGradient(0, -40, 5, 0, -40, 80);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheenGrad;
        ctx.fill();

        ctx.restore();

        // Surface Detail: RAM Coating Panels (Subtle Hex pattern)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(0, -40); ctx.lineTo(-20, 0); ctx.lineTo(0, 40); ctx.lineTo(20, 0);
        ctx.fill();

        // --- 2.1 Vertical Stabilizers (Large, Canted Outwards) ---
        // To simulate canted angle in 2D, we make the top wider/offset and add gradient
        const finGrad = ctx.createLinearGradient(-20, 50, -35, 85);
        finGrad.addColorStop(0, '#566573');
        finGrad.addColorStop(1, '#2C3E50'); // Darker at bottom/rear to suggest shadow

        ctx.fillStyle = finGrad;
        ctx.beginPath();
        // Left Fin
        ctx.moveTo(-20, 50); // Root Leading Edge
        ctx.lineTo(-38, 88); // Tip Trailing Edge (Extended for projection)
        ctx.lineTo(-24, 88); // Root Trailing Edge
        ctx.lineTo(-12, 55); // Root Leading Edge Blend
        ctx.fill();

        // Right Fin
        ctx.fillStyle = finGrad; // Re-use or mirror gradient logic if strictly needed, but solid color or simple linear works for flat 2D
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.lineTo(38, 88);
        ctx.lineTo(24, 88);
        ctx.lineTo(12, 55);
        ctx.fill();

        // Aerial Refueling Receptacle (Spine Detail)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-2, 10);
        ctx.lineTo(2, 10);
        ctx.lineTo(3, 25);
        ctx.lineTo(-3, 25);
        ctx.fill();
        // Outline
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // --- 2.2 Intake Detail (Dark Grey) ---
        ctx.fillStyle = '#212F3C';
        // Left
        ctx.beginPath();
        ctx.moveTo(-20, -50); ctx.lineTo(-28, -35); ctx.lineTo(-22, -35); ctx.lineTo(-15, -45);
        ctx.fill();
        // Right
        ctx.beginPath();
        ctx.moveTo(20, -50); ctx.lineTo(28, -35); ctx.lineTo(22, -35); ctx.lineTo(15, -45);
        ctx.fill();


        // --- 4.1 RCS Thrusters ---
        this.renderRCS(ctx, [
            { x: -12, y: -60, angle: Math.PI / 2 }, // Nose Left
            { x: 12, y: -60, angle: -Math.PI / 2 }, // Nose Right
            { x: -85, y: 45, angle: Math.PI },    // Left Wing
            { x: 85, y: 45, angle: Math.PI }      // Right Wing
        ]);

        // 5. Cockpit (Gold-Indium Coating - "Raptor's Gaze")
        const cockpitGrad = ctx.createLinearGradient(0, -55, 0, -20);
        cockpitGrad.addColorStop(0, '#F7DC6F');   // Reflective Gold Top
        cockpitGrad.addColorStop(0.4, '#B9770E'); // Deep Amber
        cockpitGrad.addColorStop(0.8, '#5B2C6F'); // Purple/Dark Tint (Stealth coating shift)
        cockpitGrad.addColorStop(1, '#F7DC6F');   // Bottom Reflection

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#F1C40F';

        ctx.beginPath();
        // Bubble Canopy - Wider for F-22
        ctx.moveTo(0, -58);
        ctx.bezierCurveTo(-6, -50, -7, -30, -5, -22); // Rear widens slightly
        ctx.quadraticCurveTo(0, -20, 5, -22);
        ctx.bezierCurveTo(7, -30, 6, -50, 0, -58);
        ctx.closePath();

        ctx.fillStyle = cockpitGrad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // --- Internal Details (Clipped) ---
        ctx.save();
        ctx.clip();

        // 1. ACES II Ejection Seat
        ctx.fillStyle = '#212F3C';
        ctx.fillRect(-4, -28, 8, 6); // Seat Back
        ctx.fillStyle = '#17202A';
        ctx.beginPath(); ctx.arc(0, -35, 3.5, 0, Math.PI * 2); ctx.fill(); // Helmet

        // 2. HUD Projector (The Green Glow)
        ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-5, -60);
        ctx.lineTo(5, -60);
        ctx.fill();

        // 3. HUD Symbology (Minimalist)
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 0.5;
        // Velocity Vector
        ctx.beginPath();
        ctx.arc(0, -48, 1, 0, Math.PI * 2);
        ctx.moveTo(-2, -48); ctx.lineTo(-4, -48);
        ctx.moveTo(2, -48); ctx.lineTo(4, -48);
        ctx.moveTo(0, -49); ctx.lineTo(0, -51);
        ctx.stroke();

        // 4. Specular Highlight (Sharp)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(3, -45, 1.5, 6, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Canopy Frame (Stealth Edging)
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'; // Gold tint on frame
        ctx.stroke(); // Redraw path if needed, but context usually preserves it or we can redraw

        // Redraw path for frame
        ctx.beginPath();
        ctx.moveTo(0, -58);
        ctx.bezierCurveTo(-6, -50, -7, -30, -5, -22);
        ctx.quadraticCurveTo(0, -20, 5, -22);
        ctx.bezierCurveTo(7, -30, 6, -50, 0, -58);
        ctx.closePath();
        ctx.stroke();

        // 6. Navigation Lights
        this.renderNavLights(ctx, {
            left: { x: -85, y: 45 },
            right: { x: 85, y: 45 },
            tail: { x: 0, y: 90 }
        });

        // 7. Rectangular Vector Nozzles (Distinct Twin Channels)
        ctx.fillStyle = '#2C3E50'; // Dark Metal

        // Left Nozzle
        ctx.save();
        ctx.translate(-15, 85);
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
        ctx.lineTo(10, 12); ctx.lineTo(-10, 12); // Trapezoid expansion (Larger)
        ctx.fill();
        // Vectoring Flaps
        ctx.fillStyle = '#17202A';
        ctx.fillRect(-8, 2, 16, 8);
        // Heat Glow
        ctx.fillStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.fillRect(-6, 4, 12, 4);
        ctx.restore();

        // Right Nozzle
        ctx.save();
        ctx.translate(15, 85);
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
        ctx.lineTo(10, 12); ctx.lineTo(-10, 12);
        ctx.fill();
        // Vectoring Flaps
        ctx.fillStyle = '#17202A';
        ctx.fillRect(-8, 2, 16, 8);
        // Heat Glow
        ctx.fillStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.fillRect(-6, 4, 12, 4);
        ctx.restore();

        // Render Equipment
        this.renderDevices(ctx);

        ctx.restore();
    }
}

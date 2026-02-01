import BaseFighter from './BaseFighter.js';

/**
 * Su-57 幽灵 - 重装护盾型
 * 战术定位：正面硬抗、保护母舰、守护队友
 * 独特能力：【等离子护盾】周期性激活护盾，吸收所有伤害
 */
export default class Su57 extends BaseFighter {
    constructor() {
        super();
        this.name = '幽灵 Su-57';
        this.desc = '【等离子护盾】重装战机，拥有等离子隐身护盾。周期性生成护盾吸收伤害，适合喜欢守护和正面硬刚的玩家。';
        this.hp = 140; // 最高血量
        this.speed = 9;
        this.damage = 13;
        this.unlockCost = 1500;
        this.engineOffsets = [{ x: -27, y: 102 }, { x: 27, y: 102 }];
        this.thrustColor = '#a569bd';

        // Hardpoints
        this.hardpoints = [
            { x: -60, y: 45, type: 'pylon' },
            { x: 60, y: 45, type: 'pylon' },
            { x: -90, y: 45, type: 'pylon' },
            { x: 90, y: 45, type: 'pylon' }
        ];

        // === Su-57 独特系统：等离子护盾 ===
        this.shield = {
            active: false,
            cooldown: 0,
            maxCooldown: 10, // 10秒冷却
            duration: 0,
            maxDuration: 4, // 护盾持续4秒
            ready: true,
            hp: 200, // 护盾生命值
            maxShieldHp: 200
        };
    }

    /**
     * 激活等离子护盾
     */
    activateShield() {
        if (!this.shield.ready) return false;

        this.shield.active = true;
        this.shield.duration = this.shield.maxDuration;
        this.shield.hp = this.shield.maxShieldHp;
        this.shield.ready = false;
        this.shield.cooldown = this.shield.maxCooldown;

        console.log('Su-57: 等离子护盾激活!');
        return true;
    }

    /**
     * 护盾受到伤害
     */
    takeShieldDamage(damage) {
        if (!this.shield.active) return damage; // 护盾未激活，全部伤害穿透

        this.shield.hp -= damage;
        if (this.shield.hp <= 0) {
            const overflow = -this.shield.hp;
            this.shield.active = false;
            this.shield.hp = 0;
            console.log('Su-57: 护盾破碎!');
            return overflow; // 返回溢出的伤害
        }
        return 0; // 护盾吸收了全部伤害
    }

    update(dt) {
        super.update(dt);

        // 护盾持续时间
        if (this.shield.active) {
            this.shield.duration -= dt;
            if (this.shield.duration <= 0) {
                this.shield.active = false;
                console.log('Su-57: 护盾时间结束');
            }
        }

        // 冷却恢复
        if (!this.shield.ready) {
            this.shield.cooldown -= dt;
            if (this.shield.cooldown <= 0) {
                this.shield.ready = true;
                this.shield.cooldown = 0;
                this.shield.hp = this.shield.maxShieldHp;
                console.log('Su-57: 护盾系统就绪');
            }
        }
    }

    isShieldActive() {
        return this.shield.active;
    }

    getShieldPercent() {
        return this.shield.hp / this.shield.maxShieldHp;
    }

    getShieldCooldownPercent() {
        if (this.shield.ready) return 1;
        return 1 - (this.shield.cooldown / this.shield.maxCooldown);
    }

    render(ctx, size = 100) {
        const scale = size / 100;
        ctx.save();
        ctx.scale(scale, scale);

        // Hover
        this.applyHover(ctx);
        this.renderParticles(ctx);

        // === 等离子护盾效果 ===
        if (this.shield.active) {
            const pulse = Math.sin(this.time * 8) * 0.2 + 0.8;
            const shieldAlpha = 0.3 * pulse;

            // 护盾外圈
            ctx.fillStyle = `rgba(165, 105, 189, ${shieldAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, 70, 0, Math.PI * 2);
            ctx.fill();

            // 护盾边框
            ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 70, 0, Math.PI * 2);
            ctx.stroke();

            // 护盾强度指示
            const shieldPercent = this.shield.hp / this.shield.maxShieldHp;
            ctx.strokeStyle = shieldPercent > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 75, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * shieldPercent));
            ctx.stroke();
        }

        // --- Thrusters (Red/Pink Plasma) ---
        this.renderThruster(ctx, -27, 102, this.thrustColor);
        this.renderThruster(ctx, 27, 102, this.thrustColor);

        // --- Su-57 "Felon" Realistic Render ---
        // Style: Flattened Lifting Body, Levcon, Wide Engine Spacing, Stinger

        // 1. Common Shadow/Glow
        // 1. Common Shadow/Glow (Inlined)
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;

        // 2. Main Body (Polar Camouflage & Shark Skin)
        const bodyGrad = ctx.createLinearGradient(0, -90, 0, 90);
        if (this.mainColor) {
            bodyGrad.addColorStop(0, this.adjustColor(this.mainColor, 60));
            bodyGrad.addColorStop(0.3, this.mainColor);
            bodyGrad.addColorStop(0.7, this.adjustColor(this.mainColor, -40));
            bodyGrad.addColorStop(1, this.adjustColor(this.mainColor, -70));
        } else {
            bodyGrad.addColorStop(0, '#E5E8E8');   // Arctic White/Grey Top
            bodyGrad.addColorStop(0.3, '#808B96'); // Battleship Grey
            bodyGrad.addColorStop(0.7, '#2C3E50'); // Dark Slate
            bodyGrad.addColorStop(1, '#17202A');   // Shadow Base
        }

        ctx.beginPath();
        // Long Needle Nose
        ctx.moveTo(0, -110);
        ctx.lineTo(-8, -70);

        // Levcon (Leading Edge Vortex Controller) - Movable LERX
        ctx.lineTo(-30, -35); // Levcon Tip
        ctx.lineTo(-18, -20); // Levcon Root / Wing Blend

        // Main Wing (Clipped Delta / Trapezoid)
        ctx.lineTo(-90, 30);  // Wing Tip Front
        ctx.lineTo(-90, 45);  // Wing Tip Rear

        // Wing Trailing Edge (Forward Swept)
        ctx.lineTo(-40, 70);

        // Horizontal Stabilizer (All-Moving)
        ctx.lineTo(-55, 100); // Stab Tip
        ctx.lineTo(-35, 100); // Stab Root

        // Engine Nacelle (Outer)
        ctx.lineTo(-30, 95);

        // Engine Nozzle Area
        ctx.lineTo(-27, 102); // Left Nozzle Center

        // The "Tunnel" (Central Sting)
        ctx.lineTo(-10, 95);
        ctx.lineTo(0, 115);   // Long Stinger (Radar/Chute)
        ctx.lineTo(10, 95);

        // Mirror Right
        ctx.lineTo(27, 102);
        ctx.lineTo(30, 95);
        ctx.lineTo(35, 100);
        ctx.lineTo(55, 100);
        ctx.lineTo(40, 70);
        ctx.lineTo(90, 45);
        ctx.lineTo(90, 30);
        ctx.lineTo(18, -20);
        ctx.lineTo(30, -35);
        ctx.lineTo(8, -70);
        ctx.closePath();

        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // --- 3D Lifting Body & Nacelle Bulges ---
        ctx.save();
        ctx.clip(); // Clip to body

        // 1. Central Lifting Body (Flat Center, Rounded Sides)
        // Su-57 is very wide and flat
        const liftingBodyGrad = ctx.createLinearGradient(-30, 0, 30, 0);
        liftingBodyGrad.addColorStop(0, 'rgba(0,0,0,0.3)');    // Left Nacelle Slope
        liftingBodyGrad.addColorStop(0.3, 'rgba(255,255,255,0.2)'); // Left Shoulder
        liftingBodyGrad.addColorStop(0.5, 'rgba(255,255,255,0.0)'); // Flat Center
        liftingBodyGrad.addColorStop(0.7, 'rgba(255,255,255,0.2)'); // Right Shoulder
        liftingBodyGrad.addColorStop(1, 'rgba(0,0,0,0.3)');    // Right Nacelle Slope

        ctx.fillStyle = liftingBodyGrad;
        ctx.fillRect(-60, -120, 120, 240);

        // 2. Engine Nacelle Bulges (Underbelly implied on top surface)
        // Distinct cylindrical highlights along the engine axes
        const nacelleHighlightLeft = ctx.createLinearGradient(-35, 0, -15, 0);
        nacelleHighlightLeft.addColorStop(0, 'rgba(0,0,0,0.2)');
        nacelleHighlightLeft.addColorStop(0.5, 'rgba(255,255,255,0.15)'); // Subtle Highlight
        nacelleHighlightLeft.addColorStop(1, 'rgba(0,0,0,0.2)');

        ctx.fillStyle = nacelleHighlightLeft;
        ctx.fillRect(-40, -20, 30, 120); // Left Nacelle Area

        const nacelleHighlightRight = ctx.createLinearGradient(15, 0, 35, 0);
        nacelleHighlightRight.addColorStop(0, 'rgba(0,0,0,0.2)');
        nacelleHighlightRight.addColorStop(0.5, 'rgba(255,255,255,0.15)'); // Subtle Highlight
        nacelleHighlightRight.addColorStop(1, 'rgba(0,0,0,0.2)');

        ctx.fillStyle = nacelleHighlightRight;
        ctx.fillRect(10, -20, 30, 120); // Right Nacelle Area

        // 3. Nose Cone Highlight (Sharp)
        const noseGrad = ctx.createRadialGradient(0, -90, 1, 0, -90, 10);
        noseGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
        noseGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = noseGrad;
        ctx.beginPath(); ctx.arc(0, -90, 10, 0, Math.PI * 2); ctx.fill();

        ctx.restore();

        // --- 2.1 Engine Nacelles (Underbelly Definition) ---
        // Su-57 has very distinct engine pods separated by a wide tunnel
        const engineGrad = ctx.createLinearGradient(0, -20, 0, 100);
        engineGrad.addColorStop(0, '#808B96');
        engineGrad.addColorStop(1, '#2C3E50');
        ctx.fillStyle = engineGrad;

        // Left Nacelle
        ctx.beginPath();
        ctx.moveTo(-15, -10); // Intake Start
        ctx.lineTo(-30, 90);
        ctx.lineTo(-15, 90);
        ctx.fill();

        // Right Nacelle
        ctx.beginPath();
        ctx.moveTo(15, -10); // Intake Start
        ctx.lineTo(30, 90);
        ctx.lineTo(15, 90);
        ctx.fill();

        // Intake Screens (Dark Grey)
        ctx.fillStyle = '#17202A';
        ctx.fillRect(-25, -10, 10, 5); // Left
        ctx.fillRect(15, -10, 10, 5);  // Right

        // --- 2.2 Vertical Stabilizers (All-Moving, Small) ---
        ctx.fillStyle = '#566573';
        ctx.beginPath();
        // Left Fin
        ctx.moveTo(-18, 60);
        ctx.lineTo(-32, 90);
        ctx.lineTo(-20, 90);
        ctx.lineTo(-10, 65);
        ctx.fill();
        // Right Fin
        ctx.beginPath();
        ctx.moveTo(18, 60);
        ctx.lineTo(32, 90);
        ctx.lineTo(20, 90);
        ctx.lineTo(10, 65);
        ctx.fill();

        // --- 2.3 Mechanical Spine Details ---
        ctx.fillStyle = '#17202A'; // Darker Spine
        ctx.beginPath();
        // Central Spine
        ctx.moveTo(-4, -60);
        ctx.lineTo(4, -60);
        ctx.lineTo(6, 80);
        ctx.lineTo(-6, 80);
        ctx.fill();

        // Spine Highlights (Red Pulse)
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -60); ctx.lineTo(0, 80);
        ctx.stroke();


        // --- 2.3 RCS Thrusters ---
        this.renderRCS(ctx, [
            { x: 0, y: -110, angle: 0 },          // Nose Tip
            { x: -35, y: -35, angle: Math.PI / 2 }, // Levcon Left
            { x: 35, y: -35, angle: -Math.PI / 2 }, // Levcon Right
            { x: -90, y: 40, angle: Math.PI },    // Wingtip Left
            { x: 90, y: 40, angle: Math.PI }      // Wingtip Right
        ]);

        // 4. Camouflage Pattern (Digital Pixel Splinter)
        ctx.fillStyle = 'rgba(231, 76, 60, 0.15)'; // Subtle Red/Grey Tint for pattern
        // Random-looking pixel blocks
        const pixels = [
            { x: 0, y: -50, w: 10, h: 10 }, { x: -10, y: -40, w: 5, h: 15 },
            { x: 10, y: -30, w: 8, h: 8 }, { x: -20, y: 0, w: 12, h: 12 },
            { x: 20, y: 20, w: 10, h: 20 }, { x: 0, y: 40, w: 15, h: 5 }
        ];

        pixels.forEach(p => {
            ctx.fillRect(p.x, p.y, p.w, p.h);
        });

        // Levcon Hinge Line
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-18, -20); ctx.lineTo(-25, -28);
        ctx.moveTo(18, -20); ctx.lineTo(25, -28);
        ctx.stroke();

        // 5. Cockpit (Russian "Turquoise" Interior - "Ghost's Visor")
        const cockpitGrad = ctx.createLinearGradient(0, -65, 0, -25);
        cockpitGrad.addColorStop(0, '#F9E79F');   // Yellowish Sun Glare
        cockpitGrad.addColorStop(0.3, '#A3E4D7'); // Turquoise/Green Glass
        cockpitGrad.addColorStop(0.8, '#145A32'); // Dark Green Interior
        cockpitGrad.addColorStop(1, '#17202A');   // Instrument Panel Black

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#F4D03F';

        ctx.beginPath();
        // High-Visibility Bubble
        ctx.moveTo(0, -62);
        ctx.bezierCurveTo(-6, -55, -6, -35, -5, -28);
        ctx.lineTo(5, -28);
        ctx.bezierCurveTo(6, -35, 6, -55, 0, -62);
        ctx.closePath();

        ctx.fillStyle = cockpitGrad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // --- Internal Details (Clipped) ---
        ctx.save();
        ctx.clip();

        // 1. K-36D Ejection Seat (Distinctive Headrest)
        ctx.fillStyle = '#212F3C';
        ctx.fillRect(-3, -32, 6, 5); // Seat
        // Red Handles (Ejection)
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(-2, -33, 1, 2);
        ctx.fillRect(1, -33, 1, 2);

        // Pilot Helmet (White/Grey Russian style)
        ctx.fillStyle = '#D5D8DC';
        ctx.beginPath(); ctx.arc(0, -40, 3, 0, Math.PI * 2); ctx.fill();

        // 2. Canopy Bow Frame (The Metal Arch)
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -45, 8, 3.5, 5.9); // Partial arch
        ctx.stroke();

        // 3. HUD & Mirrors
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 0.5;
        // Rear View Mirrors (Top of canopy bow)
        ctx.strokeRect(-5, -48, 2, 1);
        ctx.strokeRect(3, -48, 2, 1);

        // 4. Glare
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-3, -60);
        ctx.lineTo(-1, -50);
        ctx.lineTo(-4, -50);
        ctx.fill();

        ctx.restore();

        // --- External Frame & IRST ---
        // Metal Frame
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#D5D8DC';
        ctx.beginPath();
        ctx.moveTo(0, -62);
        ctx.bezierCurveTo(-6, -55, -6, -35, -5, -28);
        ctx.lineTo(5, -28);
        ctx.bezierCurveTo(6, -35, 6, -55, 0, -62);
        ctx.stroke();

        // IRST (Infra-Red Search and Track) - The "Eye" in front of cockpit
        ctx.fillStyle = '#5B2C6F'; // Dark glass
        ctx.beginPath();
        ctx.arc(4, -60, 2, 0, Math.PI * 2); // Offset to right (standard Su-27/57 layout)
        ctx.fill();
        // IRST Glare
        ctx.fillStyle = '#E8DAEF';
        ctx.beginPath(); ctx.arc(3.5, -60.5, 0.5, 0, Math.PI * 2); ctx.fill();

        // 6. Navigation Lights
        this.renderNavLights(ctx, {
            left: { x: -90, y: 40 },
            right: { x: 90, y: 40 },
            tail: { x: 0, y: 115 }
        });

        // 7. 3D Thrust Vectoring Nozzles (Round)
        // Su-57 has widely spaced engines with a "tunnel" between them

        // Tunnel shading (Deep Gradient)
        const tunnelGrad = ctx.createLinearGradient(0, 80, 0, 110);
        tunnelGrad.addColorStop(0, 'rgba(0,0,0,0.8)'); // Deep shadow at start
        tunnelGrad.addColorStop(1, 'rgba(0,0,0,0.2)'); // Fade out
        ctx.fillStyle = tunnelGrad;
        ctx.fillRect(-10, 80, 20, 35); // Slightly wider and longer to blend

        // Left Engine
        ctx.save();
        ctx.translate(-27, 102);
        // Nacelle
        ctx.fillStyle = '#566573';
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        // Nozzle Ring
        ctx.strokeStyle = '#212F3C';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner Heat
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Right Engine
        ctx.save();
        ctx.translate(27, 102);
        // Nacelle
        ctx.fillStyle = '#566573';
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        // Nozzle Ring
        ctx.strokeStyle = '#212F3C';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner Heat
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Render Equipment
        this.renderDevices(ctx);

        ctx.restore();
    }
}

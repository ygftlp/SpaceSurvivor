import BaseBoss from './BaseBoss.js';
import RadarSystem from '../component/radar/RadarSystem.js';

export default class TitanBattleship extends BaseBoss {
    constructor(x, y, scene) {
        super({
            chassis: 'TITAN',
            hp: 3500,
            score: 10000,
            width: 300,
            height: 400,
            speed: 40
        }, x, y, scene);

        this.name = "泰坦级无畏舰";
        this.initTitanModules();

        this.engineTime = 0;
        
        // Components
        this.radar = new RadarSystem({
            range: 180,
            speed: 2.0,
            color: '#00ff66'
        });
    }

    initTitanModules() {
        // 自定义Titan的组件配置
        this.modules.shield = {
            maxHp: 1200,
            hp: 1200,
            regenRate: 40,
            regenDelay: 6,
            lastDamageTime: 0,
            active: true,
            radius: 180
        };
        
        // 2个主炮
        this.modules.mainTurrets = [
            { x: -80, y: -50, hp: 1200, maxHp: 1200, active: true, lastFire: 0, fireInterval: 2.5, angle: 0 },
            { x: 80, y: -50, hp: 1200, maxHp: 1200, active: true, lastFire: 0, fireInterval: 2.5, angle: 0 }
        ];
        
        // 4个副炮
        this.modules.secondaryGuns = [
            { x: -100, y: 50, hp: 600, maxHp: 600, active: true, lastFire: 0, fireInterval: 0.4 },
            { x: -40, y: 80, hp: 600, maxHp: 600, active: true, lastFire: 0, fireInterval: 0.4 },
            { x: 40, y: 80, hp: 600, maxHp: 600, active: true, lastFire: 0, fireInterval: 0.4 },
            { x: 100, y: 50, hp: 600, maxHp: 600, active: true, lastFire: 0, fireInterval: 0.4 }
        ];
        
        // 2个机库
        this.modules.hangars = [
            { x: -60, y: 30, hp: 1500, maxHp: 1500, active: true, lastSpawn: 0, spawnInterval: 10, spawnType: 'DRONE_SCOUT' },
            { x: 60, y: 30, hp: 1500, maxHp: 1500, active: true, lastSpawn: 0, spawnInterval: 12, spawnType: 'DRONE_KAMIKAZE' }
        ];
    }

    update(dt) {
        super.update(dt);
        this.engineTime += dt;
        
        // Update Components
        this.radar.update(dt);
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 1. Engine Glow (Rear)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 1 + Math.sin(this.engineTime * 10) * 0.1;
        ctx.fillStyle = '#ff6600';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff4400';
        
        // 3 Engine clusters
        [-60, 0, 60].forEach(ox => {
            ctx.beginPath();
            ctx.ellipse(ox, -160, 20 * pulse, 40 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // 2. Main Hull (Heavy Armor)
        ctx.fillStyle = '#222222';
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 4;
        
        // Complex shape
        ctx.beginPath();
        ctx.moveTo(0, 180); // Nose
        ctx.lineTo(60, 120);
        ctx.lineTo(80, 0);
        ctx.lineTo(140, -80); // Wing tip
        ctx.lineTo(140, -140);
        ctx.lineTo(60, -160); // Engine block
        ctx.lineTo(-60, -160);
        ctx.lineTo(-140, -140);
        ctx.lineTo(-140, -80);
        ctx.lineTo(-80, 0);
        ctx.lineTo(-60, 120);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Detail Plating / Gurnies
        ctx.fillStyle = '#333333';
        // Center spine
        ctx.fillRect(-30, -120, 60, 240);
        // Wing plates
        ctx.fillRect(-120, -100, 40, 60);
        ctx.fillRect(80, -100, 40, 60);

        // 3.5 Radar System (Using Component)
        ctx.save();
        ctx.translate(0, 40); // Located on mid-deck
        this.radar.render(ctx);
        ctx.restore();

        // 4. Command Deck (Bridge)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, -20, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000'; // Red eye
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, -20, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 5. Main Turrets
        if (this.modules.mainTurrets) {
            this.modules.mainTurrets.forEach(t => {
                if (!t.active) return;
                ctx.save();
                ctx.translate(t.x, t.y);
                ctx.rotate((t.angle + 90) * Math.PI / 180);

                // Base
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();

                // Main Beam Cannon
                ctx.fillStyle = '#444';
                ctx.fillRect(-10, -10, 20, 40);
                ctx.restore();
            });
        }

        // 5.5 Secondary Guns
        if (this.modules.secondaryGuns) {
            this.modules.secondaryGuns.forEach(t => {
                if (!t.active) return;
                ctx.save();
                ctx.translate(t.x, t.y);
                ctx.rotate(90 * Math.PI / 180);

                // Base
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();

                // Barrels
                ctx.fillStyle = '#888';
                ctx.fillRect(-8, -5, 6, 25);
                ctx.fillRect(2, -5, 6, 25);
                ctx.restore();
            });
        }

        // 6. Shield Effect (Overlay)
        if (this.modules.shield && this.modules.shield.hp > 0) {
            ctx.save();
            ctx.strokeStyle = '#00ffff';
            ctx.globalAlpha = 0.3 + Math.sin(this.engineTime * 5) * 0.1;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            
            // Hexagonal shield pattern approx
            ctx.beginPath();
            ctx.arc(0, 0, this.modules.shield.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}
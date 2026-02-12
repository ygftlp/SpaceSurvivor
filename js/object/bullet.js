/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: Bullet class representing projectiles fired by player or enemies.
 */

export default class Bullet {
    constructor(x, y, angle, speed, damage, isEnemy = false, config = {}, target = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.isEnemy = isEnemy;
        this.config = config; // Store visual config
        this.target = target; // Target for homing
        this.active = true;
        
        // Visual Props
        this.width = config.width || 6;
        this.height = config.height || 12;
        this.color = config.color || (isEnemy ? '#ff0000' : '#ffff00');
        this.shape = config.shape || 'rect'; // 'rect', 'circle', 'orb', 'laser', 'shard', 'rocket'
        
        // Behavior Props
        this.behavior = config.behavior || 'LINEAR'; // 'LINEAR', 'ACCELERATING', 'WOBBLY', 'HOMING'
        this.effect = config.effect || 'NONE'; // 'NONE', 'EXPLOSIVE', 'SLOW', 'PIERCING'
        
        this.time = 0; // Lifetime
        this.baseSpeed = speed; // For variable speed logic
        this.turnSpeed = config.turnSpeed || 2.0; // Radians per sec for homing
    }

    update(dt) {
        if (!this.active) return;
        
        this.time += dt || 0.016;
        const deltaTime = dt || 0.016;

        // Behavior Logic
        let moveAngle = this.angle;

        switch (this.behavior) {
            case 'ACCELERATING':
                this.speed += (this.config.accel || 100) * deltaTime;
                break;
                
            case 'WOBBLY':
                // Sine wave perpendicular to direction
                // We keep base angle, but modify position logic or render logic?
                // Easier to modify angle slightly? No, that makes circles.
                // Let's just modify the visual offset or velocity vector.
                // Simple approach: Add lateral velocity
                const wFreq = this.config.wobbleFreq || 5;
                const wAmp = this.config.wobbleAmp || 2; // Angle deviation
                moveAngle += Math.sin(this.time * wFreq) * wAmp;
                break;
                
            case 'HOMING':
                if (this.target && this.target.active) {
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    // Lerp angle
                    let diff = targetAngle - this.angle;
                    while (diff > 180) diff -= 360;
                    while (diff < -180) diff += 360;
                    
                    const maxTurn = this.turnSpeed * 180 / Math.PI * deltaTime; // Degrees per frame
                    
                    if (Math.abs(diff) < maxTurn) {
                        this.angle = targetAngle;
                    } else {
                        this.angle += Math.sign(diff) * maxTurn;
                    }
                    moveAngle = this.angle;
                }
                break;
        }

        // Move bullet based on angle
        // -90 degrees is up (standard canvas 0 is right)
        // Convert to radians: angle * Math.PI / 180
        const rad = moveAngle * Math.PI / 180;
        this.x += Math.cos(rad) * this.speed * deltaTime;
        this.y += Math.sin(rad) * this.speed * deltaTime;

        const bounds = this.config && this.config.bounds ? this.config.bounds : null;
        const minX = bounds && Number.isFinite(bounds.minX) ? bounds.minX : -100;
        const maxX = bounds && Number.isFinite(bounds.maxX) ? bounds.maxX : 820;
        const minY = bounds && Number.isFinite(bounds.minY) ? bounds.minY : -100;
        const maxY = bounds && Number.isFinite(bounds.maxY) ? bounds.maxY : 1400;

        if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle + 90) * Math.PI / 180); // Rotate sprite to match direction

        // Apply Visual Variant Modifier
        const variant = this.config.visualVariant || 0;
        // Variant 0: Default
        // Variant 1: Double Outline
        // Variant 2: Pulsing Size
        // Variant 3: Jagged / Glitch
        // Variant 4: Halo
        // Variant 5: Trailing particles (simulated by drawing history or just a tail)

        // Common glow settings (can be overridden)
        ctx.shadowBlur = 0;
        
        // Scale pulse for Variant 2
        if (variant === 2) {
            const scale = 1.0 + Math.sin(this.time * 15) * 0.2;
            ctx.scale(scale, scale);
        }

        if (this.shape === 'orb') {
            // High-energy Plasma Orb
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            
            // Variant 4: Halo
            if (variant === 4) {
                ctx.beginPath();
                ctx.arc(0, 0, this.width * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            // Radial Gradient
            const grad = ctx.createRadialGradient(0, 0, this.width * 0.2, 0, 0, this.width);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.width, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.shape === 'star') {
             // 4-point Star
             ctx.shadowBlur = 10;
             ctx.shadowColor = this.color;
             ctx.fillStyle = this.color;
             
             ctx.beginPath();
             for(let i=0; i<4; i++) {
                 ctx.rotate(Math.PI/2);
                 ctx.lineTo(this.width/4, 0);
                 ctx.lineTo(0, this.height/2);
                 ctx.lineTo(-this.width/4, 0);
             }
             ctx.fill();
             
             // Core
             ctx.fillStyle = '#fff';
             ctx.beginPath();
             ctx.arc(0,0, this.width/4, 0, Math.PI*2);
             ctx.fill();

        } else if (this.shape === 'ring') {
            // Energy Ring
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.width / 3;
            
            ctx.beginPath();
            ctx.arc(0, 0, this.width, 0, Math.PI * 2);
            ctx.stroke();
            
            if (variant === 1) { // Double ring
                ctx.beginPath();
                ctx.arc(0, 0, this.width * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }

        } else if (this.shape === 'cross') {
             // Energy Cross
             ctx.shadowBlur = 8;
             ctx.shadowColor = this.color;
             ctx.fillStyle = this.color;
             
             const w = this.width;
             const h = this.height;
             ctx.fillRect(-w/2, -h/6, w, h/3);
             ctx.fillRect(-w/6, -h/2, w/3, h);
             
             // Core highlight
             ctx.fillStyle = '#fff';
             ctx.fillRect(-w/8, -h/8, w/4, h/4);

        } else if (this.shape === 'circle') {
            // Solid Energy Ball
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(-this.width/6, -this.width/6, this.width/6, 0, Math.PI * 2);
            ctx.fill();
             
        } else if (this.shape === 'wave') {
            // Crescent Wave (Sonic/Light)
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            // Draw an arc
            ctx.arc(0, 0, this.width, Math.PI, 0); 
            ctx.stroke();
            
            // Inner faint arc
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.8, Math.PI * 0.9, Math.PI * 0.1);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

        } else if (this.shape === 'bolt') {
            // Lightning Bolt
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            
            // Jagged line
            let currY = -this.height/2;
            let currX = 0;
            const segments = 5;
            const segH = this.height / segments;
            
            for(let i=0; i<segments; i++) {
                currY += segH;
                currX = (Math.random() - 0.5) * this.width; // Jitter
                ctx.lineTo(currX, currY);
            }
            ctx.stroke();
            
            // White core (thinner)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

        } else if (this.shape === 'laser') {
            // Pulse Beam
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            
            // Core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-this.width/3, -this.height/2, this.width/1.5, this.height);
            
            // Outer Shell
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.6 + Math.sin(this.time * 20) * 0.2; // Pulsing
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
        } else if (this.shape === 'shard') {
            // Crystalline Projectile
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2); // Tip
            ctx.lineTo(this.width/2, -this.height/6);
            ctx.lineTo(this.width/3, this.height/2); // Tail right
            ctx.lineTo(0, this.height/3); // Tail center notch
            ctx.lineTo(-this.width/3, this.height/2); // Tail left
            ctx.lineTo(-this.width/2, -this.height/6);
            ctx.closePath();
            ctx.fill();
            
            // Facet highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            ctx.lineTo(this.width/2, -this.height/6);
            ctx.lineTo(0, 0);
            ctx.fill();
            
        } else if (this.shape === 'rocket') {
            // Detailed Missile
            // Fins
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(6, 15);
            ctx.lineTo(-6, 15);
            ctx.fill();
            
            // Body
            ctx.fillStyle = '#ccc';
            ctx.fillRect(-3, -10, 6, 20);
            
            // Warhead
            ctx.fillStyle = this.color; // Warhead matches damage type color
            ctx.beginPath();
            ctx.moveTo(-3, -10);
            ctx.lineTo(0, -18);
            ctx.lineTo(3, -10);
            ctx.fill();
            
            // Engine Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'orange';
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            const flameLen = 10 + Math.random() * 5;
            ctx.moveTo(-2, 10);
            ctx.lineTo(0, 10 + flameLen);
            ctx.lineTo(2, 10);
            ctx.fill();
            
        } else {
            // Default Capsule (Rect)
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            
            // Gradient Body
            const grad = ctx.createLinearGradient(-this.width/2, 0, this.width/2, 0);
            grad.addColorStop(0, this.color);
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(1, this.color);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, -this.height / 2 + this.width/2, this.width / 2, Math.PI, 0);
            ctx.lineTo(this.width / 2, this.height / 2 - this.width/2);
            ctx.arc(0, this.height / 2 - this.width/2, this.width / 2, 0, Math.PI);
            ctx.lineTo(-this.width / 2, -this.height / 2 + this.width/2);
            ctx.fill();
        }

        ctx.restore();
    }
}

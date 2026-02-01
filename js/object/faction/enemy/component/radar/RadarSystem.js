export default class RadarSystem {
    /**
     * @param {Object} config Configuration for the radar
     * @param {number} config.range Scan radius (default: 180)
     * @param {number} config.speed Rotation speed (default: 2.0)
     * @param {string} config.color Base color (hex) (default: #00ff66)
     * @param {string} config.type Visual style: 'ARRAY', 'DISH', 'BAR', 'DOME', 'SAUCER'
     */
    constructor(config = {}) {
        this.range = config.range || 180;
        this.speed = config.speed || 2.0;
        this.color = config.color || '#00ff66';
        this.type = config.type || 'ARRAY'; // Default to Phased Array
        
        // Parse color for RGBA
        this.rgb = this.hexToRgb(this.color) || {r: 0, g: 255, b: 100};

        this.angle = 0;
        this.pingTimer = 0;
        this.time = 0;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    update(dt) {
        this.time += dt;
        this.angle += this.speed * dt;
        
        this.pingTimer += dt;
        if (this.pingTimer > 2.0) this.pingTimer = 0;
    }

    render(ctx) {
        // 1. Static Mount (The Base)
        this.renderBase(ctx);

        // 2. Holographic Rings (Tech Upgrade)
        this.renderHoloBase(ctx);

        // 3. Rotating Assembly
        ctx.save();
        ctx.rotate(this.angle);

        const { r, g, b } = this.rgb;

        // A. Hologram Cone & Scan Effect
        this.renderScanEffect(ctx, r, g, b);

        // B. Physical Structure based on Type
        this.renderStructure(ctx);

        ctx.restore();

        // 4. Floating HUD / Data Particles (Tech Upgrade)
        this.renderTechOverlay(ctx);
    }

    renderBase(ctx) {
        // Detailed Mechanical Pedestal
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 15);
        grad.addColorStop(0, '#666');
        grad.addColorStop(0.5, '#333');
        grad.addColorStop(1, '#111');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Mounting Bolts
        ctx.fillStyle = '#888';
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const bx = Math.cos(angle) * 10;
            const by = Math.sin(angle) * 10;
            ctx.beginPath();
            ctx.arc(bx, by, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rim
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderHoloBase(ctx) {
        const { r, g, b } = this.rgb;
        const color = `rgba(${r}, ${g}, ${b}, 0.3)`;
        const t = this.time;

        ctx.save();
        
        // Ring 1: Counter-rotating segmented ring
        ctx.rotate(-t * 0.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 1.5); // 75% circle
        ctx.stroke();

        // Ring 2: Pulsing outer ring
        ctx.rotate(t * 0.8);
        const pulse = 24 + Math.sin(t * 3) * 2;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Digital notches
        for(let i=0; i<4; i++) {
            ctx.rotate(Math.PI/2);
            ctx.fillStyle = this.color;
            ctx.fillRect(pulse - 2, -2, 4, 4);
        }

        ctx.restore();
    }

    renderTechOverlay(ctx) {
        const { r, g, b } = this.rgb;
        
        // Floating "Data" Particles
        const count = 3;
        for (let i = 0; i < count; i++) {
            const offset = i * (Math.PI * 2 / count);
            const orbitR = 35 + Math.sin(this.time * 2 + i) * 5;
            const orbitA = this.time * 0.3 + offset;
            
            const x = Math.cos(orbitA) * orbitR;
            const y = Math.sin(orbitA) * orbitR;

            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x, y, 3, 3);
            
            // Trailing line
            ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.cos(orbitA)*10, y - Math.sin(orbitA)*10);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }

    renderScanEffect(ctx, r, g, b) {
        // High-Tech Digital Scan Cone
        
        let angleWidth = 0.4;
        if (this.type === 'DISH') { angleWidth = 0.12; } // Very narrow focused beam
        if (this.type === 'BAR') { angleWidth = 0.25; } // Narrow vertical fan
        if (this.type === 'SAUCER') { angleWidth = 0.6; } // Wide search beam

        const startAngle = -angleWidth;
        const endAngle = angleWidth;

        // 1. Soft Beam Gradient (Linear Gradient approximation for angular falloff)
        // We simulate a beam fading from center (y=0) to edges (y=+/- width)
        const beamW = this.range * Math.sin(angleWidth);
        const beamGrad = ctx.createLinearGradient(0, -beamW, 0, beamW);
        beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        beamGrad.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.05)`);
        beamGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`); // Bright core
        beamGrad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.05)`);
        beamGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.range, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // 2. Radial Distance Fade (Overlay to fade far edge)
        const rangeGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.range);
        rangeGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        rangeGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
        rangeGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = rangeGrad;
        ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.range, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // 3. Digital Grid Lines (The "Tech" part)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
        ctx.lineWidth = 1;
        
        // Arcs
        for(let d = 40; d < this.range; d += 40) {
            ctx.beginPath();
            ctx.arc(0, 0, d, startAngle, endAngle);
            ctx.stroke();
        }
        
        // Radial lines
        const rays = 3;
        for(let i=1; i<rays; i++) {
            const a = startAngle + (endAngle - startAngle) * (i/rays);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a)*this.range, Math.sin(a)*this.range);
            ctx.stroke();
        }

        // 4. Center Bore-Sight Line (Intense)
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.range, 0); 
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 5. Digital Ping (Circular Ripple Wave)
        if (this.pingTimer < 1.0) {
            const pingR = 30 + this.pingTimer * 120;
            const alpha = 1.0 - this.pingTimer;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(0, 0, pingR, 0, Math.PI * 2);
            ctx.stroke();

            // Echo Ripple (Second faint ring)
            if (this.pingTimer > 0.1) {
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(0, 0, pingR - 15, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    renderStructure(ctx) {
        switch (this.type) {
            case 'DISH':
                this.renderDish(ctx);
                break;
            case 'BAR':
                this.renderBar(ctx);
                break;
            case 'DOME':
                this.renderDome(ctx);
                break;
            case 'SAUCER':
                this.renderSaucer(ctx);
                break;
            case 'ARRAY':
            default:
                this.renderArray(ctx);
                break;
        }
    }

    // Type 1: Phased Array (Rectangular AESA)
    renderArray(ctx) {
        // Yoke / Mount Support
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(-12, -5); ctx.lineTo(-12, 5); ctx.lineTo(0, 0);
        ctx.fill();

        // Main Panel Body - Tech Dark
        const grad = ctx.createLinearGradient(-12, 0, 12, 0);
        grad.addColorStop(0, '#222');
        grad.addColorStop(0.5, '#444');
        grad.addColorStop(1, '#222');
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.moveTo(-8, -18);
        ctx.lineTo(12, -14);
        ctx.lineTo(12, 14);
        ctx.lineTo(-8, 18);
        ctx.closePath();
        ctx.fill();
        
        // Neon Edge
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Emitter Face (The active part)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-4, -14);
        ctx.lineTo(10, -11);
        ctx.lineTo(10, 11);
        ctx.lineTo(-4, 14);
        ctx.closePath();
        ctx.fill();

        // Emitter Grid Elements (Active Scanning Dots)
        ctx.fillStyle = this.color;
        const rows = 6;
        const cols = 4;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = -2 + c * 3;
                const y = -10 + r * 4 + (c * 0.5); 
                
                // Digital Rain Pattern
                const wave = Math.sin(this.time * 10 + c - r) > 0.5;
                if (wave) {
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(x, y, 1.5, 1.5); // Square pixels for tech feel
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }

    // Type 2: Parabolic Dish (Mesh/Grid style)
    renderDish(ctx) {
        // Counterweight
        ctx.fillStyle = '#222';
        ctx.fillRect(-14, -6, 8, 12);
        
        // Support Arm
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(16, 0);
        ctx.stroke();

        // The Dish
        const dishGrad = ctx.createLinearGradient(-5, 0, 5, 0);
        dishGrad.addColorStop(0, '#333');
        dishGrad.addColorStop(0.5, '#111');
        dishGrad.addColorStop(1, '#333');
        
        ctx.fillStyle = dishGrad;
        ctx.strokeStyle = this.color; // Tech glow edge
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(-6, -22);
        ctx.quadraticCurveTo(8, 0, -6, 22);
        ctx.lineTo(-10, 22);
        ctx.quadraticCurveTo(4, 0, -10, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Holographic Mesh
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=-20; i<=20; i+=5) {
            ctx.moveTo(-10, i); ctx.lineTo(10, i);
            ctx.moveTo(i/2, -22); ctx.lineTo(i/2, 22);
        }
        ctx.stroke();
        ctx.restore();

        // Feed Horn
        ctx.fillStyle = '#000';
        ctx.fillRect(14, -3, 6, 6);
        
        // Laser Emitter
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(17, 0, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Type 3: Rotating Bar (Slotted Waveguide)
    renderBar(ctx) {
        // Hub
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // The Bar
        const barLength = 60;
        const barWidth = 8;
        
        // High contrast tech look
        const grad = ctx.createLinearGradient(0, -barLength/2, 0, barLength/2);
        grad.addColorStop(0, '#444');
        grad.addColorStop(0.5, '#888');
        grad.addColorStop(1, '#444');

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.roundRect(-4, -barLength/2, barWidth, barLength, 2);
        ctx.fill();
        ctx.stroke();

        // Glowing Slots
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        const slotCount = 12;
        const spacing = barLength / slotCount;
        for (let i = 0; i < slotCount; i++) {
            const y = -barLength/2 + 4 + i * spacing;
            const xOffset = (i % 2 === 0) ? -1 : 1;
            // Running light effect
            if (Math.abs(y - Math.sin(this.time * 5) * 20) < 10) {
                ctx.fillRect(xOffset, y, 2, 3);
            }
        }
        ctx.shadowBlur = 0;

        // Center Cap
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI*2);
        ctx.fill();
    }

    // Type 4: Omni-Dome (Geodesic Radome)
    renderDome(ctx) {
        const r = 22;
        
        // Base rim
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.stroke();

        // Energy Shield Sphere
        const sphereGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, r);
        sphereGrad.addColorStop(0, '#444');
        sphereGrad.addColorStop(0.5, '#222');
        sphereGrad.addColorStop(1, '#000');
        
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fill();

        // Glowing Geodesic Lines
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + Math.sin(this.time * 3) * 0.2; // Pulsing
        
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r*0.4, 0, 0, Math.PI*2);
        ctx.ellipse(0, 0, r, r*0.8, 0, 0, Math.PI*2);
        ctx.moveTo(0, -r); ctx.quadraticCurveTo(r, 0, 0, r);
        ctx.moveTo(0, -r); ctx.quadraticCurveTo(-r, 0, 0, r);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Internal Scan Eye
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(14, 0, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    // Type 5: AWACS Saucer (Rotodome)
    renderSaucer(ctx) {
        // Struts
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(8, 0, 3, 0, Math.PI*2);
        ctx.arc(-4, 7, 3, 0, Math.PI*2);
        ctx.arc(-4, -7, 3, 0, Math.PI*2);
        ctx.fill();

        // Disc - Tech Material
        const grad = ctx.createLinearGradient(0, -26, 0, 26);
        grad.addColorStop(0, '#333');
        grad.addColorStop(0.5, '#555');
        grad.addColorStop(1, '#222');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing Rim
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Rotating Black Stripe
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.rect(-12, -4, 24, 8);
        ctx.fill();

        // Center Data Node
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI*2);
        ctx.fill();

        // Navigation Lights (Strobe)
        const blink = Math.floor(this.time * 10) % 2 === 0;
        if (blink) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            ctx.beginPath(); 
            ctx.arc(0, -26, 2, 0, Math.PI*2);
            ctx.arc(0, 26, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}
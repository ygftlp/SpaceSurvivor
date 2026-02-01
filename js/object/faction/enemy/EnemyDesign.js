/**
 * Enemy Design Renderer
 * Handles procedural rendering of enemy parts based on a genome/config.
 */
export default class EnemyDesign {
    
    /**
     * Renders a procedural enemy based on its genome.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} genome - The genetic configuration (shapes, colors, parts)
     * @param {number} width - Total width
     * @param {number} height - Total height
     * @param {number} time - Animation time
     */
    static render(ctx, genome, width, height, time) {
        const w = width / 2;
        const h = height / 2;

        // Extract colors
        const colors = genome.colors || { primary: genome.color || '#999', secondary: '#555', glow: '#ff0' };
        
        // 1. Wings (Bottom Layer)
        if (genome.wings) {
            this.renderWings(ctx, genome.wings, w, h, colors);
        }

        // 2. Main Body (Fuselage)
        if (genome.body) {
            this.renderBody(ctx, genome.body, w, h, colors);
        }
        
        // 2.5 Wing Connectors (if wings exist) - Helps prevent floating wings
        if (genome.wings && genome.body) {
             ctx.fillStyle = colors.primary;
             ctx.fillRect(-w/3, -5, w*2/3, 10); // Central spar
        }

        // 3. Cockpit / Sensor Head
        if (genome.cockpit) {
            this.renderCockpit(ctx, genome.cockpit, h, colors);
        }

        // 4. Engines / Thrusters
        if (genome.engines) {
            this.renderEngines(ctx, genome.engines, w, h, time, colors);
        }

        // 5. Decals / Markings
        if (genome.markings) {
            this.renderMarkings(ctx, genome.markings, w, h, colors);
        }
    }

    static renderBody(ctx, body, w, h, colors) {
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        
        // Apply Modifiers
        const wm = body.widthMod || 1;
        const lm = body.lengthMod || 1;
        const cm = body.cornerMod || 0; // corner radius approximation
        
        const bw = w * wm; // Body half-width
        const bh = h * lm; // Body half-height

        switch (body.type) {
            case 'NEEDLE':
                ctx.moveTo(0, bh); 
                ctx.lineTo(bw/4, -bh); 
                ctx.lineTo(-bw/4, -bh);
                break;
            case 'BULK':
                ctx.moveTo(0, bh);
                ctx.lineTo(bw/2, bh/3);
                ctx.lineTo(bw/2, -bh);
                ctx.lineTo(-bw/2, -bh);
                ctx.lineTo(-bw/2, bh/3);
                break;
            case 'ROUND':
                ctx.ellipse(0, 0, bw/2, bh, 0, 0, Math.PI*2);
                break;
            case 'INSECT':
                // Segmented look
                ctx.ellipse(0, bh/2, bw/3, bh/3, 0, 0, Math.PI*2); // Head
                ctx.ellipse(0, 0, bw/2, bh/3, 0, 0, Math.PI*2); // Thorax
                ctx.ellipse(0, -bh/2, bw/4, bh/2, 0, 0, Math.PI*2); // Abdomen
                break;
            case 'DIAMOND':
                ctx.moveTo(0, bh);
                ctx.lineTo(bw, 0);
                ctx.lineTo(0, -bh);
                ctx.lineTo(-bw, 0);
                break;
            case 'STANDARD':
            default:
                ctx.moveTo(0, bh); 
                ctx.lineTo(bw/3, 0); 
                ctx.lineTo(bw/3, -bh); 
                ctx.lineTo(-bw/3, -bh);
                ctx.lineTo(-bw/3, 0);
                break;
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner shadow for depth
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Secondary detail
        ctx.fillStyle = colors.secondary;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, bw/4, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    static renderWings(ctx, wings, w, h, colors) {
        ctx.fillStyle = colors.secondary; // Wings often secondary color
        
        // Modifiers
        const span = (wings.spanMod || 1) * w;
        const sweep = wings.sweepMod || 0; // Angle offset in pixels approx
        const yOff = wings.yOffset || 0;

        ctx.save();
        ctx.translate(0, yOff);

        ctx.beginPath();
        switch (wings.type) {
            case 'DELTA':
                ctx.moveTo(0, h/2);
                ctx.lineTo(span, -h + sweep);
                ctx.lineTo(-span, -h + sweep);
                break;
            case 'FORWARD_SWEPT':
                ctx.moveTo(0, -h/2);
                ctx.lineTo(span, h/2 + sweep);
                ctx.lineTo(span-10, h/2-10 + sweep);
                ctx.lineTo(10, -h);
                ctx.lineTo(-10, -h);
                ctx.lineTo(-(span-10), h/2-10 + sweep);
                ctx.lineTo(-span, h/2 + sweep);
                break;
            case 'X_WING':
                // Top pair
                ctx.moveTo(5, 0); ctx.lineTo(span, -h + sweep); ctx.lineTo(span-10, -h + sweep); ctx.lineTo(5, -h/4);
                // Bottom pair
                ctx.moveTo(5, 0); ctx.lineTo(span, h/2 + sweep); ctx.lineTo(span-10, h/2 + sweep); ctx.lineTo(5, h/4);
                // Mirror
                ctx.moveTo(-5, 0); ctx.lineTo(-span, -h + sweep); ctx.lineTo(-(span-10), -h + sweep); ctx.lineTo(-5, -h/4);
                ctx.moveTo(-5, 0); ctx.lineTo(-span, h/2 + sweep); ctx.lineTo(-(span-10), h/2 + sweep); ctx.lineTo(-5, h/4);
                break;
            case 'BOX':
                 ctx.rect(-span, -h/2, 2*span, h/2);
                 break;
            case 'V_WING':
                ctx.moveTo(0, 0);
                ctx.lineTo(span, -h/2 + sweep);
                ctx.lineTo(span, -h/2 + sweep + 20);
                ctx.lineTo(0, 20);
                ctx.moveTo(0, 0);
                ctx.lineTo(-span, -h/2 + sweep);
                ctx.lineTo(-span, -h/2 + sweep + 20);
                ctx.lineTo(0, 20);
                break;
            case 'RING':
                ctx.arc(0, 0, span, 0, Math.PI*2);
                ctx.closePath();
                ctx.moveTo(span-10, 0);
                ctx.arc(0, 0, span-10, 0, Math.PI*2, true);
                break;
            case 'NONE':
                ctx.restore();
                return;
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    static renderCockpit(ctx, cockpit, h, colors) {
        ctx.save();
        ctx.fillStyle = colors.glow; // Use glow color for cockpit glass often
        
        // Modifiers
        const size = cockpit.sizeMod || 1;
        
        ctx.beginPath();
        switch (cockpit.type) {
            case 'BUBBLE':
                ctx.arc(0, 0, 5 * size, 0, Math.PI*2);
                break;
            case 'SLIT':
                ctx.rect(-8 * size, 10, 16 * size, 3 * size);
                break;
            case 'TRIANGLE':
                ctx.moveTo(0, 20 * size); ctx.lineTo(5 * size, 10); ctx.lineTo(-5 * size, 10);
                break;
            case 'RED_EYE':
                ctx.fillStyle = '#ff0000';
                ctx.arc(0, 0, 4 * size, 0, Math.PI*2);
                ctx.shadowColor = '#f00';
                ctx.shadowBlur = 10;
                break;
            case 'DOME':
                ctx.arc(0, 5, 8 * size, Math.PI, 0);
                break;
            default:
                ctx.arc(0, 5, 4 * size, 0, Math.PI*2);
        }
        ctx.fill();
        
        // Glint
        if (cockpit.type !== 'RED_EYE') {
            ctx.shadowBlur = 0; // Reset just in case
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(-2, 2, 2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    static renderEngines(ctx, engines, w, h, time, colors) {
        // Adjust spread based on body width implicitly (visual fix)
        // If we had body info here we could be smarter, but for now let's clamp it visually
        const spread = Math.min(Math.max(engines.spreadMod || 1, 0.6), 1.4);
        
        // 1. Draw Exhaust Flames (Behind the engines)
        ctx.save();
        // Determine flame color - typically cyan/blue or orange/red depending on the ship
        // We use the glow color or default to cyan/orange
        const isRedish = colors.primary.includes('hsl(0') || colors.primary.includes('hsl(3') || colors.primary.includes('hsl(1');
        const flameBase = isRedish ? '255, 100, 50' : '50, 200, 255';
        
        // Loop for flame drawing
        switch(engines.type) {
            case 'SINGLE':
                this.drawExhaust(ctx, 0, -h + 2, 8, 25, time, flameBase);
                break;
            case 'TWIN':
                this.drawExhaust(ctx, -10 * spread, -h + 2, 6, 20, time, flameBase);
                this.drawExhaust(ctx, 10 * spread, -h + 2, 6, 20, time, flameBase);
                break;
            case 'QUAD':
                 [-15, -5, 5, 15].forEach((x, i) => {
                    const len = (i === 1 || i === 2) ? 25 : 15; // Inner flames longer
                    this.drawExhaust(ctx, x * spread, -h, 4, len, time, flameBase);
                 });
                 break;
            case 'TRIPLE':
                this.drawExhaust(ctx, 0, -h, 7, 28, time, flameBase);
                this.drawExhaust(ctx, -12 * spread, -h + 5, 4, 15, time, flameBase);
                this.drawExhaust(ctx, 12 * spread, -h + 5, 4, 15, time, flameBase);
                break;
            case 'RING_DRIVE':
                 // Ring exhaust is different, maybe multiple small jets
                 for(let i=0; i<3; i++) {
                     this.drawExhaust(ctx, -5 + i*5, -h, 4, 15, time, flameBase);
                 }
                break;
        }
        ctx.restore();

        // 2. Draw Engine Nozzles (Physical parts)
        const pulse = Math.sin(time * 15) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 100, 50, ${pulse})`; // Default core glow
        if (!isRedish) ctx.fillStyle = `rgba(50, 200, 255, ${pulse})`;

        switch(engines.type) {
            case 'SINGLE':
                this.drawThruster(ctx, 0, -h + 2, 6);
                break;
            case 'TWIN':
                this.drawThruster(ctx, -10 * spread, -h + 2, 4);
                this.drawThruster(ctx, 10 * spread, -h + 2, 4);
                break;
            case 'QUAD':
                 [-15, -5, 5, 15].forEach(x => {
                    this.drawThruster(ctx, x * spread, -h, 3);
                 });
                 break;
            case 'TRIPLE':
                this.drawThruster(ctx, 0, -h, 5);
                this.drawThruster(ctx, -12 * spread, -h + 5, 3);
                this.drawThruster(ctx, 12 * spread, -h + 5, 3);
                break;
            case 'RING_DRIVE':
                ctx.beginPath();
                ctx.arc(0, -h, 10 * spread, 0, Math.PI*2);
                ctx.lineWidth = 3;
                ctx.strokeStyle = `rgba(50, 200, 255, ${pulse})`;
                ctx.stroke();
                break;
        }
    }

    static drawThruster(ctx, x, y, size) {
        ctx.beginPath(); 
        ctx.arc(x, y, size, 0, Math.PI*2); 
        ctx.fill();
        // Rim
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    static drawExhaust(ctx, x, y, width, length, time, colorBase) {
        // Random flicker
        // We use a deterministic pseudo-random based on time for smooth-ish jitter
        const flicker = Math.sin(time * 40) * 0.2 + 0.8;
        const len = length * flicker;
        const w = width * (0.8 + Math.sin(time * 50)*0.2);

        // Gradient for flame
        // Flame points UP (negative Y) because enemy faces DOWN (positive Y) but its back is at negative Y.
        // Wait, if nose is (0, h) and tail is (0, -h).
        // Exhaust should go from -h further negative.
        
        const grad = ctx.createLinearGradient(x, y, x, y - len);
        grad.addColorStop(0, `rgba(${colorBase}, 0.8)`);
        grad.addColorStop(1, `rgba(${colorBase}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x - w/2, y);
        ctx.quadraticCurveTo(x, y - len, x + w/2, y);
        ctx.fill();
        
        // Inner white core
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(x - w/4, y);
        ctx.quadraticCurveTo(x, y - len * 0.6, x + w/4, y);
        ctx.fill();
    }

    static renderMarkings(ctx, markings, w, h, colors) {
        ctx.fillStyle = colors.secondary;
        ctx.globalAlpha = 0.5;
        
        const d = markings.density || 0.5;

        if (markings.type === 'STRIPES') {
            ctx.fillRect(-w/2, -h/2, w, 2);
            ctx.fillRect(-w/2, -h/2 + 5/d, w, 2);
        } else if (markings.type === 'CHEVRON') {
            ctx.beginPath();
            ctx.moveTo(0, h/2); ctx.lineTo(10, h/2 - 10); ctx.lineTo(-10, h/2 - 10);
            ctx.fill();
        } else if (markings.type === 'CAMO') {
            ctx.beginPath();
            ctx.arc(-w/3, 0, 5*d, 0, Math.PI*2);
            ctx.arc(w/3, h/3, 7*d, 0, Math.PI*2);
            ctx.fill();
        } else if (markings.type === 'CIRCUIT') {
            ctx.strokeStyle = colors.glow;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-5, 0); ctx.lineTo(-15, 0); ctx.lineTo(-15, 10);
            ctx.moveTo(5, 0); ctx.lineTo(15, 0); ctx.lineTo(15, -10);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
    }
}

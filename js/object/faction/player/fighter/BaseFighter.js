/**
 * Base Fighter Class
 * Defines common attributes and methods for all fighters.
 */
export default class BaseFighter {
    constructor() {
        this.name = 'Unknown';
        this.desc = 'Unknown Fighter';
        this.hp = 100;
        this.speed = 10;
        this.damage = 10; // Base Firepower
        this.width = 60;
        this.height = 60;
        this.time = 0; // For animation
        this.particles = []; // Particle system for exhaust
        this.engineOffsets = []; // Define in subclass: [{x, y}, ...]
        this.thrustColor = '#00f0ff'; // Default thrust color
        this.mainColor = null; // Custom user color
        this.equipment = []; // Array of equipped items

        // Equipment Slots (One item per slot)
        this.slots = {
            weapon: null,
            radar: null,
            skin: null,
            engine: null,
            armor: null
        };

        // Hardpoints for Weapons [{x, y, type: 'wing'|'bay'}]
        this.hardpoints = [];
    }

    /**
     * Interface: Set Main Color
     * @param {String} color Hex color
     */
    setColor(color) {
        this.setMainColor(color);
    }

    /**
     * Interface: Set Weapon
     * Replaces existing weapon
     * @param {Object} weapon Weapon item
     */
    setWeapon(weapon) {
        if (this.slots.weapon) {
            this.unequip(this.slots.weapon);
        }
        this.slots.weapon = weapon;
        if (weapon) this.equip(weapon);
    }

    /**
     * Interface: Set Radar
     * Replaces existing radar
     * @param {Object} radar Radar item
     */
    setRadar(radar) {
        if (this.slots.radar) {
            this.unequip(this.slots.radar);
        }
        this.slots.radar = radar;
        if (radar) this.equip(radar);
    }

    /**
     * Interface: Set Skin/Appearance
     * Replaces existing skin
     * @param {Object} skin Skin item
     */
    setSkin(skin) {
        if (this.slots.skin) {
            this.unequip(this.slots.skin);
        }
        this.slots.skin = skin;
        if (skin) this.equip(skin);
    }

    /**
     * Interface: Set Engine
     * Replaces existing engine
     * @param {Object} engine Engine item
     */
    setEngine(engine) {
        if (this.slots.engine) {
            this.unequip(this.slots.engine);
        }
        this.slots.engine = engine;
        if (engine) {
            this.equip(engine);
            // Apply visual effects if present
            if (engine.thrustColor) {
                this.thrustColor = engine.thrustColor;
            }
        }
    }

    /**
     * Interface: Set Armor
     * Replaces existing armor
     * @param {Object} armor Armor item
     */
    setArmor(armor) {
        if (this.slots.armor) {
            this.unequip(this.slots.armor);
        }
        this.slots.armor = armor;
        if (armor) this.equip(armor);
    }

    /**
     * Get current weapon
     */
    getWeapon() { return this.slots.weapon; }

    /**
     * Get current radar
     */
    getRadar() { return this.slots.radar; }

    /**
     * Equip an item to the fighter (Internal / Additive)
     * @param {Object} item Equipment item {id, name, type, stats: {hp, speed, damage}, render: function(ctx, fighter)}
     */
    equip(item) {
        // Prevent duplicates in list
        if (this.equipment.includes(item)) return;

        this.equipment.push(item);
        if (item.stats) {
            if (item.stats.hp) this.hp += item.stats.hp;
            if (item.stats.speed) this.speed += item.stats.speed;
            if (item.stats.damage) this.damage += item.stats.damage;
        }
        console.log(`${this.name} equipped ${item.name}`);
    }

    /**
     * Unequip an item
     * @param {Object} item The item object to remove
     */
    unequip(item) {
        const index = this.equipment.indexOf(item);
        if (index > -1) {
            this.equipment.splice(index, 1);
            if (item.stats) {
                if (item.stats.hp) this.hp -= item.stats.hp;
                if (item.stats.speed) this.speed -= item.stats.speed;
                if (item.stats.damage) this.damage -= item.stats.damage;
            }
        }
    }

    /**
     * Render only skin/paint equipment
     * Should be called AFTER drawing the body but BEFORE drawing the cockpit
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderSkins(ctx) {
        this.equipment.forEach(item => {
            if (item.type === 'skin' && item.render && typeof item.render === 'function') {
                ctx.save();
                item.render(ctx, this);
                ctx.restore();
            }
        });
    }

    /**
     * Render non-skin equipment (Weapons, etc.)
     * Should be called at the end of rendering
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderDevices(ctx) {
        this.equipment.forEach(item => {
            if (item.type !== 'skin' && item.render && typeof item.render === 'function') {
                ctx.save();
                item.render(ctx, this);
                ctx.restore();
            }
        });
    }

    /**
     * Render all equipped items (Legacy wrapper)
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderEquipment(ctx) {
        this.renderSkins(ctx);
        this.renderDevices(ctx);
    }

    /**
     * Set the main color of the fighter
     * @param {String} color Hex color string
     */
    setMainColor(color) {
        this.mainColor = color;
    }

    /**
     * Adjust color brightness
     * @param {String} hex Hex color
     * @param {Number} amount Additive amount (-255 to 255)
     */
    adjustColor(hex, amount) {
        const clamp = (val) => Math.min(Math.max(val, 0), 255);
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        const r = clamp((num >> 16) + amount);
        const g = clamp(((num >> 8) & 0x00FF) + amount);
        const b = clamp((num & 0x0000FF) + amount);
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }

    /**
     * Update fighter state (animations, cooldowns)
     * @param {Number} dt Delta time in seconds
     */
    update(dt) {
        this.time += dt;

        // Emit engine particles
        if (this.engineOffsets && this.engineOffsets.length > 0) {
            // Rate limiter or random chance to prevent too many particles
            if (Math.random() < 0.3) {
                this.engineOffsets.forEach(offset => {
                    this.addParticle(offset.x, offset.y + 10, this.thrustColor);
                });
            }
        }

        this.updateParticles(dt);
    }

    addParticle(x, y, color) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: 60 + Math.random() * 40, // Move down (exhaust trail)
            life: 0.4 + Math.random() * 0.2,
            maxLife: 0.6,
            color: color,
            size: Math.random() * 2 + 1
        });
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt; // Move down relative to ship
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderParticles(ctx) {
        ctx.save();
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    /**
     * Apply common shadow/glow effects
     * @param {CanvasRenderingContext2D} ctx 
     */
    configureShadow(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
    }

    /**
     * Render the fighter on the given context.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Number} size Display size (optional override)
     */
    render(ctx, size) {
        // Override in subclasses
    }

    /**
     * Apply a hovering motion transformation
     * @param {CanvasRenderingContext2D} ctx 
     */
    applyHover(ctx) {
        const hoverY = Math.sin(this.time * 2) * 5;
        ctx.translate(0, hoverY);
    }

    /**
     * Render Engine Thruster Effect
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Number} x Center X
     * @param {Number} y Center Y (Top of flame)
     * @param {String} color Core color
     */
    renderThruster(ctx, x, y, color = '#00f0ff') {
        const t = this.time * 10;
        const flutter = Math.sin(t) * 0.2 + 0.8; // 0.8 ~ 1.0
        const length = 40 * flutter;

        ctx.save();
        ctx.translate(x, y);

        // Outer Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;

        // Core Flame
        const grad = ctx.createLinearGradient(0, 0, 0, length);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.3, color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.quadraticCurveTo(0, length, 5, 0);
        ctx.fill();

        // Inner White Hot
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(0, length * 0.3);
        ctx.lineTo(2, 0);
        ctx.fill();

        // --- Shock Diamonds (Mach Disks) ---
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#FFF';
        for (let i = 1; i <= 3; i++) {
            const dy = length * 0.25 * i;
            const size = (4 - i) * 1.5;
            ctx.beginPath();
            ctx.ellipse(0, dy, size, size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Render Navigation Lights (Red/Green/Strobe)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} pos {left: {x,y}, right: {x,y}, tail: {x,y}}
     */
    renderNavLights(ctx, pos) {
        const t = this.time;

        // Blink pattern: Pulse slowly instead of hard blink
        // 0.5 to 1.0 intensity
        const intensity = (Math.sin(t * 3) + 1) / 2 * 0.5 + 0.5;
        const strobe = Math.floor(t * 5) % 8 === 0; // Less frequent strobe

        ctx.save();
        ctx.shadowBlur = 2; // Reduced blur

        // Left Wing (Symmetric Cyan)
        if (pos.left) {
            ctx.shadowColor = `rgba(0, 255, 255, ${intensity})`;
            ctx.fillStyle = `rgba(0, 255, 255, ${intensity})`;
            ctx.beginPath(); ctx.arc(pos.left.x, pos.left.y, 1.5, 0, Math.PI * 2); ctx.fill();
        }

        // Right Wing (Symmetric Cyan)
        if (pos.right) {
            ctx.shadowColor = `rgba(0, 255, 255, ${intensity})`;
            ctx.fillStyle = `rgba(0, 255, 255, ${intensity})`;
            ctx.beginPath(); ctx.arc(pos.right.x, pos.right.y, 1.5, 0, Math.PI * 2); ctx.fill();
        }

        // Tail/Strobe (White) - Short Flash
        if (pos.tail && strobe) {
            ctx.shadowColor = '#FFFFFF';
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.arc(pos.tail.x, pos.tail.y, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Render RCS (Reaction Control System) Thrusters
     * Simulates small gas bursts for zero-G stabilization
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} positions Array of {x, y, angle} objects
     */
    renderRCS(ctx, positions) {
        // Randomly fire RCS thrusters to simulate stabilization
        if (Math.random() > 0.15) return;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FFFFFF';

        positions.forEach(pos => {
            if (Math.random() < 0.3) { // Independent firing chance
                const size = Math.random() * 3 + 2;
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle || 0);

                // Gas Puff Shape
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-size / 2, size, 0, size * 1.5);
                ctx.quadraticCurveTo(size / 2, size, 0, 0);
                ctx.fill();
                ctx.restore();
            }
        });
        ctx.restore();
    }

    /**
     * Get equipment slots configuration
     */
    getSlots() {
        return ['mainWeapon', 'armor', 'wingman', 'radar'];
    }
}

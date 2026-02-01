
import FighterFactory from './js/object/faction/player/fighter/FighterFactory.js';
import EquipmentFactory from './js/object/faction/player/equipment/EquipmentFactory.js';

// Mock Canvas Context
class MockCtx {
    constructor() {
        this.stack = [];
        this.props = {};
    }
    save() { this.stack.push({...this.props}); }
    restore() { 
        if(this.stack.length > 0) this.props = this.stack.pop(); 
    }
    scale() {}
    translate() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    fill() {}
    stroke() {}
    clip() {}
    createLinearGradient() { return { addColorStop: () => {} }; }
    createRadialGradient() { return { addColorStop: () => {} }; }
    fillRect() {}
    arc() {}
    ellipse() {}
    quadraticCurveTo() {}
    bezierCurveTo() {}
    closePath() {}
    strokeRect() {}
    clearRect() {}
    set globalCompositeOperation(v) {}
    set shadowBlur(v) {}
    set shadowColor(v) {}
    set fillStyle(v) {}
    set strokeStyle(v) {}
    set lineWidth(v) {}
    set lineJoin(v) {}
    set miterLimit(v) {}
    set globalAlpha(v) {}
    set font(v) {}
    set textAlign(v) {}
    fillText() {}
}

const ctx = new MockCtx();

console.log("Starting Render Test...");

try {
    const fighters = ['F-16', 'J-20', 'F-22', 'Su-57'];
    
    fighters.forEach(id => {
        console.log(`Creating ${id}...`);
        const fighter = FighterFactory.createFighter(id);
        
        // Add some equipment to match preview.html
        if (id === 'F-16') {
            fighter.setSkin(EquipmentFactory.create('skin_camo_jungle'));
            fighter.setWeapon(EquipmentFactory.create('missile_sidewinder'));
        } else if (id === 'J-20') {
            fighter.setSkin(EquipmentFactory.create('skin_gold_elite'));
            fighter.setWeapon(EquipmentFactory.create('weapon_meteor'));
        } else if (id === 'F-22') {
            fighter.setSkin(EquipmentFactory.create('skin_arctic'));
            fighter.setWeapon(EquipmentFactory.create('missile_aim120'));
        } else if (id === 'Su-57') {
            fighter.setSkin(EquipmentFactory.create('skin_digital_desert'));
            fighter.setWeapon(EquipmentFactory.create('missile_sidewinder'));
        }

        console.log(`Rendering ${id}...`);
        fighter.render(ctx, 140);
        console.log(`${id} Rendered Successfully.`);
    });

} catch (e) {
    console.error("CRASHED:", e);
}

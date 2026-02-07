
import J20 from './js/object/faction/player/fighter/J20.js';
import EquipmentFactory from './js/object/faction/player/equipment/EquipmentFactory.js';

// Mock Canvas Context
class MockContext {
    save() {}
    restore() {}
    scale() {}
    translate() {}
    rotate() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    quadraticCurveTo() {}
    bezierCurveTo() {}
    arc() {}
    ellipse() {}
    rect() {}
    fillRect() {}
    strokeRect() {}
    fill() {}
    stroke() {}
    clip() {}
    closePath() {}
    createLinearGradient() {
        return { addColorStop: () => {} };
    }
    createRadialGradient() {
        return { addColorStop: () => {} };
    }
}

try {
    console.log("Instantiating J20...");
    const j20 = new J20();
    console.log("J20 instantiated.");

    console.log("Equipping J20...");
    j20.setSkin(EquipmentFactory.create('skin_gold_elite'));
    j20.setWeapon(EquipmentFactory.create('weapon_meteor'));
    j20.setEngine(EquipmentFactory.create('engine_plasma'));
    console.log("J20 equipped.");

    console.log("Rendering J20...");
    const ctx = new MockContext();
    j20.render(ctx, 200);
    console.log("J20 rendered successfully.");
} catch (error) {
    console.error("CRASHED:", error);
}

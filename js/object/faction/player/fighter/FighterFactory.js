import J20 from './J20.js';
import F22 from './F22.js';
import Su57 from './Su57.js';
import F16 from './F16.js';

export default class FighterFactory {
    static createFighter(id) {
        switch (id) {
            case 'F-16': return new F16();
            case 'J-20': return new J20();
            case 'F-22': return new F22();
            case 'Su-57': return new Su57();
            default: return new F16();
        }
    }

    static getFighterInfo(id) {
        const fighter = this.createFighter(id);
        return {
            name: fighter.name,
            desc: fighter.desc,
            hp: fighter.hp,
            speed: fighter.speed,
            unlockCost: fighter.unlockCost
        };
    }

    static getAllFighters() {
        return ['F-16', 'J-20', 'F-22', 'Su-57'];
    }
}

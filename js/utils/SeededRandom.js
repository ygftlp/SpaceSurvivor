/**
 * Seeded Random Generator
 * Provides deterministic random numbers based on a seed.
 */
export default class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     */
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    /**
     * Returns a pseudo-random number between min (inclusive) and max (exclusive).
     */
    range(min, max) {
        return min + this.next() * (max - min);
    }

    /**
     * Returns a pseudo-random integer between min (inclusive) and max (inclusive).
     */
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    /**
     * Returns a random element from an array.
     */
    choice(array) {
        return array[this.int(0, array.length - 1)];
    }
}

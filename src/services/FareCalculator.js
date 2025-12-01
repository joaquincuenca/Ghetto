export class FareCalculator {
    constructor(baseFare = 50, baseKm = 3, extraRate = 15) {
        this.baseFare = baseFare;
        this.baseKm = baseKm;
        this.extraRate = extraRate;
    }

    calculate(distance) {
        if (!distance) return 0;
        return distance <= this.baseKm
        ? this.baseFare
        : this.baseFare + (distance - this.baseKm) * this.extraRate;
    }

    getBreakdown(distance) {
        const baseFareAmount = this.baseFare;
        const extraDistance = Math.max(0, distance - this.baseKm);
        const extraFareAmount = extraDistance * this.extraRate;
        const total = baseFareAmount + extraFareAmount;

        return {
        baseFare: baseFareAmount,
        extraDistance,
        extraFare: extraFareAmount,
        total
        };
    }
}
/**
 * An amount of Philippine money. It is kept as whole centavos, the unit the
 * database stores, and the Operator enters and reads it in pesos.
 */
export default class Money {
  constructor(readonly centavos: number) {
    if (!Number.isInteger(centavos)) {
      throw new RangeError(`Money must be a whole number of centavos, got ${centavos}`)
    }
  }

  static fromPesos(pesos: number) {
    return new Money(Math.round(pesos * 100))
  }

  get pesos() {
    return this.centavos / 100
  }

  /** The amount as the Operator and Customers read it, such as `₱5` or `₱2.50`. */
  format() {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: this.centavos % 100 === 0 ? 0 : 2,
    }).format(this.pesos)
  }
}

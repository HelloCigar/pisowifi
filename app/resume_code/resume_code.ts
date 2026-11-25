import string from '@adonisjs/core/helpers/string'

/**
 * The short code that belongs to one Credit for its whole life. It has six
 * characters from an alphabet with no look-alike characters (no 0/O, 1/I/L),
 * and Customers read it as `XXX-XXX`.
 */
export default class ResumeCode {
  static alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  static length = 6

  constructor(readonly value: string) {
    const valid =
      value.length === ResumeCode.length &&
      [...value].every((character) => ResumeCode.alphabet.includes(character))
    if (!valid) {
      throw new RangeError(
        `A Resume Code is ${ResumeCode.length} characters from ${ResumeCode.alphabet}`
      )
    }
  }

  /**
   * A new random code. Each character is drawn evenly from the alphabet: the
   * random string's characters are uniform, and the ones outside the alphabet
   * are dropped rather than mapped.
   */
  static generate() {
    let code = ''
    while (code.length < ResumeCode.length) {
      code += [...string.random(32)]
        .filter((character) => ResumeCode.alphabet.includes(character))
        .join('')
    }
    return new ResumeCode(code.slice(0, ResumeCode.length))
  }

  /** The code as Customers read and write it down, such as `K7P-Q2M`. */
  format() {
    return `${this.value.slice(0, 3)}-${this.value.slice(3)}`
  }
}

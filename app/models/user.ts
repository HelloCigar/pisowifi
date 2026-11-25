import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * The Operator's account. A Machine has one Operator, whom the setup wizard
 * creates.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /**
   * Whether the Machine has its Operator. The setup wizard closes for good
   * once it does.
   *
   * Global on purpose: one Machine has one Operator.
   */
  static async operatorExists(options?: { client: TransactionClientContract }) {
    const operator = await this.query(options).select('id').first()
    return operator !== null
  }

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    return `${first.slice(0, 2)}`.toUpperCase()
  }
}

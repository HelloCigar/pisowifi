/**
 * The states of a Credit, stored as a tinyint.
 */
export const CreditState = {
  Counting: 0,
  Paused: 1,
  Suspended: 2,
  Ended: 3,
} as const

export type CreditState = (typeof CreditState)[keyof typeof CreditState]

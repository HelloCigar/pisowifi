/** The languages of the portal. Filipino is the default. */
export const PortalLanguage = {
  Filipino: 'fil',
  English: 'en',
} as const

export type PortalLanguage = (typeof PortalLanguage)[keyof typeof PortalLanguage]

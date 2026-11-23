/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { VineDate, SimpleMessagesProvider } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Field names as the Operator reads them, and the messages VineJS has no
 * readable default for.
 */
// flow-allow validation.md: the defaults name the payload key, such as "The rateTiers field has
// duplicate values", and issue #6 asks for a clear error when two Rate Tiers share a price.
vine.messagesProvider = new SimpleMessagesProvider(
  {
    'rateTiers.distinct': 'Two Rate Tiers cannot have the same price',
    'rateTiers.notEmpty': 'Add at least one Rate Tier',
    'price.database.unique': 'Another Rate Tier already has this price',
  },
  {
    hotspotName: 'hotspot name',
    passwordConfirmation: 'password confirmation',
  }
)

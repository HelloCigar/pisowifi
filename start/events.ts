/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
|
| Listeners of the application's events, registered once.
|
*/

import emitter from '@adonisjs/core/services/emitter'
import { events } from '#generated/events'
import { listeners } from '#generated/listeners'

emitter.on(events.DeviceCameOnline, [listeners.RecordDeviceSighting])

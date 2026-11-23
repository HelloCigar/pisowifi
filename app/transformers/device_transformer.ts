import type Device from '#models/device'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DeviceTransformer extends BaseTransformer<Device> {
  toObject() {
    return this.pick(this.resource, ['macAddress'])
  }
}

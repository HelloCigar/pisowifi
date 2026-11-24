import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Money from '#money/money'
import RateCard from '#rate_card/rate_card'
import Coin from '#models/coin'
import Credit from '#models/credit'
import Device from '#models/device'
import Setting from '#models/setting'
import RateTier from '#models/rate_tier'
import CoinWindow from '#models/coin_window'
import HelperClient from '#services/helper_client'
import CoinAcceptorBusyException from '#exceptions/coin_acceptor_busy_exception'
import MachineNotReadyException from '#exceptions/machine_not_ready_exception'

/**
 * A Coin Window's life: a Device takes the Coin Acceptor, coins extend the
 * window, and closing it turns its coins into one Top-up on the Device's
 * Credit and lets the Device online.
 *
 * The Coin Acceptor's inhibit line follows the window: off while a window
 * is open, on otherwise, so a coin can only be credited to the Device that
 * holds the window.
 */
@inject()
export default class CoinWindowService {
  constructor(protected helper: HelperClient) {}

  /**
   * Gives the Coin Acceptor to the Device. A Device that already holds it
   * keeps its window.
   */
  async open(device: Device) {
    const settings = await this.#settings()
    // Global on purpose: the Rate Tiers belong to the whole Machine.
    const hasRateTiers = await RateTier.query().select('id').first()
    if (!hasRateTiers) {
      throw new MachineNotReadyException('The Operator has no Rate Tiers to price coins with')
    }

    // A window past its close time is done, even if the scheduled task has
    // not closed it yet. Close it now, so the Coin Acceptor is free.
    for (const timedOut of await CoinWindow.timedOut()) {
      await this.close(timedOut)
    }

    const opened = await db.transaction(async (trx) => {
      const open = await CoinWindow.open({ client: trx })
      if (open && open.deviceId === device.id) {
        return null
      }
      if (open) {
        throw new CoinAcceptorBusyException()
      }

      const now = DateTime.now()
      return CoinWindow.create(
        {
          deviceId: device.id,
          openedAt: now,
          closesAt: now.plus({ seconds: settings.data.coinWindowSeconds }),
        },
        { client: trx }
      )
    })
    if (!opened) {
      return
    }

    try {
      await this.helper.setInhibit(false)
    } catch (error) {
      // The Coin Acceptor still rejects coins, so the window must not hold it.
      opened.closedAt = DateTime.now()
      await opened.save()
      throw error
    }
  }

  /**
   * Records a coin the Coin Acceptor accepted. A coin during a Coin Window
   * belongs to it and moves its close time to now plus the Coin Window
   * length. A coin that arrives after the close time, before the window is
   * closed, still belongs to it, since the Coin Acceptor only took it for
   * that Device, but does not keep the window open. A coin with no window
   * open is an Orphan Coin.
   */
  async receiveCoin(pesos: number) {
    const settings = await this.#settings()

    await db.transaction(async (trx) => {
      const window = await CoinWindow.open({ client: trx })
      const now = DateTime.now()
      await Coin.create(
        {
          amountCentavos: Money.fromPesos(pesos).centavos,
          receivedAt: now,
          coinWindowId: window?.id ?? null,
        },
        { client: trx }
      )
      if (!window || window.hasTimedOut) {
        return
      }

      window.closesAt = now.plus({ seconds: settings.data.coinWindowSeconds })
      await window.save()
    })
  }

  /**
   * Closes the window and gives the Coin Acceptor back. If the window
   * received any coins, they become one Top-up on the Device's Credit, or
   * on a new Credit, and the Device is let online.
   */
  async close(window: CoinWindow) {
    const settings = await this.#settings()

    const closed = await db.transaction(async (trx) => {
      const open = await CoinWindow.query({ client: trx })
        .where('id', window.id)
        .whereNull('closed_at')
        .preload('device')
        .preload('coins')
        .first()
      if (!open) {
        return null
      }

      open.closedAt = DateTime.now()
      await open.save()
      if (open.coins.length === 0) {
        return { toppedUp: null }
      }

      // Global on purpose: the Rate Tiers belong to the whole Machine.
      const rateCard = new RateCard(await RateTier.query({ client: trx }))
      const total = open.inserted

      const credit =
        (await Credit.heldBy(open.device, { client: trx })) ??
        (await Credit.issue(open.device, { client: trx }))
      const topUp = await credit.addTopUp(
        { totalCentavos: total.centavos, secondsAdded: rateCard.secondsFor(total) },
        settings.data.expiryDays
      )
      await Coin.query({ client: trx })
        .whereIn(
          'id',
          open.coins.map((coin) => coin.id)
        )
        .update({ topUpId: topUp.id })

      return { toppedUp: open.device }
    })

    // Closed already, for example by the scheduled task just before Done.
    // Another window may hold the Coin Acceptor by now, so leave it alone.
    if (!closed) {
      return
    }

    await this.helper.setInhibit(true)
    if (!closed.toppedUp) {
      return
    }

    await this.helper.allow({
      mac: closed.toppedUp.macAddress,
      ip: closed.toppedUp.lastIpAddress,
      speedCap: settings.speedCap,
    })
  }

  async #settings() {
    const settings = await Setting.current()
    if (!settings) {
      throw new MachineNotReadyException()
    }
    return settings
  }
}

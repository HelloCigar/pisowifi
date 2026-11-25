import { setTimeout } from 'node:timers/promises'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import Money from '#money/money'
import RateCard from '#rate_card/rate_card'
import Coin from '#models/coin'
import Credit from '#models/credit'
import Device from '#models/device'
import Setting from '#models/setting'
import RateTier from '#models/rate_tier'
import CoinWindow from '#models/coin_window'
import HelperClient from '#services/helper_client'
import { LiveChannel } from '#values/live_channel'
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
 *
 * Pages learn of each change over Transmit once it is saved: the holder on
 * its Device's channel, and every portal on the Coin Acceptor's channel
 * when the window opens or closes. A message only says what changed; the
 * page reloads its props to read it.
 */
@inject()
export default class CoinWindowService {
  constructor(protected helper: HelperClient) {}

  /**
   * Gives the Coin Acceptor to the Device. A Device that already holds it
   * keeps its window, and the inhibit line goes off again, in case the
   * helper restarted and turned it on.
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

    try {
      await this.helper.setInhibit(false)
    } catch (error) {
      // The Coin Acceptor still rejects coins, so a new window must not hold it.
      if (opened) {
        opened.closedAt = DateTime.now()
        await opened.save()
      }
      throw error
    }

    if (opened) {
      transmit.broadcast(LiveChannel.CoinAcceptor, { type: 'coin_window.opened' })
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

    const window = await db.transaction(async (trx) => {
      const open = await CoinWindow.open({ client: trx })
      const now = DateTime.now()
      await Coin.create(
        {
          amountCentavos: Money.fromPesos(pesos).centavos,
          receivedAt: now,
          coinWindowId: open?.id ?? null,
        },
        { client: trx }
      )
      if (!open || open.hasTimedOut) {
        return open
      }

      open.closesAt = now.plus({ seconds: settings.data.coinWindowSeconds })
      await open.save()
      return open
    })

    if (!window) {
      return
    }
    transmit.broadcast(Device.coinWindowChannel(window.deviceId), { type: 'coin_window.coin' })
  }

  /**
   * Closes the window and gives the Coin Acceptor back. If the window
   * received any coins, they become one Top-up on the Device's Credit, or
   * on a new Credit, and the Device is let online.
   *
   * A coin dropped just before closing is still sending its pulses, so the
   * window stops first: it takes no more time, the inhibit line goes on, and
   * it keeps the Coin Acceptor while the coins in flight arrive. Only then
   * does it close and price its coins.
   */
  async close(window: CoinWindow) {
    const settings = await this.#settings()
    if (!(await this.#stop(window))) {
      return
    }

    try {
      await this.helper.setInhibit(true)
    } catch (error) {
      // The Customer paid, so the coins are still credited. If the helper is
      // down it sends no coins, and it turns the line on when it restarts.
      logger.error({ err: error }, 'could not turn the inhibit line on')
    }
    // A fixed wait, since the helper cannot say when the last pulse train of
    // a coin already in the Coin Acceptor has finished.
    await setTimeout(this.helper.coinSettleMs)

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

    // Closed already, for example by the scheduled task during the wait.
    if (!closed) {
      return
    }
    transmit.broadcast(LiveChannel.CoinAcceptor, { type: 'coin_window.closed' })
    transmit.broadcast(Device.coinWindowChannel(window.deviceId), { type: 'coin_window.closed' })
    if (!closed.toppedUp) {
      return
    }

    await this.helper.allow({
      mac: closed.toppedUp.macAddress,
      ip: closed.toppedUp.lastIpAddress,
      speedCap: settings.speedCap,
    })
  }

  /**
   * Moves the close time of a window that is still open to now, so later
   * coins still belong to it but no longer keep it open. Returns false when
   * the window is closed already, and another may hold the Coin Acceptor.
   */
  async #stop(window: CoinWindow) {
    return db.transaction(async (trx) => {
      const open = await CoinWindow.query({ client: trx })
        .where('id', window.id)
        .whereNull('closed_at')
        .first()
      if (!open) {
        return false
      }
      if (!open.hasTimedOut) {
        open.closesAt = DateTime.now()
        await open.save()
      }
      return true
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

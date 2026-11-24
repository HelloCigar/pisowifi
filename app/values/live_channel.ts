/**
 * The Transmit channels with no record in their name. A Device's own Coin
 * Window channel is `Device#coinWindowChannel`.
 */
export const LiveChannel = {
  /**
   * Public: a Coin Window opened or closed, so the Coin Acceptor was taken
   * or freed. The messages carry nothing a Customer may not see.
   */
  CoinAcceptor: 'coin_acceptor',

  /**
   * The setup wizard's Coin Acceptor test: each coin while the Machine has
   * no Operator.
   */
  CoinTest: 'setup/coin_test',
} as const

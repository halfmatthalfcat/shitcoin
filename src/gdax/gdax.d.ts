/**
 * GDAX definitions
 */

export type GdaxProduct =
    'BTC-USD'
  | 'ETH-USD'
  | 'LTC-USD'
  | 'BCH-USD'
  ;

export type GdaxChannel =
    'level2'
  | 'heartbeat'
  | 'ticker'
  | 'matches'
  | 'full'
  ;

export type GdaxMessageType =
    'ticker'
  | 'received'
  ;

export type GdaxOrderType =
    'market'
  | 'limit';

export interface GdaxSubscription {
  name: GdaxChannel;
  product_ids: Array<GdaxProduct>;
}

interface GdaxMessage {
  type: string;
  product_id: string;
  time: string;
  sequence: number;
}

export interface GdaxTickerMessage extends GdaxMessage {
  trade_id: number;
  price: string;
  side: string;
  last_size: string;
  best_bid: string;
  best_ask: string;
}

export interface GdaxFeedMessage extends GdaxMessage {
  order_id: string;
  side: string;
}

export interface GdaxFeedReceiveMessage extends GdaxFeedMessage {
  order_type: string;
  latest_price?: string;
}

export interface GdaxFeedReceiveLimitOrder extends GdaxFeedReceiveMessage {
  price: string;
  size: string;
}

export interface GdaxFeedReceiveMarketOrder extends GdaxFeedReceiveMessage {
  funds?: string;
  size?: string;
}

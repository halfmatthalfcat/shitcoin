/**
 * Shitcoin
 */

// tslint:disable

const dev: boolean = process.argv.includes('--dev');

import { Stream, Subscription } from 'most';
import * as most from 'most';
import * as Websocket from 'ws';

import {
  GdaxFeedMessage,
  GdaxFeedReceiveLimitOrder,
  GdaxFeedReceiveMarketOrder,
  GdaxFeedReceiveMessage,
  GdaxTickerMessage
} from './gdax/gdax';

import { GdaxSocket } from './gdax/gdaxSocket';
import { accRate, avgRate, pairwise1, rateInterval } from './processing/util';

interface Snapshot { buy: number; sell: number; spread: number; latest_price: number; }
interface Rate { buyRate: number, sellRate: number, mood: number; latest_price: number; }
interface Mood extends Rate { swing: number; roc: number; }

interface Rates {
  secRate: number;
  fiveSecRate: number;
  tenSecRate: number;
  thirtySecRate: number;
  minRate: number;
}

interface Prices {
  secPrice: number;
  fiveSecPrice: number;
  tenSecPrice: number;
  thirtySecPrice: number;
  minutePrice: number;
}

export interface Metric {
  second: {
    mood: number;
    price: number;
  },
  secFive: {
    mood: number;
    price: number;
  },
  secTen: {
    mood: number;
    price: number;
  },
  secThirty: {
    mood: number;
    price: number;
  },
  minute: {
    mood: number;
    price: number;
  },
  current: number;
}

export class ShitCoinServer {

  private server: Websocket.Server = new Websocket.Server({ port: 9001 });

  constructor() {
    const feed: Stream<GdaxFeedMessage> = new GdaxSocket<GdaxFeedMessage>({
      subscriptions: [
        { name: 'full', product_ids: [ 'BTC-USD' ] },
      ],
    }).stream();

    const ticker: Stream<GdaxTickerMessage> = new GdaxSocket<GdaxTickerMessage>({
      subscriptions: [
        { name: 'ticker', product_ids: [ 'BTC-USD' ] },
      ],
    }).stream();

    const stream: Stream<GdaxFeedReceiveLimitOrder | GdaxFeedReceiveMarketOrder> = feed
      .filter((msg: GdaxFeedMessage) => msg.type === 'received') as Stream<GdaxFeedReceiveLimitOrder | GdaxFeedReceiveMarketOrder>;

    const feedAndTicker: Stream<GdaxFeedReceiveMessage & { latest_price: string; }> = most.sample((f: GdaxFeedMessage, t: GdaxTickerMessage) => {
      return {
        ...f,
        latest_price: t.price,
      } as GdaxFeedReceiveMessage & { latest_price: string; };
    }, stream, stream, ticker);

    const accumulator: Stream<Snapshot> = feedAndTicker
      .scan((a, c) => {
        const latest_price: number = parseFloat(c.latest_price);
        let total: number = 0;

        if (c.order_type === 'market' && (c as GdaxFeedReceiveMarketOrder).funds) {
          total = parseFloat((c as GdaxFeedReceiveMarketOrder).funds as string);
        } else if (c.order_type === 'market' && (c as GdaxFeedReceiveMarketOrder).size && c.latest_price) {
          total = parseFloat((c as GdaxFeedReceiveMarketOrder).size as string) * parseFloat(c.latest_price as string);
        } else if (c.order_type === 'limit') {
          total = parseFloat((c as GdaxFeedReceiveLimitOrder).price) * parseFloat((c as GdaxFeedReceiveLimitOrder).size);
        }

        if (c.side === 'buy') {
          return { ...a, latest_price, buy: a.buy + total, spread: (a.buy + total) - a.sell };
        } else if (c.side === 'sell') {
          return { ...a, latest_price, sell: a.sell + total, spread: a.buy - (a.sell + total) };
        } else { return { ...a, latest_price }; }
      }, { buy: 0, sell: 0, spread: 0, latest_price: 0 }).multicast();

    const secRate: Stream<number> = accumulator
      .thru(rateInterval(1000, 'spread', 1));

    const secPrice = ticker
      .thru(rateInterval(1000, 'price', 1));

    const fiveSecRate: Stream<number> = accumulator
      .thru(rateInterval(5000, 'spread', 1));

    const fiveSecPrice = ticker
      .thru(rateInterval(5000, 'price', 1));

    const tenSecRate: Stream<number> = accumulator
      .thru(rateInterval(10000, 'spread', 1));

    const tenSecPrice = ticker
      .thru(rateInterval(10000, 'price', 1));

    const thirtySecRate: Stream<number> = accumulator
      .thru(rateInterval(30000, 'spread', 1));

    const thirtySecPrice = ticker
      .thru(rateInterval(30000, 'price', 1));

    const minuteRate: Stream<number> = accumulator
      .thru(rateInterval(60000, 'spread', 1));

    const minutePrice = ticker
      .thru(rateInterval(60000, 'price', 1));

    const rateStream: Stream<Rates> = most.sample(
      (
        secRate: number,
        fiveSecRate: number,
        tenSecRate: number,
        thirtySecRate: number,
        minRate: number,
      ) => ({
        secRate,
        fiveSecRate,
        tenSecRate,
        thirtySecRate,
        minRate,
      }),
      secRate,
      secRate,
      fiveSecRate,
      tenSecRate,
      thirtySecRate,
      minuteRate
    ).multicast();

    const priceStream: Stream<Prices> = most.sample(
      (
        secPrice: number,
        fiveSecPrice: number,
        tenSecPrice: number,
        thirtySecPrice: number,
        minutePrice: number,
      ) => ({
        secPrice,
        fiveSecPrice,
        tenSecPrice,
        thirtySecPrice,
        minutePrice,
      }),
      secPrice,
      secPrice,
      fiveSecPrice,
      tenSecPrice,
      thirtySecPrice,
      minutePrice,
    ).multicast();

    const metricStream: Stream<Metric> = most.sample(
      (rates: Rates, prices: Prices, ticker: GdaxTickerMessage) => ({
        second: {
          mood: rates.secRate,
          price: prices.secPrice,
        },
        secFive: {
          mood: rates.fiveSecRate,
          price: prices.fiveSecPrice,
        },
        secTen: {
          mood: rates.tenSecRate,
          price: prices.tenSecPrice,
        },
        secThirty: {
          mood: rates.thirtySecRate,
          price: prices.thirtySecPrice,
        },
        minute: {
          mood: rates.minRate,
          price: prices.minutePrice,
        },
        current: parseFloat(ticker.price),
      }),
      rateStream,
      rateStream,
      priceStream,
      ticker,
    ).multicast();

    this.server.on('connection', (socket: Websocket) => {
      let subscription: Subscription<Mood>;

      if (socket.readyState === Websocket.OPEN) {
        subscription = metricStream.subscribe({
          next: (metric: Metric) => socket.send(JSON.stringify(metric)),
          error: console.log,
          complete: console.log,
        });
      }

      socket.on('close', () => {
        if (subscription) { subscription.unsubscribe(); }
      });

      socket.on('error', () => {
        if (subscription) { subscription.unsubscribe(); }
      });
    });

  }

}

new ShitCoinServer();

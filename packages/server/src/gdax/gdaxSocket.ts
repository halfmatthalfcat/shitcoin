/**
 * GDAX Websocket
 */

const prod: boolean = process.argv.includes('--prod');

import { fromEvent, Stream } from 'most';
import * as Websocket from 'ws';

import { GdaxMessage, GdaxSubscription } from './gdax';

export interface GdaxSocketOpts {
  url?: string;
  subscriptions: Array<GdaxSubscription>;
}

export class GdaxSocket<T extends GdaxMessage> {

  private socket: Websocket;

  constructor(private opts: GdaxSocketOpts) {
    this.socket = new Websocket(prod
      ? 'wss://ws-feed.pro.coinbase.com'
      : 'wss://ws-feed-public.sandbox.pro.coinbase.com'
    );

    this.socket.on('open', () => {
      if (this.socket.readyState === Websocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'subscribe',
          channels: opts.subscriptions,
        }));
      }
    });

  }

  public stream: () => Stream<T> = () => fromEvent('message', this.socket)
    // tslint:disable-next-line no-any
    .map<T>((message: any) => JSON.parse(message.data))
    .filter<T>((message: GdaxMessage): message is T => message.type !== 'subscriptions')

}

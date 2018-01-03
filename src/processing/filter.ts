/**
 * Filtering steps
 */

import { Stream } from 'most';

import { GdaxMessageType, GdaxOrderType } from '../gdax/gdax';

export class Filter {

  public static withType: <A extends { type: string }, B extends A>(...types: Array<GdaxMessageType>) => (stream: Stream<A>) => Stream<B> =
    <A extends { type: string }, B extends A>(...types: Array<GdaxMessageType>) => (stream: Stream<A>): Stream<B> => types.reduce(
      (curr: Stream<A>, filter: string) => curr.filter((message: A) => message.type === filter),
      stream,
    ) as Stream<B>

  public static withOrderType: <A extends { order_type: string }, B extends A>(...orderTypes: Array<GdaxOrderType>) => (stream: Stream<A>) => Stream<B> =
    <A extends { order_type: string }, B extends A>(...orderTypes: Array<GdaxOrderType>) => (stream: Stream<A>) => orderTypes.reduce(
      (curr: Stream<A>, filter: string) => curr.filter((message: A) => message.order_type === filter),
      stream,
    ) as Stream<B>

}

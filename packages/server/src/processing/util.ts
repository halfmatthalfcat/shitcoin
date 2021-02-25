/**
 * Processing utils
 */

import { fromPromise, loop, of, skip, Stream } from 'most';

declare type SeedValue<S, V> = { seed: S, value: V };

const pairs: <T>(prev: T, current: T) => SeedValue<T, Array<T>> =
  <T>(prev: T, current: T): SeedValue<T, Array<T>> => ({ seed: current, value: [prev, current] });

// pairwise :: a -> Stream a -> Stream (a, a)
// Return a stream of [previous, current] event pairs
// The first pair will be [initial, first event]
export const pairwise: <T>(initial: T, stream: Stream<T>) => Stream<Array<T>> =
  <T>(initial: T, stream: Stream<T>): Stream<Array<T>> => loop<T, Array<T>, T>(pairs, initial, stream);

// Variant of pairwise without an initial value
// The first pair will be [first event, second event]
export const pairwise1: <T>(stream: Stream<T>) => Stream<Array<T>> =
  <T>(stream: Stream<T>): Stream<Array<T>> => skip<Array<T>>(1, pairwise(void 0, stream) as Stream<Array<T>>);

const sum: (num: Array<number>) => number =
  (num: Array<number>): number => num.reduce((acc: number, curr: number) => acc + curr, 0);

const start: Stream<void> = fromPromise(Promise.resolve());
const window: (delay: number) => Stream<Stream<void>> =
  (delay: number): Stream<Stream<void>> => start.constant(of(void 0).delay(delay));

export const rateInterval: <A extends object>(interval: number, prop: keyof A, minLength?: number) => (stream: Stream<A>) => Stream<number> =
  <A extends object>(interval: number, prop: keyof A, minLength: number = 5) => (stream: Stream<A>): Stream<number> =>
    stream
      .map((obj: A) => parseFloat((obj[prop] as unknown) as string))
      // Filter out 0s
      .filter((value: number) => !!value)
      .thru((s: Stream<number>) => fromPromise(accRate(interval, s)))
      .thru(avgRate(minLength))
      .continueWith(() => rateInterval<A>(interval, prop, minLength)(stream));

export const accRate: (interval: number, stream: Stream<number>) => Promise<Array<number>> =
  (interval: number, stream: Stream<number>): Promise<Array<number>> =>
    stream
      .during(window(interval))
      .thru(pairwise1)
      .reduce(
        (a: Array<number>, [ prev, curr ]: [number, number]) => [...a, (curr - prev) / prev],
        [],
      );

export const avgRate: (minLength: number) => (stream: Stream<Array<number>>) => Stream<number> =
  (minLength: number) => (stream: Stream<Array<number>>): Stream<number> => stream
    .map((arr: Array<number>) => arr.filter((value: number) => !!value))
    .map((arr: Array<number>) => arr.length >= minLength ? arr : [ 0 ])
    .map((arr: Array<number>) => (sum(arr) / arr.length) * 100);

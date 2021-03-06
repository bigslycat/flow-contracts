/* @flow */

import { ValidationError } from './ValidationError';

export type Contract<+T> = {
  (
    valueName: string,
    ...$ReadOnlyArray<void>
  ): {
    (value: mixed): ValidationError | T,
    optional(value: mixed): ValidationError | void | T,
    maybe(value: mixed): ValidationError | ?T,
  },
  (valueName: string, value: mixed): ValidationError | T,

  optional(
    valueName: string,
    ...$ReadOnlyArray<void>
  ): (value: mixed) => ValidationError | void | T,
  optional(valueName: string, value: mixed): ValidationError | void | T,

  maybe(
    valueName: string,
    ...$ReadOnlyArray<void>
  ): (value: mixed) => ValidationError | ?T,
  maybe(valueName: string, value: mixed): ValidationError | ?T,

  mapResult<M>(
    transform: (result: ValidationError | T) => M,
  ): ((valueName: string, ...$ReadOnlyArray<void>) => (value: mixed) => M) &
    ((valueName: string, value: mixed) => M),

  match<M>(
    fromValue: (value: T) => M,
    fromError: (error: ValidationError) => M,
  ): ((valueName: string, ...$ReadOnlyArray<void>) => (value: mixed) => M) &
    ((valueName: string, value: mixed) => M),
};

declare function curry2<A, B, C>(
  fn: (A, B) => C,
): (A => B => C) & ((A, B) => C);

// eslint-disable-next-line no-redeclare
function curry2(fn) {
  return (...args) =>
    args.length > 1 ? fn(args[0], args[1]) : value => fn(args[0], value);
}

export function of /* :: <T> */(
  validate: (valueName: string, value: mixed) => ValidationError | T,
): Contract<T> {
  const maybe = curry2((valueName, value) =>
    value == null ? value : validate(valueName, value),
  );

  const optional = curry2((valueName, value) =>
    value === undefined ? value : validate(valueName, value),
  );

  const contract = (...args) => {
    if (args.length > 1) return validate((args[0]: any), args[1]);

    const result = value => validate((args[0]: any), value);

    result.maybe = maybe(args[0]);
    result.optional = optional(args[0]);

    return result;
  };

  const mapResult = transform =>
    curry2((valueName, value) => transform(validate(valueName, value)));

  const match = (fromValue, fromError) =>
    curry2((valueName, value) => {
      const result = validate(valueName, value);
      return result instanceof ValidationError
        ? fromError(result)
        : fromValue(result);
    });

  contract.maybe = maybe;
  contract.optional = optional;
  contract.mapResult = mapResult;
  contract.match = match;

  return (contract: any);
}

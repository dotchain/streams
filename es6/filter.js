"use strict";

export function buildFilter(types) {
  const valueOf = x => x && x.valueOf();
  const truthy = fn => (val, key) => !!valueOf(fn(val, key));
  types.filter = (s, fn) => types.groupBy(s, truthy(fn)).get("true");
}

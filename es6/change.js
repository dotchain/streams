"use strict";

import { Replace } from "./replace.js";

// wrapChange convers the JSON version of a change to a strongly-typed
// object (of type Replace, etc)
export function wrapChange(c) {
  if (c && typeof c == "object") {
    return new Replace(c.before, c.after);
  }
}

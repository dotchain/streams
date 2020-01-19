"use strict";

export function buildTransport(types) {
  // urlTransport returns a fetch-API based transport that uses the provided URL
  // to post write and fetch reads from
  types.urlTransport = function urlTransport(url, fetch) {
    return new types.Transport(new UrlStore(url, fetch));
  };

  // Transport is the transport to use with sync
  types.Transport = class Transport {
    constructor(store) {
      this._store = store;
      this._version = -1;
      this._unsent = [];
      this._received = [];
      this._push = null;
      this._pull = null;
      this._writing = null;
      this._reading = null;
    }

    write(op) {
      this._unsent.push(op);
    }

    start(version, pending, push, pull) {
      this._version = version;
      this._unsent = this._unsent.concat(pending);
      this._push = push;
      this._pull = pull;
    }

    push() {
      if (this._writing !== null) {
        return this._writing;
      }

      let finished = false;
      const writing = (async () => {
        try {
          this._push();
          let sending = this._unsent.slice();
          if (sending.length > 0) {
            await this._store.write(sending);
            this._unsent = this._unsent.slice(sending.length);
          }
        } finally {
          this._writing = null;
          finished = true;
        }
      })();

      this._writing = finished ? null : writing;
      return writing;
    }

    pull() {
      if (this._reading !== null) {
        return this._reading;
      }

      let finished = false;
      const reading = (async () => {
        try {
          let ops = await this._store.fetch(this._version + 1);
          for (let op of ops) {
            this._pull(op);
            this._version = op.version;
          }
        } finally {
          this._reading = null;
          finished = true;
        }
      })();

      this._reading = finished ? null : reading;
      return reading;
    }
  };

  // UrlStore implements the store interface using fetch API against a
  // specified store.
  class UrlStore {
    constructor(url, fetch) {
      this._url = url;
      this._fetch = fetch;
    }

    async fetch(version) {
      let body = await this._fetch(this._url, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify({ read: { from: version } })
      });
      const ops = await body.json();
      return ops.map(op => types.Operation.wrap(op));
    }

    async write(ops) {
      let body = await this._fetch(this._url, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify({ write: ops })
      });
      return body.json();
    }
  }
}

"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, groupBy } from "../main.js";

describe("group", function() {
  it("groups", () => {
    const table = wrap({
      one: { x: 5, y: 9 },
      two: { x: 3, y: 5 },
      three: { x: 6, y: 2 }
    });
    const g = groupBy(table, row => row.x + row.y);
    expect(g.valueOf()).to.deep.equal({
      14: { one: { x: 5, y: 9 } },
      8: { two: { x: 3, y: 5 }, three: { x: 6, y: 2 } }
    });
  });

  it("tracks changes", () => {
    const table = wrap({
      one: { x: 5, y: 9 },
      two: { x: 3, y: 5 },
      three: { x: 6, y: 2 }
    });
    const g = groupBy(table, row => row.x + row.y);
    table.one.x.replace(10);
    table.get("four").replace({ x: 5, y: 5 });
    table.two.get("z").replace(1);

    expect(g.latest().valueOf()).to.deep.equal({
      19: { one: { x: 10, y: 9 } },
      10: { four: { x: 5, y: 5 } },
      8: { two: { x: 3, z: 1, y: 5 }, three: { x: 6, y: 2 } }
    });

    table.replace({ five: { x: 5, y: 4 } });
    expect(g.latest().valueOf()).to.deep.equal({
      9: { five: { x: 5, y: 4 } }
    });
  });

  it("writes through", () => {
    const table = wrap({
      one: { x: 5, y: 9 },
      two: { x: 3, y: 5 },
      three: { x: 6, y: 2 }
    });
    const g = groupBy(table, row => row.x + row.y);
    g[14].one.x.replace(10);
    g.get("10").replace({ four: { x: 5, y: 5 } });
    g.get("8")
      .two.get("z")
      .replace(1);

    expect(g.latest().valueOf()).to.deep.equal({
      19: { one: { x: 10, y: 9 } },
      10: { four: { x: 5, y: 5 } },
      8: { two: { x: 3, z: 1, y: 5 }, three: { x: 6, y: 2 } }
    });

    g.replace({ 10: { five: { x: 5, y: 4 } } });
    expect(g.latest().valueOf()).to.deep.equal({
      9: { five: { x: 5, y: 4 } }
    });
  });

  it("implements ref", () => {
    const table = wrap({
      one: { x: 5, y: 9 },
      two: { x: 3, y: 5 },
      three: { x: 6, y: 2 }
    }).withRef(["hey"]);
    const g = groupBy(table, row => row.x + row.y);
    const g2 = g.withRef(["g"]);

    expect(g2.ref()).to.deep.equal(["g"]);
    expect(g.ref()).to.deep.equal([]);
    expect(g.get("8").ref()).to.deep.equal(["8"]);
    expect(g2.get("8").ref()).to.deep.equal(["g", "8"]);

    expect(
      g2
        .get("8")
        .get("two")
        .ref()
    ).to.deep.equal(["hey", "two"]);
  });
});

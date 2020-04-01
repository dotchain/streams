"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { SnapFiles } from "../main.js";

describe("snapfiles", () => {
  it("fetches", async () => {
    const files = {};
    const fs = {
      promises: {
        async readFile(path) {
          if (files.hasOwnProperty(path)) return files[path];
          const err = new Error("not found");
          err.code = "ENOENT";
          throw err;
        },
        async writeFile(path, value) {
          files[path] = value;
        }
      }
    };
    const snapfiles = new SnapFiles("dir", fs, { chunkSize: 2, windowSize: 2 });

    it("saves generated snapshots", async () => {
      let result = await snapfiles.get(4, "", async () => "four");
      expect(result).to.equal("four");
      expect(files["dir/snapshot-4.json"]).to.equal(`"four"`);
      expect(snapfiles.maxVersion()).to.equal(4);
    });

    it("also updates maxVersion", async () => {
      let result = await snapfiles.get(8, "", async () => "eight");
      expect(result).to.equal("eight");
      expect(files["dir/snapshot-8.json"]).to.equal(`"eight"`);
      expect(snapfiles.maxVersion()).to.equal(8);
    });

    it("reads old snapshots", async () => {
      files["dir/snapshot-4.json"] = "snap four";
      let result = await snapfiles.get(4, "", async () => "four");
      expect(result).to.equal("snap four");
      expect(snapfiles.maxVersion()).to.equal(8);
    });

    it("does not save intermediate snapshots", async () => {
      let result = await snapfiles.get(9, "", async () => "nine");
      expect(result).to.equal("nine");
      expect(files["dir/snapshot-9.json"]).to.equal(undefined);
      expect(snapfiles.maxVersion()).to.equal(9);
    });
  });
});

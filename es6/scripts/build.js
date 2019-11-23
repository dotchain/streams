"use strict";

const fs = require("fs");

// parseExample parses an example
function parseExample(name, code, imports) {
  const re = /import (.*) from (.*);/g;
  for (let match of code.match(re)) {
    let m = match.match(/import (.*) from (.*);/);
    if (m) {
      imports[m[1]] = m[2];
    }
  }
  return `it("does ${name}", async () => {\n${code}\n});`;
}

function lastMatch(s, re) {
  let result = "";
  for (let m = s.match(re); m; m = s.match(re)) {
    result = m[0];
    s = s.slice(m.index + result.length);
  }
  return result;
}

function uniqify(names, name) {
  if (!names[name]) {
    names[name] = true;
    return name;
  }
  for (let n = 1; n < 1000; n++) {
    const candidate = name + " #" + n;
    if (!names[candidate]) {
      names[candidate] = true;
      return candidate;
    }
  }
  return name;
}

// parses the provided markdown file and generates an examples js file
function compile(md) {
  let data = fs.readFileSync(md, "utf8");
  const start = /^```js.*$/m;
  const end = /^```$/m;

  let imports = {};
  let examples = [];
  let lastHeading = "";
  let names = {};

  for (let m = data.match(start); m; m = data.match(start)) {
    const h = lastMatch(data.slice(0, m.index), /^#.*$/m)
      .replace(/^#+/, "")
      .trim()
      .toLowerCase();
    lastHeading = h || lastHeading;
    const name =
      m[0]
        .split(" ")
        .slice(1)
        .join(" ") ||
      lastHeading ||
      "" + examples.length;
    data = data.slice(m.index + m[0].length);
    m = data.match(end);
    if (m) {
      examples.push(
        parseExample(uniqify(names, name), data.slice(0, m.index), imports)
      );
      data = data.slice(m.index + m[0].length);
    }
  }
  let output = `"use strict";\n\n`;
  for (let name in imports) {
    let path = imports[name].trim();
    let prefix = `"github.com/dotchain/streams/es6`;
    if (path.startsWith(prefix)) {
      if (path == prefix + `"`) {
        path = `"../main.js"`;
      } else {
        path = `"..` + path.slice(prefix.length);
      }
    }
    output += `import ${name} from ${path};\n`;
  }
  output += `\ndescribe("examples from README.md", () => {`;
  output += examples.join("\n");
  output += "\n});";
  return output;
}

function main() {
  const self = __filename;
  const root = self.replace("es6/scripts/build.js", "");
  const md = root + "README.md";
  const output = root + "es6/test/examples_test.js";
  const err = fs.writeFileSync(output, compile(md));
  if (err) {
    throw err;
  }
}

main();

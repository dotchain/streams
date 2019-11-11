"use strict";

const fs = require("fs");

// parseExample parses an example
function parseExample(examplen, code, imports) {
  const re = /import (.*) from (.*);/g;
  for (let match of code.match(re)) {
    let m = match.match(/import (.*) from (.*);/);
    if (m) {
      imports[m[1]] = m[2];
    }
  }
  return `it("does example ${examplen}", async () => {\n${code}\n});`;
}

// parses the provided markdown file and generates an examples js file
function compile(md) {
  let data = fs.readFileSync(md, "utf8");
  const start = /^```js.*$/m;
  const end = /^```$/m;

  let imports = {};
  let examples = [];

  for (let m = data.match(start); m; m = data.match(start)) {
    data = data.slice(m.index + m[0].length);
    m = data.match(end);
    if (m) {
      examples.push(
        parseExample(examples.length, data.slice(0, m.index), imports)
      );
      data = data.slice(m.index + m[0].length);
    }
  }
  let output = `"use strict";\n\n`;
  for (let name in imports) {
    let path = imports[name].trim();
    if (path == `"github.com/dotchain/streams/es6"`) {
      path = `"../main.js"`;
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
  console.log(fs.writeFileSync(output, compile(md)));
}

main();

const fs = require("fs");
const path = require("path");

const cwd = process.cwd();

const libDir = path.join(cwd, "lib");
if (fs.existsSync(libDir)) {
    fs.rmdirSync(libDir, { recursive: true });
}

const main = path.join(cwd, "wwibs.js");
if (fs.existsSync(main)) {
    fs.unlinkSync(main);
}

const mainDeclaration = path.join(cwd, "wwibs.d.ts");
if (fs.existsSync(mainDeclaration)) {
    fs.unlinkSync(mainDeclaration);
}

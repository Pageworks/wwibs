const Terser = require("terser");
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const packageJSON = require(path.join(cwd, "package.json"));

function setVersion() {
    return new Promise((resolve, reject) => {
        const file = path.resolve(cwd, "lib/broadcaster.js");
        fs.readFile(file, (error, buffer) => {
            if (error) {
                reject(error);
            }
            const data = buffer.toString().replace("REPLACE_WITH_VERISON", packageJSON.version);
            fs.writeFile(file, data, error => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    });
}

function minify() {
    return new Promise((resolve, reject) => {
        const file = path.resolve(cwd, "lib/broadcaster-worker.js");
        const output = path.join(cwd, "broadcaster-worker.min.js");
        fs.readFile(file, (error, buffer) => {
            if (error) {
                reject(error);
            }
            const result = Terser.minify(buffer.toString(), {
                compress: {
                    drop_console: false,
                    ecma: 6,
                    keep_infinity: true,
                    module: true,
                },
                mangle: {
                    module: true,
                },
            });
            if (result.error) {
                reject(error);
            }
            fs.writeFile(output, result.code, error => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    });
}

async function run() {
    try {
        await minify();
        await setVersion();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
run();

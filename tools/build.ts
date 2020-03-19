const shell = require("shelljs");
const packageJson = require("../api/package.json");

// clean
function clean(): void {
  shell.echo("Cleaning ...");
  shell.rm("-rf", "./lib");
  shell.mkdir("./lib");
}

// build server
function buildServer(): Promise<void> {
  shell.echo("Building API ...");
  return new Promise(resolve => {
    shell.cd("api");

    shell.exec("yarn", () => {
      shell.exec("yarn build", () => {
        shell.cd("../lib");
        shell.mv("../api/dist/*", "./");
        shell.rm("-rf", "../api/dist");
        shell.cd("..");

        resolve();
      });
    });
  });
}

// move package json
function movePackageJson(): void {
  console.log(packageJson);

  const productionPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    private: packageJson.private,
    license: packageJson.license,
    dependencies: packageJson.dependencies,

    scripts: {
      start: "node main.js"
    }
  };

  const shellString = new shell.ShellString(
    JSON.stringify(productionPackageJson)
  );
  shellString.to("./lib/package.json");
}

// build client
function buildClient(): Promise<void> {
  shell.echo("Building Site ...");

  return new Promise(resolve => {
    shell.cd("site");
    shell.exec("yarn", () => {
      shell.exec("yarn build", () => {
        shell.cd("..");
        shell.mv("./site/lib", "lib/site");
        shell.cd("..");

        resolve();
      });
    });
  });
}

// main
async function main(): Promise<void> {
  clean();

  await buildServer();
  movePackageJson();
  await buildClient();

  console.log("Build Complete");
}

main();

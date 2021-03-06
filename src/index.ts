import * as exec from '@actions/exec';
import * as core from '@actions/core';
import download from 'download';
import fs from 'fs';
import normalize from 'normalize-path';

const getEnv = (variable:string):string => {
  const key = variable.replace("$", "");
  return `${process.env[key]}`
} 

const nomalizePath = (path: string): string => {
  const nonEnvPath = path.replace(/^\$[A-Z_a-z]+/g, x => getEnv(x));
  return normalize(nonEnvPath);
}

async function run() {
  try {
    let machine;

    switch(process.platform) {
      case 'darwin':
        machine = 'macos';
        break;
      case 'linux':
        machine = 'linux';
        break;
      default:
        core.setFailed("Firebase.tools can only be installed on either linux or macos. ");
        return;
    }

    const binaryInstallPath:string = nomalizePath(core.getInput('install-path'));
    const binaryInstallVersion:string = core.getInput('version');

    const binaryPath = `${binaryInstallPath}/firebase`;

    const downloadUrl = `https://firebase.tools/bin/${machine}/${binaryInstallVersion}`;

    await download(downloadUrl, binaryInstallPath, { "filename": "firebase" });

    console.log(`File was downloaded to ${binaryPath}. Setting up execution permissons`);

    fs.chmodSync(binaryPath, '755');

    console.log(`Permissions set. Adding binary path to $PATH variable`);

    core.addPath(binaryInstallPath);
    
    // If all went well, the "firebase" binary should be located on our PATH so
    // we'll run it once, asking it to print out the version. This is helpful as
    // standalone firebase binaries do a small amount of setup on the initial run
    // so this not only allows us to make sure we got the right version, but it
    // also does the setup so the first time the developer runs the binary, it'll
    // be faster.
    console.log(`binary added to PATH, checking it's version`);
    await exec.exec(`firebase`, ["--version"]);

    core.setOutput("firebase-binary-path", `${binaryPath}`);

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    // unhandled
    core.setFailed(error.message);
  }
}

run();
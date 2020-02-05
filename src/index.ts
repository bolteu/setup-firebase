import * as exec from '@actions/exec';
import * as core from '@actions/core';
import fetch from 'node-fetch';
import fs from 'fs';

const getEnv = (variable:string):string => {
  const key = variable.replace("$", "");
  return `${process.env[key]}`
} 

const downloadFile = (async (url:string, path:string) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", (err: Error) => {
        reject(err);
      });
      fileStream.on("finish", function() {
        resolve();
      });
    });
});

async function run() {
  try {
    const binaryInstallPath:string = core.getInput('install-path');
    const binaryInstallVersion:string = core.getInput('version');

    const binaryPath = `${binaryInstallPath}/firebase`;

    const downloadUrl = `https://firebase.tools/bin/linux/${binaryInstallVersion}`;

    await downloadFile(downloadUrl, binaryPath);

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
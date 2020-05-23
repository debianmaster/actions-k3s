const core = require('@actions/core');
const exec = require('@actions/exec');
const wait = require('./wait');

async function run() {
  try {
    const version = core.getInput('version');
    const kubeconfig_location="/tmp/output/kubeconfig-"+version+".yaml";
    console.log(`storing kubeconfig here ${kubeconfig_location}!`); 
      
    await exec.exec('docker', ["run","-d","--privileged","--name=k3s-"+version,
    "-e","K3S_KUBECONFIG_OUTPUT="+kubeconfig_location,
    "-e","K3S_KUBECONFIG_MODE=666",
    "-v","/tmp/output:/tmp/output","-p","6443:6443",
    "rancher/k3s:"+version,"server"]);
    await wait(parseInt(10000));
    core.setOutput("kubeconfig", kubeconfig_location);
    core.exportVariable('KUBECONFIG', kubeconfig_location);

  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
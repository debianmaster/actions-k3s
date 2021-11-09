const core = require('@actions/core');
const exec = require('@actions/exec');
const wait = require('./wait');
const fs = require('fs');

async function run() {
  try {
    const version = core.getInput('version');
    const kubeconfig_location="/tmp/output/kubeconfig-"+version+".yaml";
    console.log(`storing kubeconfig here ${kubeconfig_location}!`); 

    await exec.exec('docker', ["run","-d","--privileged","--name=k3s-"+version,
    "--expose=6443",
    "-e","K3S_KUBECONFIG_OUTPUT="+kubeconfig_location,
    "-e","K3S_KUBECONFIG_MODE=666",
    "-v","/tmp/output:/tmp/output","-p","6443:6443","-p","80:80","-p","443:443","-p","8080:8080",
    "rancher/k3s:"+version,"server"]);
    
    await wait(parseInt(10000));

    if (process.env.DOCKER_HOST) {
      const kubeconfig = await exec.getExecOutput('docker', ["exec", `k3s-${version}`, "cat", kubeconfig_location]);

      await exec.exec('mkdir', ['/tmp/output']);
      fs.writeFileSync(kubeconfig_location, kubeconfig.stdout);
    }

    core.exportVariable('KUBECONFIG', kubeconfig_location);
    core.setOutput("kubeconfig", kubeconfig_location);   
    const nodeName=await exec.getExecOutput("kubectl get nodes --no-headers -oname");    
    var command="kubectl wait --for=condition=Ready "+nodeName.stdout;
    await exec.exec(command);            
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
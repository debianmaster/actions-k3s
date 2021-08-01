const core = require('@actions/core');
const exec = require('@actions/exec');
const wait = require('./wait');

async function run() {
  try {
    const version = core.getInput('version');
    const kubeconfig_location="/tmp/output/kubeconfig-"+version+".yaml";
    console.log(`storing kubeconfig here ${kubeconfig_location}!`); 
    await exec.exec('mkdir', ["-p","/tmp/images"]);
    await exec.exec('docker', ["run","-d","--privileged","--name=k3s-"+version,
    "-e","K3S_KUBECONFIG_OUTPUT="+kubeconfig_location,
    "-e","K3S_KUBECONFIG_MODE=666",
    "-v","/tmp/output:/tmp/output",
    "-v","/tmp/images:/var/lib/rancher/k3s/agent/images",
    "-p","6443:6443","-p","80:80",
    "-p","443:443","-p","8080:8080",
    "rancher/k3s:"+version,"server"]);

    //await exec.exec('docker', ["exec","k3s-latest","mkdir","-p","/var/lib/rancher/k3s/agent/images"]);

    await wait(parseInt(10000));
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
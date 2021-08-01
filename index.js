const core = require('@actions/core');
const exec = require('@actions/exec');
const wait = require('./wait');
const fs = require("fs");

async function run() {
  try {
    const version = core.getInput('version');
    const kubeconfig_location="/tmp/output/kubeconfig-"+version+".yaml";
    console.log(`storing kubeconfig here ${kubeconfig_location}!`); 
    
    await exec.exec('docker', ["run","-d","--privileged","--name=k3s-"+version,
    "-e","K3S_KUBECONFIG_OUTPUT="+kubeconfig_location,
    "-e","K3S_KUBECONFIG_MODE=666",
    "-v","/tmp/images:/var/lib/rancher/k3s/server/images",
    "-v","/tmp/output:/tmp/output",
    "-p","6443:6443","-p","80:80",
    "-p","443:443","-p","8080:8080",
    "rancher/k3s:"+version,"server"]);

    var healthCheck="until [ -f /tmp/output/kubeconfig-latest.yaml ]";
    fs.writeFileSync("./is-cluster-ready.sh", healthCheck);
    fs.chmodSync("./is-cluster-ready.sh", "755");
    var command="./is-cluster-ready.sh";
    await exec.exec(healthCheck); 
  
    
    core.exportVariable('KUBECONFIG', kubeconfig_location);
    core.setOutput("kubeconfig", kubeconfig_location);   
    const nodeName=await exec.getExecOutput("kubectl get nodes --no-headers -oname");    
    var command="kubectl wait --for=condition=Ready "+nodeName.stdout;
    await exec.exec(command);


    var healthCheck="until kubectl get serviceaccount default; do sleep 1; done";
    fs.writeFileSync("./is-cluster-ready.sh", healthCheck);
    fs.chmodSync("./is-cluster-ready.sh", "755");
    var command="./is-cluster-ready.sh";
    await exec.exec(healthCheck);  
    

  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
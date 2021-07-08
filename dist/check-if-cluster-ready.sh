kubectl wait --for=condition=Ready  $(kubectl get nodes --no-headers -oname)

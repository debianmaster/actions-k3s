#!/bin/bash
n=0; until ((n >= 60)); do kubectl -n default get serviceaccount default -o name && break; n=$((n + 1)); sleep 1; done; ((n < 60))

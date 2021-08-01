#!/bin/bash
npm run build
git add .
git commit -m update
git push origin2 feature/local-build-and-use
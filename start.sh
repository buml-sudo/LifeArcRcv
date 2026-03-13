#!/bin/bash
. /home/buml/.nvm/nvm.sh
cd /home/buml/LifeArcRcv

if [ "$1" = "clear" ]; then
  npx expo start --tunnel --clear
else
  npx expo start --tunnel
fi

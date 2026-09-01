#!/bin/bash
# Helios light client sidecar on geneva_geneva-network.
# Consensus: public beacon light-client API. Execution: public EL for proofs.
# Pulse/games use BLOCK_RPC=http://geneva-helios:8545. Fill stays on floral.
set -e
IMAGE=geneva-helios
NET=geneva_geneva-network
docker rm -f geneva-helios 2>/dev/null || true
docker run -d --name geneva-helios --restart unless-stopped --network "$NET" \
  -v /home/jack/.helios:/helios \
  "$IMAGE" ethereum --network mainnet \
    --consensus-rpc http://testing.mainnet.beacon-api.nimbus.team \
    --execution-rpc https://ethereum.publicnode.com \
    --rpc-bind-ip 0.0.0.0 --rpc-port 8545 \
    --data-dir /helios --load-external-fallback
echo "Helios on geneva-helios:8545"

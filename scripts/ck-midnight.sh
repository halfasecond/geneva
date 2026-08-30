#!/bin/sh
# UTC 00:05: fill events, finalize ETH close, append yesterday's kn_dailies.
set -e
cd /app
NODE_NO_WARNINGS=1 yarn ck:midnight

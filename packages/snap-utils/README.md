# snap-utils

This package has files with util methods that were extracted from the [`template-snap-monorepo/packages/site` package](https://github.com/MetaMask/template-snap-monorepo/tree/main/packages/site).


The util methods are react hooks that can be used by dApps to make the integration easier.

The branch `snaps-integration-poc` in the `bet-dapp` repository has an example on how to do it (https://github.com/HathorNetwork/bet-dapp/tree/feat/snaps-integration-poc). We have:

1. Use of `MetaMaskProvider` util.
1. How to identify if the MetaMask is installed.
1. How to install the snap on MetaMask.
1. How to request an RPC method.

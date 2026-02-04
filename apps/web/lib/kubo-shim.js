// Browser shim for kubo-rpc-client
// The iExec SDK should handle IPFS operations differently in browser context
module.exports = {
  create: () => {
    console.warn("kubo-rpc-client is not supported in browser context");
    return null;
  },
};

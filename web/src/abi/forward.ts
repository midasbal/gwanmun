/** forward(address) on the GwanmunForwarder logic contract, called through the gate proxy. */
export const forwardAbi = [
  {
    type: "function",
    name: "forward",
    stateMutability: "payable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
] as const;

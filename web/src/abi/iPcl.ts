export const iPclAbi = [
	{
		type: "error",
		inputs: [{
			name: "reason",
			internalType: "string",
			type: "string"
		}],
		name: "ABISetupFailed"
	},
	{
		type: "error",
		inputs: [{
			name: "reason",
			internalType: "string",
			type: "string"
		}],
		name: "AbiDecodeFailed"
	},
	{
		type: "error",
		inputs: [],
		name: "AgentKeeperRequired"
	},
	{
		type: "error",
		inputs: [{
			name: "reason",
			internalType: "string",
			type: "string"
		}],
		name: "AgentTransferLimitMetadataInvalid"
	},
	{
		type: "error",
		inputs: [{
			name: "childReverts",
			internalType: "bytes[]",
			type: "bytes[]"
		}],
		name: "AnyOfRejected"
	},
	{
		type: "error",
		inputs: [{
			name: "field",
			internalType: "string",
			type: "string"
		}],
		name: "CannotEmpty"
	},
	{
		type: "error",
		inputs: [{
			name: "expected",
			internalType: "uint256",
			type: "uint256"
		}, {
			name: "actual",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "ChainIdMismatch"
	},
	{
		type: "error",
		inputs: [],
		name: "ChildSelectorNotEmpty"
	},
	{
		type: "error",
		inputs: [{
			name: "contractAddress",
			internalType: "address",
			type: "address"
		}],
		name: "ContractPolicyNotRegistered"
	},
	{
		type: "error",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "DuplicatedPolicyTemplate"
	},
	{
		type: "error",
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address"
		}],
		name: "EasAttestationExpired"
	},
	{
		type: "error",
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address"
		}],
		name: "EasAttestationLookupFailed"
	},
	{
		type: "error",
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address"
		}],
		name: "EasAttestationRequired"
	},
	{
		type: "error",
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address"
		}],
		name: "EasAttestationRevoked"
	},
	{
		type: "error",
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address"
		}],
		name: "EasNoAttestationReceived"
	},
	{
		type: "error",
		inputs: [{
			name: "eventKind",
			internalType: "string",
			type: "string"
		}, {
			name: "reason",
			internalType: "string",
			type: "string"
		}],
		name: "EventEmitFailed"
	},
	{
		type: "error",
		inputs: [{
			name: "maxLimit",
			internalType: "uint256",
			type: "uint256"
		}, {
			name: "value",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "ExceededAgentTransferLimit"
	},
	{
		type: "error",
		inputs: [
			{
				name: "maxLimit",
				internalType: "uint256",
				type: "uint256"
			},
			{
				name: "value",
				internalType: "uint256",
				type: "uint256"
			},
			{
				name: "resetAt",
				internalType: "uint256",
				type: "uint256"
			}
		],
		name: "ExceededPeriodicVolume"
	},
	{
		type: "error",
		inputs: [],
		name: "FeeCapTooHigh"
	},
	{
		type: "error",
		inputs: [],
		name: "FloorDataGasTooLow"
	},
	{
		type: "error",
		inputs: [],
		name: "ForEachChildAbsent"
	},
	{
		type: "error",
		inputs: [],
		name: "ForEachSubjectUnspecified"
	},
	{
		type: "error",
		inputs: [],
		name: "GasLimitExceeded"
	},
	{
		type: "error",
		inputs: [],
		name: "GasPriceTooLow"
	},
	{
		type: "error",
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address"
		}],
		name: "InDenylist"
	},
	{
		type: "error",
		inputs: [],
		name: "InsufficientFee"
	},
	{
		type: "error",
		inputs: [],
		name: "InternalError"
	},
	{
		type: "error",
		inputs: [],
		name: "IntrinsicGasTooLow"
	},
	{
		type: "error",
		inputs: [{
			name: "bad",
			internalType: "string",
			type: "string"
		}],
		name: "InvalidAddress"
	},
	{
		type: "error",
		inputs: [{
			name: "amount",
			internalType: "string",
			type: "string"
		}],
		name: "InvalidAmount"
	},
	{
		type: "error",
		inputs: [],
		name: "InvalidCall"
	},
	{
		type: "error",
		inputs: [{
			name: "height",
			internalType: "string",
			type: "string"
		}],
		name: "InvalidHeight"
	},
	{
		type: "error",
		inputs: [{
			name: "expected",
			internalType: "uint256",
			type: "uint256"
		}, {
			name: "got",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "InvalidNumberOfArgs"
	},
	{
		type: "error",
		inputs: [
			{
				name: "method",
				internalType: "string",
				type: "string"
			},
			{
				name: "index",
				internalType: "uint256",
				type: "uint256"
			},
			{
				name: "value",
				internalType: "string",
				type: "string"
			}
		],
		name: "InvalidPageRequest"
	},
	{
		type: "error",
		inputs: [{
			name: "input",
			internalType: "bytes",
			type: "bytes"
		}],
		name: "InvalidParameter"
	},
	{
		type: "error",
		inputs: [{
			name: "input",
			internalType: "string",
			type: "string"
		}],
		name: "InvalidPolicyTemplate"
	},
	{
		type: "error",
		inputs: [{
			name: "pubkey",
			internalType: "string",
			type: "string"
		}],
		name: "InvalidPubkey"
	},
	{
		type: "error",
		inputs: [{
			name: "got",
			internalType: "uint256",
			type: "uint256"
		}, {
			name: "expected",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "InvalidPubkeySize"
	},
	{
		type: "error",
		inputs: [{
			name: "input",
			internalType: "bytes",
			type: "bytes"
		}],
		name: "InvalidSelector"
	},
	{
		type: "error",
		inputs: [],
		name: "InvalidSender"
	},
	{
		type: "error",
		inputs: [{
			name: "got",
			internalType: "string",
			type: "string"
		}],
		name: "InvalidStructType"
	},
	{
		type: "error",
		inputs: [{
			name: "index",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "LogicalPolicyChildNil"
	},
	{
		type: "error",
		inputs: [],
		name: "LogicalPolicyChildrenEmpty"
	},
	{
		type: "error",
		inputs: [{
			name: "maxDepth",
			internalType: "uint8",
			type: "uint8"
		}],
		name: "MaxDepthExceeded"
	},
	{
		type: "error",
		inputs: [{
			name: "msgMethod",
			internalType: "string",
			type: "string"
		}, {
			name: "reason",
			internalType: "string",
			type: "string"
		}],
		name: "MsgServerFailed"
	},
	{
		type: "error",
		inputs: [],
		name: "NonceGap"
	},
	{
		type: "error",
		inputs: [],
		name: "NonceTooLow"
	},
	{
		type: "error",
		inputs: [{
			name: "contractAddress",
			internalType: "address",
			type: "address"
		}],
		name: "PclProxyNotRegistered"
	},
	{
		type: "error",
		inputs: [{
			name: "contractAddress",
			internalType: "address",
			type: "address"
		}],
		name: "PolicyAlreadyRegistered"
	},
	{
		type: "error",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "PolicyNotRegistered"
	},
	{
		type: "error",
		inputs: [],
		name: "PolicyTemplateInUse"
	},
	{
		type: "error",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "PolicyTemplateNotFound"
	},
	{
		type: "error",
		inputs: [],
		name: "QuantifierUnspecified"
	},
	{
		type: "error",
		inputs: [{
			name: "queryMethod",
			internalType: "string",
			type: "string"
		}, {
			name: "reason",
			internalType: "string",
			type: "string"
		}],
		name: "QueryFailed"
	},
	{
		type: "error",
		inputs: [{
			name: "msgSender",
			internalType: "address",
			type: "address"
		}, {
			name: "requester",
			internalType: "address",
			type: "address"
		}],
		name: "RequesterIsNotMsgSender"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKInsufficientFunds"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKInvalidAddress"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKInvalidCoins"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKInvalidRequest"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKInvalidType"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKNotFound"
	},
	{
		type: "error",
		inputs: [],
		name: "SDKUnauthorized"
	},
	{
		type: "error",
		inputs: [],
		name: "TipAboveFeeCap"
	},
	{
		type: "error",
		inputs: [],
		name: "TipTooHigh"
	},
	{
		type: "error",
		inputs: [],
		name: "Unauthorized"
	},
	{
		type: "error",
		inputs: [{
			name: "subject",
			internalType: "uint8",
			type: "uint8"
		}],
		name: "UnknownForEachSubject"
	},
	{
		type: "error",
		inputs: [{
			name: "methodName",
			internalType: "string",
			type: "string"
		}],
		name: "UnknownMethod"
	},
	{
		type: "error",
		inputs: [],
		name: "UnknownPolicyConfigType"
	},
	{
		type: "error",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "UnknownPolicyType"
	},
	{
		type: "error",
		inputs: [{
			name: "codespace",
			internalType: "string",
			type: "string"
		}, {
			name: "code",
			internalType: "uint32",
			type: "uint32"
		}],
		name: "UnmappedCosmosError"
	},
	{
		type: "error",
		inputs: [{
			name: "maxLimit",
			internalType: "uint256",
			type: "uint256"
		}, {
			name: "value",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "VolumeAboveMaxLimit"
	},
	{
		type: "error",
		inputs: [{
			name: "minLimit",
			internalType: "uint256",
			type: "uint256"
		}, {
			name: "value",
			internalType: "uint256",
			type: "uint256"
		}],
		name: "VolumeBelowMinLimit"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [
			{
				name: "contractAddress",
				internalType: "address",
				type: "address",
				indexed: true
			},
			{
				name: "admin",
				internalType: "address",
				type: "address",
				indexed: false
			},
			{
				name: "policies",
				internalType: "struct PolicySet[]",
				type: "tuple[]",
				components: [
					{
						name: "templateId",
						internalType: "string",
						type: "string"
					},
					{
						name: "policy",
						internalType: "bytes",
						type: "bytes"
					},
					{
						name: "selector",
						internalType: "bytes",
						type: "bytes"
					}
				],
				indexed: false
			}
		],
		name: "ContractPoliciesChanged"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [{
			name: "contractAddress",
			internalType: "address",
			type: "address",
			indexed: true
		}],
		name: "ContractPoliciesRemoved"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [],
		name: "GlobalPoliciesRemoved"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [{
			name: "policies",
			internalType: "struct PolicySet[]",
			type: "tuple[]",
			components: [
				{
					name: "templateId",
					internalType: "string",
					type: "string"
				},
				{
					name: "policy",
					internalType: "bytes",
					type: "bytes"
				},
				{
					name: "selector",
					internalType: "bytes",
					type: "bytes"
				}
			],
			indexed: false
		}],
		name: "GlobalPoliciesSet"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [
			{
				name: "proxy",
				internalType: "address",
				type: "address",
				indexed: true
			},
			{
				name: "deployer",
				internalType: "address",
				type: "address",
				indexed: true
			},
			{
				name: "kind",
				internalType: "enum PclProxyKind",
				type: "uint8",
				indexed: false
			}
		],
		name: "PclProxyDeployed"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [{
			name: "sender",
			internalType: "address",
			type: "address",
			indexed: true
		}, {
			name: "contractAddress",
			internalType: "address",
			type: "address",
			indexed: true
		}],
		name: "PolicyCheckPassed"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string",
			indexed: false
		}],
		name: "PolicyTemplateRegistered"
	},
	{
		type: "event",
		anonymous: false,
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string",
			indexed: false
		}],
		name: "PolicyTemplateRemoved"
	},
	{
		type: "function",
		inputs: [
			{
				name: "",
				internalType: "struct EasPolicy",
				type: "tuple",
				components: [
					{
						name: "easContract",
						internalType: "address",
						type: "address"
					},
					{
						name: "indexContract",
						internalType: "address",
						type: "address"
					},
					{
						name: "schemaUid",
						internalType: "bytes32",
						type: "bytes32"
					}
				]
			},
			{
				name: "",
				internalType: "struct DenylistPolicy",
				type: "tuple",
				components: [{
					name: "addresses",
					internalType: "address[]",
					type: "address[]"
				}]
			},
			{
				name: "",
				internalType: "struct VolumePolicy",
				type: "tuple",
				components: [{
					name: "tokens",
					internalType: "string[]",
					type: "string[]"
				}, {
					name: "limits",
					internalType: "struct VolumeUnitPolicy[]",
					type: "tuple[]",
					components: [{
						name: "minLimit",
						internalType: "uint256",
						type: "uint256"
					}, {
						name: "maxLimit",
						internalType: "uint256",
						type: "uint256"
					}]
				}]
			},
			{
				name: "",
				internalType: "struct PeriodicVolumePolicy",
				type: "tuple",
				components: [{
					name: "tokens",
					internalType: "string[]",
					type: "string[]"
				}, {
					name: "limits",
					internalType: "struct UnitPeriodicVolumePolicy[]",
					type: "tuple[]",
					components: [{
						name: "maxAmount",
						internalType: "uint256",
						type: "uint256"
					}, {
						name: "resetPeriodSeconds",
						internalType: "uint64",
						type: "uint64"
					}]
				}]
			},
			{
				name: "",
				internalType: "struct AgentOkrwTransferLimitPolicy",
				type: "tuple",
				components: [{
					name: "reserved",
					internalType: "uint256",
					type: "uint256"
				}]
			},
			{
				name: "",
				internalType: "struct LogicalPolicy",
				type: "tuple",
				components: [{
					name: "quantifier",
					internalType: "enum LogicalQuantifier",
					type: "uint8"
				}, {
					name: "children",
					internalType: "struct PolicySet[]",
					type: "tuple[]",
					components: [
						{
							name: "templateId",
							internalType: "string",
							type: "string"
						},
						{
							name: "policy",
							internalType: "bytes",
							type: "bytes"
						},
						{
							name: "selector",
							internalType: "bytes",
							type: "bytes"
						}
					]
				}]
			},
			{
				name: "",
				internalType: "struct ForEachPolicy",
				type: "tuple",
				components: [
					{
						name: "quantifier",
						internalType: "enum ForEachQuantifier",
						type: "uint8"
					},
					{
						name: "subject",
						internalType: "enum ForEachSubject",
						type: "uint8"
					},
					{
						name: "child",
						internalType: "struct PolicySet",
						type: "tuple",
						components: [
							{
								name: "templateId",
								internalType: "string",
								type: "string"
							},
							{
								name: "policy",
								internalType: "bytes",
								type: "bytes"
							},
							{
								name: "selector",
								internalType: "bytes",
								type: "bytes"
							}
						]
					}
				]
			}
		],
		name: "_policies",
		outputs: [],
		stateMutability: "pure"
	},
	{
		type: "function",
		inputs: [{
			name: "policy",
			internalType: "struct ContractPolicyConfig",
			type: "tuple",
			components: [
				{
					name: "_contract",
					internalType: "address",
					type: "address"
				},
				{
					name: "admin",
					internalType: "address",
					type: "address"
				},
				{
					name: "policies",
					internalType: "struct PolicySet[]",
					type: "tuple[]",
					components: [
						{
							name: "templateId",
							internalType: "string",
							type: "string"
						},
						{
							name: "policy",
							internalType: "bytes",
							type: "bytes"
						},
						{
							name: "selector",
							internalType: "bytes",
							type: "bytes"
						}
					]
				}
			]
		}],
		name: "changeContractPolicies",
		outputs: [],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [
			{
				name: "contractAddress",
				internalType: "address",
				type: "address"
			},
			{
				name: "user",
				internalType: "address",
				type: "address"
			},
			{
				name: "selector",
				internalType: "bytes",
				type: "bytes"
			},
			{
				name: "asset",
				internalType: "string",
				type: "string"
			},
			{
				name: "resolveAgentOwners",
				internalType: "bool",
				type: "bool"
			},
			{
				name: "pageRequest",
				internalType: "struct PageRequest",
				type: "tuple",
				components: [
					{
						name: "key",
						internalType: "bytes",
						type: "bytes"
					},
					{
						name: "offset",
						internalType: "uint64",
						type: "uint64"
					},
					{
						name: "limit",
						internalType: "uint64",
						type: "uint64"
					},
					{
						name: "countTotal",
						internalType: "bool",
						type: "bool"
					},
					{
						name: "reverse",
						internalType: "bool",
						type: "bool"
					}
				]
			}
		],
		name: "contractPeriodicList",
		outputs: [{
			name: "statuses",
			internalType: "struct PeriodicVolume[]",
			type: "tuple[]",
			components: [
				{
					name: "amount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "maxAmount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "resetPeriodSeconds",
					internalType: "uint64",
					type: "uint64"
				},
				{
					name: "resetAt",
					internalType: "uint64",
					type: "uint64"
				}
			]
		}, {
			name: "pageResponse",
			internalType: "struct PageResponse",
			type: "tuple",
			components: [{
				name: "nextKey",
				internalType: "bytes",
				type: "bytes"
			}, {
				name: "total",
				internalType: "uint64",
				type: "uint64"
			}]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [
			{
				name: "contractAddress",
				internalType: "address",
				type: "address"
			},
			{
				name: "user",
				internalType: "address",
				type: "address"
			},
			{
				name: "selector",
				internalType: "bytes",
				type: "bytes"
			},
			{
				name: "asset",
				internalType: "string",
				type: "string"
			},
			{
				name: "resetPeriodSeconds",
				internalType: "uint64",
				type: "uint64"
			},
			{
				name: "resolveAgentOwners",
				internalType: "bool",
				type: "bool"
			}
		],
		name: "contractPeriodicVolume",
		outputs: [{
			name: "statuses",
			internalType: "struct PeriodicVolume[]",
			type: "tuple[]",
			components: [
				{
					name: "amount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "maxAmount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "resetPeriodSeconds",
					internalType: "uint64",
					type: "uint64"
				},
				{
					name: "resetAt",
					internalType: "uint64",
					type: "uint64"
				}
			]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [{
			name: "contractAddress",
			internalType: "address",
			type: "address"
		}],
		name: "contractPolicies",
		outputs: [{
			name: "",
			internalType: "struct ContractPolicyConfig",
			type: "tuple",
			components: [
				{
					name: "_contract",
					internalType: "address",
					type: "address"
				},
				{
					name: "admin",
					internalType: "address",
					type: "address"
				},
				{
					name: "policies",
					internalType: "struct PolicySet[]",
					type: "tuple[]",
					components: [
						{
							name: "templateId",
							internalType: "string",
							type: "string"
						},
						{
							name: "policy",
							internalType: "bytes",
							type: "bytes"
						},
						{
							name: "selector",
							internalType: "bytes",
							type: "bytes"
						}
					]
				}
			]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [
			{
				name: "kind",
				internalType: "enum PclProxyKind",
				type: "uint8"
			},
			{
				name: "value",
				internalType: "uint256",
				type: "uint256"
			},
			{
				name: "initData",
				internalType: "bytes",
				type: "bytes"
			}
		],
		name: "deployPclProxy",
		outputs: [{
			name: "proxy",
			internalType: "address",
			type: "address"
		}],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [],
		name: "getParams",
		outputs: [{
			name: "",
			internalType: "struct PclParams",
			type: "tuple",
			components: [{
				name: "policyAdmin",
				internalType: "address",
				type: "address"
			}, {
				name: "entrypoints",
				internalType: "address[]",
				type: "address[]"
			}]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [
			{
				name: "user",
				internalType: "address",
				type: "address"
			},
			{
				name: "asset",
				internalType: "string",
				type: "string"
			},
			{
				name: "resolveAgentOwners",
				internalType: "bool",
				type: "bool"
			},
			{
				name: "pageRequest",
				internalType: "struct PageRequest",
				type: "tuple",
				components: [
					{
						name: "key",
						internalType: "bytes",
						type: "bytes"
					},
					{
						name: "offset",
						internalType: "uint64",
						type: "uint64"
					},
					{
						name: "limit",
						internalType: "uint64",
						type: "uint64"
					},
					{
						name: "countTotal",
						internalType: "bool",
						type: "bool"
					},
					{
						name: "reverse",
						internalType: "bool",
						type: "bool"
					}
				]
			}
		],
		name: "globalPeriodicList",
		outputs: [{
			name: "statuses",
			internalType: "struct PeriodicVolume[]",
			type: "tuple[]",
			components: [
				{
					name: "amount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "maxAmount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "resetPeriodSeconds",
					internalType: "uint64",
					type: "uint64"
				},
				{
					name: "resetAt",
					internalType: "uint64",
					type: "uint64"
				}
			]
		}, {
			name: "pageResponse",
			internalType: "struct PageResponse",
			type: "tuple",
			components: [{
				name: "nextKey",
				internalType: "bytes",
				type: "bytes"
			}, {
				name: "total",
				internalType: "uint64",
				type: "uint64"
			}]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [
			{
				name: "user",
				internalType: "address",
				type: "address"
			},
			{
				name: "asset",
				internalType: "string",
				type: "string"
			},
			{
				name: "resetPeriodSeconds",
				internalType: "uint64",
				type: "uint64"
			},
			{
				name: "resolveAgentOwners",
				internalType: "bool",
				type: "bool"
			}
		],
		name: "globalPeriodicVolume",
		outputs: [{
			name: "statuses",
			internalType: "struct PeriodicVolume[]",
			type: "tuple[]",
			components: [
				{
					name: "amount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "maxAmount",
					internalType: "uint256",
					type: "uint256"
				},
				{
					name: "resetPeriodSeconds",
					internalType: "uint64",
					type: "uint64"
				},
				{
					name: "resetAt",
					internalType: "uint64",
					type: "uint64"
				}
			]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [],
		name: "globalPolicies",
		outputs: [{
			name: "",
			internalType: "struct GlobalPolicyConfig",
			type: "tuple",
			components: [{
				name: "policies",
				internalType: "struct PolicySet[]",
				type: "tuple[]",
				components: [
					{
						name: "templateId",
						internalType: "string",
						type: "string"
					},
					{
						name: "policy",
						internalType: "bytes",
						type: "bytes"
					},
					{
						name: "selector",
						internalType: "bytes",
						type: "bytes"
					}
				]
			}]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [{
			name: "proxy",
			internalType: "address",
			type: "address"
		}],
		name: "pclProxy",
		outputs: [{
			name: "",
			internalType: "struct PclProxyEntry",
			type: "tuple",
			components: [
				{
					name: "kind",
					internalType: "enum PclProxyKind",
					type: "uint8"
				},
				{
					name: "admin",
					internalType: "address",
					type: "address"
				},
				{
					name: "proxy",
					internalType: "address",
					type: "address"
				}
			]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [],
		name: "policyAdmin",
		outputs: [{
			name: "",
			internalType: "address",
			type: "address"
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "policyTemplate",
		outputs: [{
			name: "",
			internalType: "struct PolicyTemplate",
			type: "tuple",
			components: [
				{
					name: "templateId",
					internalType: "string",
					type: "string"
				},
				{
					name: "name",
					internalType: "string",
					type: "string"
				},
				{
					name: "description",
					internalType: "string",
					type: "string"
				}
			]
		}],
		stateMutability: "view"
	},
	{
		type: "function",
		inputs: [
			{
				name: "sessionId",
				internalType: "bytes32",
				type: "bytes32"
			},
			{
				name: "contractAddress",
				internalType: "address",
				type: "address"
			},
			{
				name: "principal",
				internalType: "address",
				type: "address"
			},
			{
				name: "data",
				internalType: "bytes",
				type: "bytes"
			},
			{
				name: "value",
				internalType: "uint256",
				type: "uint256"
			},
			{
				name: "workable",
				internalType: "bool",
				type: "bool"
			}
		],
		name: "postCall",
		outputs: [{
			name: "",
			internalType: "bytes",
			type: "bytes"
		}],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [
			{
				name: "contractAddress",
				internalType: "address",
				type: "address"
			},
			{
				name: "principal",
				internalType: "address",
				type: "address"
			},
			{
				name: "data",
				internalType: "bytes",
				type: "bytes"
			},
			{
				name: "value",
				internalType: "uint256",
				type: "uint256"
			}
		],
		name: "preCall",
		outputs: [{
			name: "sessionId",
			internalType: "bytes32",
			type: "bytes32"
		}],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "registerPolicyTemplate",
		outputs: [],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [{
			name: "contractAddress",
			internalType: "address",
			type: "address"
		}],
		name: "removeContractPolicies",
		outputs: [],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [],
		name: "removeGlobalPolicies",
		outputs: [],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [{
			name: "templateId",
			internalType: "string",
			type: "string"
		}],
		name: "removePolicyTemplate",
		outputs: [],
		stateMutability: "nonpayable"
	},
	{
		type: "function",
		inputs: [{
			name: "newConfig",
			internalType: "struct GlobalPolicyConfig",
			type: "tuple",
			components: [{
				name: "policies",
				internalType: "struct PolicySet[]",
				type: "tuple[]",
				components: [
					{
						name: "templateId",
						internalType: "string",
						type: "string"
					},
					{
						name: "policy",
						internalType: "bytes",
						type: "bytes"
					},
					{
						name: "selector",
						internalType: "bytes",
						type: "bytes"
					}
				]
			}]
		}],
		name: "setGlobalPolicies",
		outputs: [],
		stateMutability: "nonpayable"
	}
] as const;

const mainnets = {
	homestead: {
		id: 1,
		chainId: '0x1',
		rpcUrls: ['https://mainnet.infura.io/v3/'],
		chainName: 'Ethereum Mainnet',
		nativeCurrency: {
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://etherscan.io/'],
	},
	polygon: {
		id: 137,
		chainId: '0x89',
		rpcUrls: ['https://polygon-rpc.com/'],
		chainName: 'Polygon Mainnet',
		nativeCurrency: {
			name: 'MATIC',
			symbol: 'MATIC',
			decimals: 18,
		},
		blockExplorerUrls: ['https://polygonscan.com/'],
	},
	polygonZkevm: {
		id: 1101,
		chainId: '0x44d',
		rpcUrls: ['https://zkevm-rpc.com/'],
		chainName: 'Polygon zkEVM',
		nativeCurrency: {
			name: 'ETH',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://zkevm.polygonscan.com/'],
	},
	zksync: {
		id: 324,
		chainId: '0x144',
		rpcUrls: ['https://mainnet.era.zksync.io'],
		chainName: 'zkSync Mainnet',
		nativeCurrency: {
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://explorer.zksync.io'],
	},
};
const testnets = {
	sepolia: {
		id: 11155111,
		chainId: '0xaa36a7',
		rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
		chainName: 'Sepolia Test Network',
		nativeCurrency: {
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://sepolia.etherscan.io/'],
	},
	polygonAmoy: {
		id: 80002,
		chainId: '0x13882',
		rpcUrls: ['https://polygon-amoy.drpc.org/'],
		chainName: 'Amoy',
		nativeCurrency: {
			name: 'MATIC',
			symbol: 'MATIC',
			decimals: 18,
		},
		blockExplorerUrls: ['https://www.oklink.com/amoy/'],
	},
	polygonCardona: {
		id: 2442,
		chainId: '0x98a',
		rpcUrls: ['https://rpc.cardona.zkevm-rpc.com/'],
		chainName: 'Cardona zkEVM Testnet',
		nativeCurrency: {
			name: 'ETH',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://www.oklink.com/amoy/'],
	},
	zksyncSepolia: {
		id: 300,
		chainId: '0x12c',
		rpcUrls: ['https://sepolia.era.zksync.dev/'],
		chainName: 'zkSync Sepolia Testnet',
		nativeCurrency: {
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://sepolia.explorer.zksync.io/'],
	},
};

module.exports = { mainnets, testnets };

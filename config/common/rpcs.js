require('dotenv').config();

const mainnets = {
	homestead: {
		id: 1,
		chainId: '0x1',
		rpcUrls: ['https://rpc.ankr.com/eth/'],
		chainName: 'Ethereum Mainnet',
		nativeCurrency: {
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://etherscan.io/'],
		scannerApiUrl: 'https://api.etherscan.io/api',
		scannerApiKey: process.env.ETHERSCAN_API_KEY,
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
		scannerApiUrl: 'https://api.polygonscan.com/api',
		scannerApiKey: process.env.POLYGONSCAN_API_KEY,
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
		scannerApiUrl: 'https://api-zkevm.polygonscan.com/api',
		scannerApiKey: process.env.POLYGONSCAN_ZKEVM_API_KEY,
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
		scannerApiUrl: '',
		scannerApiKey: '',
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
		scannerApiUrl: 'https://api-sepolia.etherscan.io/api',
		scannerApiKey: process.env.ETHERSCAN_API_KEY,
	},
	polygonAmoy: {
		id: 80002,
		chainId: '0x13882',
		rpcUrls: ['https://polygon-amoy.blockpi.network/v1/rpc/public/'],
		chainName: 'Amoy',
		nativeCurrency: {
			name: 'MATIC',
			symbol: 'MATIC',
			decimals: 18,
		},
		blockExplorerUrls: ['https://amoy.polygonscan.com/'],
		scannerApiUrl: 'https://api-amoy.polygonscan.com/api',
		scannerApiKey: process.env.POLYGONSCAN_API_KEY,
	},
	polygonZkEVMTestnet: {
		id: 2442,
		chainId: '0x98a',
		rpcUrls: ['https://rpc.cardona.zkevm-rpc.com/'],
		chainName: 'Cardona zkEVM Testnet',
		nativeCurrency: {
			name: 'ETH',
			symbol: 'ETH',
			decimals: 18,
		},
		blockExplorerUrls: ['https://cardona-zkevm.polygonscan.com/'],
		scannerApiUrl: 'https://api-cardona-zkevm.polygonscan.com/api',
		scannerApiKey: process.env.POLYGONSCAN_ZKEVM_API_KEY,
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
		scannerApiUrl: '',
		scannerApiKey: '',
	},
};

const isTestnet = (chainId) => {
	for (const name of Object.keys(testnets))
		if (testnets[name].id === parseInt(chainId)) return true;
	return false;
};

module.exports = { mainnets, testnets, isTestnet };

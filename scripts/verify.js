// require('../utils/evm/diagnostics');
const hre = require('hardhat');
const { ethers } = hre;
const { isTestnet, isLocalhost } = require('./utils/hardhat');
const oracles = require('./utils/oracles');
const contract = require('./utils/contract');
const { verification } = require('./utils/deployment');

(async () => {
	console.log('\nRunning Verification!');
	const { chainId } = await ethers.provider.getNetwork();
	if (isLocalhost(chainId)) return;

	const notMainnet = isTestnet(chainId);
	if (notMainnet) {
		await verification({
			address: contract.address('WETH9', chainId),
			constructorArguments: [],
			contract: 'contracts/mocks/Mock20.sol:WETH9',
		});
		await verification({
			address: contract.address('WMATIC', chainId),
			constructorArguments: [],
			contract: 'contracts/mocks/Mock20.sol:WMATIC',
		});
	}

	await verification({
		address: contract.address('AssetBoundToken', chainId),
		constructorArguments: [],
		contract: 'contracts/tokens/AssetBoundToken.sol:AssetBoundToken',
	});

	const nativeOracle = oracles[chainId.toString()];
	// TODO get token addresses
	const nativeToken = notMainnet
		? contract.address('WETH9', chainId)
		: contract.address('WETH9', chainId);

	await verification({
		address: contract.address('NiovMarket', chainId),
		constructorArguments: [nativeOracle, nativeToken],
	});

	await verification({
		address: contract.address('MarketReader', chainId),
		constructorArguments: [contract.address('NiovMarket', chainId)],
	});
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

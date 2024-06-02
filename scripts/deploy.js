// require('../utils/evm/diagnostics');
const hre = require('hardhat');
const { ethers } = hre;
const { isTestnet, isLocalhost, checkBalances } = require('./utils/hardhat');
const deployment = require('./utils/deployment');
const oracles = require('./utils/oracles');

// For contracts that are deployed by a factory contract
function xfer(contractName) {
	const roots = ['.', '../backend', '../frontend'];
	deployment.transferAbi(contractName, roots);
}

(async () => {
	await checkBalances();
	console.log('\nRunning Deployment!');
	const { chainId } = await ethers.provider.getNetwork();
	const isDev = isLocalhost(chainId);
	const notMainnet = isDev || isTestnet(chainId);

	let EthereumLinkSim, PolygonLinkSim;
	if (isDev) {
		EthereumLinkSim = await deployment.andVerify('EthereumLinkSim');
		PolygonLinkSim = await deployment.andVerify('PolygonLinkSim');
	}

	let WETH9, WMATIC;
	if (notMainnet) {
		WETH9 = await deployment.andVerify(
			'WETH9',
			[],
			'contracts/mocks/Mock20.sol:WETH9'
		);
		WMATIC = await deployment.andVerify(
			'WMATIC',
			[],
			'contracts/mocks/Mock20.sol:WMATIC'
		);
	}

	const AssetBoundToken = await deployment.andVerify(
		'AssetBoundToken',
		[],
		'contracts/tokens/AssetBoundToken.sol:AssetBoundToken'
	);

	const nativeOracle = isDev
		? EthereumLinkSim.target
		: oracles[chainId.toString()];

	// TODO get token addresses
	const nativeToken = notMainnet ? WETH9.target : WETH9.target;

	const NiovMarket = await deployment.andVerify('NiovMarket', [
		nativeOracle,
		nativeToken,
	]);

	const MarketReader = await deployment.andVerify('MarketReader', [
		NiovMarket.target,
	]);

	// // xfer('ABT010');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

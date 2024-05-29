// require('../utils/evm/diagnostics');
const hre = require('hardhat');
const { ethers } = hre;
const { isLocalhost, checkBalances } = require('./utils/hardhat');
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

	let EthereumLinkSim, PolygonLinkSim, WETH9, WMATIC;
	if (isDev) {
		EthereumLinkSim = await deployment.andVerify('EthereumLinkSim');
		PolygonLinkSim = await deployment.andVerify('PolygonLinkSim');
		WETH9 = await deployment.andVerify('WETH9');
		WMATIC = await deployment.andVerify('WMATIC');
	}

	const AssetBoundToken = await deployment.andVerify('AssetBoundToken');

	const nativeOracle = isDev
		? EthereumLinkSim.target
		: oracles[chainId.toString()];

	// TODO get token addresses
	const nativeToken = isDev ? WETH9.target : WETH9.target;

	const NiovMarket = await deployment.andVerify('NiovMarket', [
		nativeOracle,
		nativeToken,
	]);

	// xfer('ABT010');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

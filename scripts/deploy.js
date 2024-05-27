// require('../utils/evm/diagnostics');
const hre = require('hardhat');
const { ethers } = hre;
const fundTestnetAccounts = require('./utils/funding');
const deployment = require('../utils/evm/deployment');
const oracles = require('./utils/oracles');

(async () => {
	const { chainId } = await ethers.provider.getNetwork();
	const isDev = parseInt(chainId) === 31337 || chainId === 1337;

	let EthereumLinkSim, PolygonLinkSim, WETH9, WMATIC;
	if (isDev) {
		await fundTestnetAccounts();
		EthereumLinkSim = await deployment.andVerify('EthereumLinkSim', chainId);
		PolygonLinkSim = await deployment.andVerify('PolygonLinkSim', chainId);
		WETH9 = await deployment.andVerify('WETH9', chainId);
		WMATIC = await deployment.andVerify('WMATIC', chainId);
	}

	const AssetBoundToken = await deployment.andVerify(
		'AssetBoundToken',
		chainId
	);
	const NiovLigandToken = await deployment.andVerify(
		'NiovLigandToken',
		chainId
	);

	const nativeOracle = isDev
		? EthereumLinkSim.target
		: oracles[chainId.toString()];

	// TODO get token addresses
	const nativeToken = isDev ? WETH9.target : WETH9.target;

	const NiovMarket = await deployment.andVerify('NiovMarket', chainId, [
		nativeOracle,
		nativeToken,
	]);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

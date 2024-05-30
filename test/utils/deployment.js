const { ethers } = require('hardhat');
const { deploy } = require('./setup');
const { deployContract } = require('./setup');

async function deployCoreContracts(deployer) {
	const token = await deployContract(deployer, 'WETH9');
	const oracle = await deployContract(deployer, 'EthereumLinkSim');
	const market = await deployContract(deployer, 'NiovMarket', [
		oracle.target,
		token.target,
	]);
	const nft = await deployContract(deployer, 'AssetBoundToken');
	return { token, oracle, market, nft };
}

module.exports = { deployCoreContracts };

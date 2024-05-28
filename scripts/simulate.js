const hre = require('hardhat');
const { ethers } = hre;
const contractUtils = require('../utils/evm/contract');

const simulation = async (environment) => {
	const { deployer, accounts, market, abt, gasToken } = environment;
};

(async () => {
	// gather signer objects
	let deployer, accounts;
	[deployer, ...accounts] = await ethers.getSigners();

	// gather contracts on localhost
	const market = contractUtils.retrieve('NiovMarket', 31337, deployer);
	const abt = contractUtils.retrieve('AssetBoundToken', 31337, deployer);

	// get tokens for marketplace and approve for interaction
	for (const account of accounts) {
		for (let i = 0; i < 5; i++) await abt.mintTo(account.address);
		const inventory = await abt.inventoryOf(account.address);
		for (let i = 0; i < inventory.length; i++)
			await abt.connect(account).approve(market.target, inventory[i]);
	}

	await simulation(environment);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

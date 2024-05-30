const { ethers } = require('hardhat');

async function deployContract(deployer, contractName, args = []) {
	const ContractFactory = await ethers.getContractFactory(contractName);
	const deployedContract = await ContractFactory.connect(deployer).deploy(
		...args
	);
	return deployedContract.connect(deployer);
}

module.exports = { deployContract };

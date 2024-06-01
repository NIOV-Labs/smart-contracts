const fs = require('fs');
const hre = require('hardhat');
const { ethers, artifacts, config, network } = hre;
const Cache = require('../../utils/Cache');
const { verifiable } = require('../../config/networks');

const primarySigner = () => {
	const privateKeys = config.networks.homestead.accounts;
	const signer = new ethers.Wallet(privateKeys[0], ethers.provider);
	return signer;
};

function saveAddress(contractName, roots, chainId, contract) {
	roots.forEach((repo) => {
		// set this to `${repo}/deployments/map` in the future to match
		let destination = `${repo}/utils/deploymentMap`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination, true);
		const deploymentMap = new Cache(`${destination}/${chainId}.json`);
		deploymentMap.replace(contractName, contract.target);
	});
}

function transferAbi(contractName, roots) {
	// set this to `${repo}/deployments/interfaces` in the future
	roots.forEach((repo) => {
		let destination = `${repo}/utils/interfaces`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination, true);
		const abi = new Cache(`${destination}/${contractName}.json`);
		abi.update({ abi: artifacts.readArtifactSync(contractName).abi });
	});
}

async function runDeployment(contractName, args = []) {
	console.log(`\nDeploying ${contractName}...`);
	const NewFactory = await ethers.getContractFactory(contractName);
	const NewContract = await NewFactory.connect(primarySigner()).deploy(...args);
	await NewContract.waitForDeployment();
	console.log(`|| ${contractName} deployed to ${NewContract.target}`);

	// if using a monorepo for fullstack projects
	// const roots = ['.', '../backend', '../frontend'];
	// otherwise
	// const roots = ['.'];
	const roots = ['.', '../backend', '../frontend'];

	console.log(`|||| Saving address...`);
	const { chainId } = await ethers.provider.getNetwork();
	saveAddress(contractName, roots, chainId, NewContract);
	console.log(`|||| Saving artifacts...`);
	transferAbi(contractName, roots);
	return NewContract;
}

async function verificationLoop(options) {
	const waitTime = 5;
	await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
	try {
		console.log('|| Verifying...');
		await hre.run('verify:verify', options);
		console.log('|||| Verified!');
	} catch (e) {
		if (
			e.toString().split('\n')[2] ===
			`Reason: The Etherscan API responded that the address ${options.address} does not have bytecode.`
		) {
			console.log(
				`|||| Contract not indexed yet, retrying in ${waitTime} seconds...`
			);
			await verificationLoop(options);
		} else throw e;
	}
}

async function andVerify(contractName, args = [], fqn) {
	const NewContract = await runDeployment(contractName, args);
	if (!verifiable(network.name)) return NewContract;

	const options = {
		address: NewContract.target,
		constructorArguments: args.filter((arg) => typeof arg !== typeof {}),
		contract: fqn ? fqn : undefined,
	};
	await verificationLoop(options);

	return NewContract;
}

module.exports = { transferAbi, runDeployment, andVerify };

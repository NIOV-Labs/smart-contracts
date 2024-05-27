const fs = require('fs');
const hre = require('hardhat');
const { ethers, artifacts, network } = hre;
const { verifiable } = require('./credentials');
const Cache = require('../Cache');

const primarySigner = () => {
	const privateKeys = hre.config.networks.mainnet.accounts;
	const primary = privateKeys[0];
	const signer = new hre.ethers.Wallet(primary, hre.ethers.provider);
	// console.log('Primary Signer', signer.address);
	return signer;
};

async function runDeployment(name, chainId, args = []) {
	console.log(`\nDeploying ${name}...`);
	const NewFactory = await ethers.getContractFactory(name);
	const NewContract = await NewFactory.connect(primarySigner()).deploy(...args);

	await NewContract.waitForDeployment();
	console.log(`|| ${name} deployed to ${NewContract.target}`);

	console.log(`|||| Saving address...`);
	const roots = ['.', '../niov-backend', '../niov-frontend'];
	roots.forEach((repo) => {
		let destination = `${repo}/utils`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination);
		destination = `${destination}/deploymentMap`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination);
		const deploymentMap = new Cache(`${destination}/${chainId}.json`);
		deploymentMap.replace(name, NewContract.target);
	});

	console.log(`|||| Saving artifacts...`);
	roots.forEach((repo) => {
		let destination = `${repo}/utils/interfaces`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination);
		const abi = new Cache(`${destination}/${name}.json`);
		abi.update({ abi: artifacts.readArtifactSync(name).abi });
	});

	return NewContract;
}

async function verify(tx, options, chainId) {
	await tx.wait();
	await new Promise((resolve) => setTimeout(resolve, 15000));
	try {
		console.log('|| Verifying...');
		await hre.run('verify:verify', options);
		console.log('|||| Verified!');
	} catch (e) {
		const reason = e.toString().split('\n')[2];
		if (reason === 'Reason: Already Verified')
			console.log('|||||| Double Verified!');
		else if (
			reason ===
			`Reason: The Etherscan API responded that the address ${options.address} does not have bytecode.`
		) {
			console.log('|||| Contract not indexed, re-verifying...');
			await verify(tx, options, chainId);
		} else throw e;
	}
}

async function andVerify(name, chainId, args = [], fqn) {
	const NewContract = await runDeployment(name, chainId, args);
	if (!verifiable(network.name)) return NewContract;

	const tx = NewContract.deployTransaction;

	const options = {
		address: NewContract.target,
		constructorArguments: args.filter((arg) => typeof arg !== typeof {}),
		contract: fqn ? fqn : undefined,
	};

	await verify(tx, options, chainId);

	return NewContract;
}

module.exports = { runDeployment, andVerify };

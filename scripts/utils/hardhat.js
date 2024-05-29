const fs = require('fs');
const Cache = require('../../utils/Cache');
const { ethers, config, artifacts } = require('hardhat');

const isLocalhost = (chainId) => {
	return [31337, 1337].includes(parseInt(chainId));
};

const balanceOf = async (signer) => {
	const balance = await await ethers.provider.getBalance(signer.address);
	return parseInt(balance);
};

const envSigners = () => {
	const privateKeys = config.networks.mainnet.accounts;
	return privateKeys.map((pKey) => new ethers.Wallet(pKey, ethers.provider));
};

async function logBalances(signers) {
	for await (const signer of signers) {
		const idx = signers.indexOf(signer);
		const bal = await balanceOf(signer);
		console.log(
			`|| Account #${idx}: ${signer.address} (${bal / 10 ** 18} ETH)`
		);
	}
}

async function checkBalances() {
	console.log(`Balances on ${ethers.provider._networkName}:`);
	const { chainId } = await ethers.provider.getNetwork();
	const signers = isLocalhost(chainId)
		? envSigners()
		: await ethers.getSigners();
	if (isLocalhost(chainId)) {
		const suppliers = await ethers.getSigners();
		for await (const signer of signers) {
			const idx = signers.indexOf(signer);
			const bal = await balanceOf(signer);
			const supplier = suppliers[suppliers.length - 1 - idx];
			// fund signers if low/empty
			if (bal < 10 * 10 ** 18)
				await supplier.sendTransaction({
					to: signer.address,
					value: ethers.parseUnits('1000', 'ether'),
				});
		}
		await logBalances(signers);
		console.log('\nDEFAULT PROVIDER BALANCES:');
		await logBalances(suppliers);
	} else await logBalances(signers);
}

function transferAbi(contractName) {
	const roots = ['.', '../backend', '../frontend'];
	roots.forEach((repo) => {
		let destination = `${repo}/deployment/interfaces`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination, true);
		const abi = new Cache(`${destination}/${contractName}.json`);
		abi.update({ abi: artifacts.readArtifactSync(contractName).abi });
	});
}

module.exports = {
	isLocalhost,
	balanceOf,
	envSigners,
	checkBalances,
	transferAbi,
};

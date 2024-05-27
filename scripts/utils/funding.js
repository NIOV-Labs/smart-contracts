async function fundTestnetAccounts() {
	console.log('FUNDING TESTNET ACCOUNTS');
	const provider = ethers.provider;
	const defaultSigners = await ethers.getSigners();
	const privateKeys = hre.config.networks.mainnet.accounts;
	let signers = [];
	privateKeys.forEach(async (pKey, idx) => {
		const signer = new ethers.Wallet(pKey, provider);
		signers.push(signer);
		const balance = parseInt(await provider.getBalance(signer.address));
		console.log(`Account #${idx}: ${signer.address} (${balance} wei)`);
		if (balance < ethers.parseUnits('0.5', 'ether')) {
			console.log('TOPPING OFF FUNDS');
			const lastDefSigner = defaultSigners.length - 1;
			await defaultSigners[lastDefSigner - idx].sendTransaction({
				to: signer.address,
				value: ethers.parseUnits('1', 'ether'),
			});
		}
		console.log('\n');
	});
	return { defaultSigners, signers, provider };
}

module.exports = fundTestnetAccounts;

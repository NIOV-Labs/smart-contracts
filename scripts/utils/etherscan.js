const { Etherscan } = require('@nomicfoundation/hardhat-verify/etherscan');
const { mainnets, testnets } = require('../../config/common/rpcs');

const scannerInstance = async () => {
	const { chainId } = await ethers.provider.getNetwork();
	const combined = { ...mainnets, ...testnets };

	for (const name of Object.keys(combined))
		if (parseInt(chainId) === combined[name].id)
			return new Etherscan(
				combined[name].scannerApiKey,
				combined[name].scannerApiUrl,
				combined[name].blockExplorerUrls[0]
			);
};

const etherscanRequest = async (method, address) => {
	try {
		const instance = await scannerInstance();
		const url = `${instance.apiUrl}?module=contract&action=${method}&address=${address}&tag=latest&apikey=${instance.apiKey}`;
		const response = await fetch(url);
		const data = await response.json();
		if (data.message === 'OK') return data.result;
		else throw data;
	} catch (e) {
		console.log(e);
		const waitTime = 5;
		console.log(`retrying in ${waitTime} seconds...`);
		await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
		return await etherscanRequest(method, address);
	}
};

const isVerified = async (address) => {
	console.log('|||| getting source code');
	const result = await etherscanRequest('getsourcecode', address);
	const missingCode = result[0].SourceCode === '';
	const missingAbi = result[0].ABI === 'Contract source code not verified';
	if (missingCode || missingAbi) return false;
	else return true;
};

module.exports = { scannerInstance, etherscanRequest, isVerified };

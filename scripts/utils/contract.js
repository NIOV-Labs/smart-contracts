const ethers = require('ethers');
const Cache = require('../../utils/Cache');

function retrieve(name, chainId, signer) {
	const { abi } = new Cache(`./utils/interfaces/${name}.json`).load();
	const deploymentMap = new Cache(`./utils/deploymentMap/${chainId}.json`);
	const address = deploymentMap.load()[name];
	return new ethers.Contract(address, abi, signer);
}

function interface(name, address, signer) {
	const { abi } = new Cache(`./utils/interfaces/${name}.json`).load();
	return new ethers.Contract(address, abi, signer);
}

module.exports = { retrieve, interface };

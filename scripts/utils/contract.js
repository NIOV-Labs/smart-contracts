const ethers = require('ethers');
const Cache = require('../../utils/Cache');

const address = (name, chainId) => {
	const deploymentMap = new Cache(`./utils/deploymentMap/${chainId}.json`);
	return deploymentMap.load()[name];
};

const abi = (name) => new Cache(`./utils/interfaces/${name}.json`).load().abi;

function retrieve(name, chainId, signer) {
	return new ethers.Contract(address(name, chainId), abi(name), signer);
}

function interface(name, target, signer) {
	return new ethers.Contract(target, abi(name), signer);
}

module.exports = { retrieve, interface, address, abi };

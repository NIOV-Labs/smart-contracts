require('dotenv').config();
const solidity = require('./solidity');
const gasReporter = require('./gasReporter');
const { getCredentials } = require('./networks');

class Config {
	constructor(print = true) {
		this.solidity = solidity.settings;
		this.gasReporter = gasReporter.getSettings(print);
		const { etherscan, networks } = getCredentials(print);
		this.etherscan = etherscan;
		this.networks = networks;
	}
}

module.exports = Config;

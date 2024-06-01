require('dotenv').config();
const options = require('./options');
const { getCredentials } = require('./networks');

class Config {
	constructor(print = true, solidity = options.solidity) {
		const { etherscan, networks } = getCredentials(print);
		this.etherscan = etherscan;
		this.networks = networks;

		const coinmarketcap = process.env.COINMARKETCAP_API_KEY;
		if (print) {
			console.log(`|||| Gas Reporter`);
			if (coinmarketcap === '')
				console.log(`||||||\x1B[92m CoinMarketCap API Key Found!\x1B[39m`);
			else
				console.log(
					`||||||\x1B[33m CoinMarketCap API Key Missing! Unable to report gas consumption...\x1B[39m`
				);
		}
		this.gasReporter =
			coinmarketcap === ''
				? options.gasReporterDisabled
				: { ...options.gasReporterEnabled, coinmarketcap };

		this.solidity = solidity;
	}
}

module.exports = Config;

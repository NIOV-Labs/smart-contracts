require('dotenv').config();

function getSettings(print) {
	const coinmarketcap = process.env.COINMARKETCAP_API_KEY;
	if (print) {
		console.log(`|||| Gas Reporter`);
		if (coinmarketcap)
			console.log(`||||||\x1B[92m CoinMarketCap API Key Found!\x1B[39m`);
		else
			console.log(
				`||||||\x1B[33m CoinMarketCap API Key Missing! Unable to report gas consumption...\x1B[39m`
			);
	}
	return {
		enabled: true,
		currency: 'USD',
		excludeContracts: [],
		coinmarketcap,
	};
}

module.exports = { getSettings };

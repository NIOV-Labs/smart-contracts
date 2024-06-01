require('dotenv').config();
const { mainnets, testnets } = require('./rpcs');
const { getAccounts } = require('./keys');

const credentials = () => {
	let combined = {};
	Object.keys(mainnets).forEach((name) => {
		combined[name] = {};
		combined[name].provider = mainnets[name].rpcUrls[0];
		// combined.scanner = mainnets[name]?.scannerApiKey;
	});
	Object.keys(testnets).forEach((name) => {
		combined[name] = {};
		combined[name].provider = testnets[name].rpcUrls[0];
		// combined.scanner = mainnets[name]?.scannerApiKey;
	});
	return combined;
};

const deployable = (name) => credentials()[name].provider;
const verifiable = (name) => credentials()[name]?.scanner;

function getCredentials(print) {
	if (print)
		console.log(
			'\nPreparing EvmConfig...\n\n|| Credentials\n|||| Scanners & Providers'
		);
	let apiKey = {};
	Object.keys(credentials()).forEach((name) => {
		if (deployable(name)) {
			if (print && !verifiable(name))
				console.log(
					`|||||| \x1B[33m${name} \x1B[39m- Scanner Key Missing (Unable to Verify)`
				);
			else {
				apiKey[name] = verifiable(name);
				if (print) console.log(`||||||\x1B[92m ${name}\x1B[39m`);
			}
		} else {
			if (print)
				console.log(
					`|||||| \x1B[31m${name} \x1B[39m - Provider Missing (Unable to Deploy)`
				);
		}
	});

	const accounts = getAccounts(print);

	let networks = {};
	Object.keys(credentials()).forEach((name) => {
		if (deployable(name)) networks[name] = { accounts, url: deployable(name) };
	});

	return { etherscan: { apiKey }, networks };
}

module.exports = { deployable, verifiable, getCredentials };

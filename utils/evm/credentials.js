require('dotenv').config();
const { readFileSync, writeFileSync, existsSync } = require('fs');
const ethers = require('ethers');

function checkKeys(path, keys) {
	const deployerKey = keys.split(',')[0];
	const envLine = `PRIVATE_KEY=${deployerKey}`;

	if (existsSync(path)) {
		const lines = readFileSync(path, {
			encoding: 'utf-8',
		}).split('\n');
		let hasPrivateKey = false;
		let index = 0;
		lines.forEach((line, idx) => {
			if (line.includes('PRIVATE_KEY')) {
				hasPrivateKey = true;
				index = idx;
			}
		});

		if (!hasPrivateKey) {
			writeFileSync(path, readFileSync(path, 'utf-8') + `\n${envLine}\n`);
		} else {
			if (lines[index] !== envLine) {
				let file = '';
				lines.forEach((line, idx) => {
					if (idx !== index) file += line + '\n';
				});
				writeFileSync(path, file + envLine);
			}
		}
	} else writeFileSync(path, `${envLine}\n`);
}

// .ENV EXTRACTION
const credentials = {
	mainnet: {
		scanner: process.env.ETHERSCAN,
		provider: process.env.MAINNET_PROVIDER,
	},
	goerli: {
		scanner: process.env.ETHERSCAN,
		provider: process.env.GOERLI_PROVIDER,
	},
	polygon: {
		scanner: process.env.POLYGONSCAN,
		provider: process.env.POLYGON_PROVIDER,
	},
	polygonMumbai: {
		scanner: process.env.POLYGONSCAN,
		provider: process.env.MUMBAI_PROVIDER,
	},
	bsc: {
		scanner: process.env.BSCSCAN,
		provider: process.env.BSC_PROVIDER,
	},
	bscTestnet: {
		scanner: process.env.BSCSCAN,
		provider: process.env.BSC_TESTNET_PROVIDER,
	},
	opera: {
		scanner: process.env.FTMSCAN,
		provider: process.env.OPERA_PROVIDER,
	},
	ftmTestnet: {
		scanner: process.env.FTMSCAN,
		provider: process.env.FTM_TESTNET_PROVIDER,
	},
	avalanche: {
		scanner: process.env.SNOWTRACE,
		provider: process.env.AVALANCHE_PROVIDER,
	},
	avalancheFujiTestnet: {
		scanner: process.env.SNOWTRACE,
		provider: process.env.FUJI_PROVIDER,
	},
};

// BASIC CREDENTIAL DIAGNOSTICS
const verifiable = (name) => credentials[name]?.scanner;
const deployable = (name) => credentials[name].provider;

function getCredentials(printToConsole) {
	// PREPARE HARDHAT VERIFIER CREDENTIALS
	if (printToConsole)
		console.log(
			'\nPreparing EvmConfig...\n\n|| Credentials\n|||| Scanners & Providers'
		);

	let apiKey = {};
	Object.keys(credentials).forEach((name) => {
		if (deployable(name)) {
			if (printToConsole && !verifiable(name))
				console.log(
					`|||||| \x1B[33m${name} \x1B[39m- Scanner Key Missing (Unable to Verify)`
				);
			else {
				apiKey[name] = verifiable(name);

				if (printToConsole) console.log(`||||||\x1B[92m ${name}\x1B[39m`);
			}
		} else {
			if (printToConsole)
				console.log(
					`|||||| \x1B[31m${name} \x1B[39m - Provider Missing (Unable to Deploy)`
				);
		}
	});

	const etherscan = { apiKey };

	// PREPARE GAS REPORTER CREDENTIALS
	const coinmarketcap = process.env.COINMARKETCAP_API_KEY;
	if (printToConsole) {
		console.log(`|||| Gas Reporter`);
		if (coinmarketcap)
			console.log(`||||||\x1B[92m CoinMarketCap API Key Found!\x1B[39m`);
		else
			console.log(
				`||||||\x1B[33m CoinMarketCap API Key Missing! Unable to report gas consumption...\x1B[39m`
			);
	}

	// PREPARE EVM WALLET CREDENTIALS
	const WALLET_KEYS = process.env.WALLET_KEYS;
	if (printToConsole) console.log(`|||| Wallet Keys`);

	let accounts = '';
	if (WALLET_KEYS) {
		accounts = WALLET_KEYS.includes(',')
			? WALLET_KEYS.split(',')
			: [WALLET_KEYS];

		if (printToConsole) {
			console.log(
				`||||||\x1B[92m ${accounts.length} Wallet keys found!\x1B[39m`
			);
			accounts.forEach((key) => {
				console.log(`|||||| ${new ethers.Wallet(key).address}`);
			});
		}
		if (existsSync('../backend')) checkKeys('../backend/.env', WALLET_KEYS);
	} else {
		const num = 5;
		if (printToConsole)
			console.log(
				`||||||\x1B[33m Missing Wallet Keys! Generating ${num} accounts...\x1B[39m`
			);

		let acc = '';
		for (let i = 0; i < num; i++) {
			const wallet = ethers.Wallet.createRandom();
			const key = wallet.privateKey;
			acc = acc === '' ? key : `${acc},${key}`;

			if (printToConsole) console.log(`|||||| ${wallet.address}`);
		}
		writeFileSync(
			'.env',
			readFileSync('.env', 'utf-8') + `\nWALLET_KEYS=${acc}\n`
		);
		accounts = acc.split(',');
		if (existsSync('../backend')) checkKeys('../backend/.env', acc);
	}

	// PREPARE NETWORK PROVIDER CREDENTIALS
	let networks = {};
	Object.keys(credentials).forEach((name) => {
		if (deployable(name)) networks[name] = { accounts, url: deployable(name) };
	});

	return { etherscan, networks, coinmarketcap };
}

module.exports = { getCredentials, verifiable, deployable };

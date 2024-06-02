require('dotenv').config();
const { readFileSync, writeFileSync, existsSync } = require('fs');
const ethers = require('ethers');

function ensureKeys(path, keys) {
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

function getAccounts(print) {
	const WALLET_KEYS = process.env.WALLET_KEYS;
	if (print) console.log(`|||| Wallet Keys`);
	let accounts = '';
	if (WALLET_KEYS) {
		accounts = WALLET_KEYS.includes(',')
			? WALLET_KEYS.split(',')
			: [WALLET_KEYS];

		if (print) {
			console.log(
				`||||||\x1B[92m ${accounts.length} Wallet keys found!\x1B[39m`
			);
			accounts.forEach((key) => {
				console.log(`|||||| ${new ethers.Wallet(key).address}`);
			});
		}
		if (existsSync('../backend')) ensureKeys('../backend/.env', WALLET_KEYS);
	} else {
		const num = 5;
		if (print)
			console.log(
				`||||||\x1B[33m Missing Wallet Keys! Generating ${num} accounts...\x1B[39m`
			);

		let acc = '';
		for (let i = 0; i < num; i++) {
			const wallet = ethers.Wallet.createRandom();
			const key = wallet.privateKey;
			acc = acc === '' ? key : `${acc},${key}`;

			if (print) console.log(`|||||| ${wallet.address}`);
		}
		writeFileSync(
			'.env',
			readFileSync('.env', 'utf-8') + `\nWALLET_KEYS=${acc}\n`
		);
		accounts = acc.split(',');
		if (existsSync('../backend')) checkKeys('../backend/.env', acc);
	}
	return accounts;
}

module.exports = { getAccounts };

const hre = require('hardhat');
const { ethers } = hre;
const contractUtils = require('../utils/evm/contract');

const listNfts = async (environment) => {
	const { deployer, accounts, market, abt } = environment;
	console.log('|| Listing NFTs...');
	for (const account of accounts) {
		const inventory = await abt.inventoryOf(account.address);
		for (let i = 0; i < inventory.length; i++) {
			const tokenId = parseInt(inventory[i]);
			const listing = await market.readListing(abt.target, tokenId);
			if (listing.seller !== ethers.ZeroAddress) continue;

			const price = Math.floor(Math.random() * 1000) + 1; // Random price between 1 and 1000
			const payload = {
				nftAddress: abt.target,
				tokenId,
				price,
				seller: account.address,
			};
			console.log(`|||| ListingCreated`, payload);
			await market.connect(account).createListing(abt.target, tokenId, price);
		}
	}
};

const buyNfts = async (environment) => {
	console.log('|| Making Purchases...');
	const { deployer, accounts, market, abt } = environment;
	const numTokens = await abt.numTokens();
	const tokenIds = Array.from({ length: parseInt(numTokens) }, (_, i) => i + 1);
	for (const account of accounts) {
		let listings;
		try {
			listings = await market.readListings(abt.target, tokenIds);
		} catch (err) {
			console.error('Error fetching listings:', err);
			continue;
		}

		let purchaseAttempted = false;
		for (let i = 0; i < listings.length; i++) {
			const listing = listings[i];
			const tokenId = tokenIds[i];
			const { seller, usdPennyPrice, rawValueGas, rawValueTkn } = listing;
			const tokenHolder = await abt.ownerOf(tokenId);

			if (
				seller !== ethers.ZeroAddress &&
				seller !== account.address &&
				tokenHolder !== account.address &&
				parseInt(rawValueGas) > 0
			) {
				try {
					purchaseAttempted = true;
					await market
						.connect(account)
						.acceptAsk(abt.target, tokenId, { value: rawValueGas });
					const payload = {
						buyer: account.address,
						nftAddress: abt.target,
						tokenId,
						usdPennyPrice: parseInt(usdPennyPrice),
						paymentMethod: ethers.ZeroAddress,
						requiredValue: parseInt(rawValueGas),
						seller,
					};
					console.log(`|||| ListingClosed`, payload);
					break;
				} catch (err) {
					console.error('Error purchasing NFT:', err);
				}
			}
		}

		if (!purchaseAttempted) {
			console.log(
				`No valid listings found for ${account.address} to purchase.`
			);
		}
	}
};

const withdrawEarnings = async (environment) => {
	console.log('|| Withdrawing Proceeds...');
	const { deployer, accounts, market, abt } = environment;
	for (const account of accounts) {
		const { rawValue, usdPennyValue } = await market.checkProceeds(
			account.address
		);
		if (parseInt(rawValue) > 0) {
			const payload = {
				usdPennyValue: parseInt(usdPennyValue),
				rawValue: parseInt(rawValue),
				seller: account.address,
			};
			console.log(`|||| ProceedsWithdrawn`, payload);
			await market.connect(account).withdrawProceeds();
		}
	}
};

(async () => {
	console.log('Gathering Signer Objects...');
	const provider = ethers.provider;
	const privateKeys = hre.config.networks.mainnet.accounts;
	const deployer = new ethers.Wallet(privateKeys[0], provider);
	let accounts = await ethers.getSigners();

	console.log('Gathering Contracts on localhost...');
	const market = contractUtils.retrieve('NiovMarket', 31337, deployer);
	const abt = contractUtils.retrieve('AssetBoundToken', 31337, deployer);

	console.log('Minting Tokens & Approving Them for Marketplace Interaction...');
	for (const account of accounts) {
		// Mint
		let inventory = await abt.inventoryOf(account.address);
		if (inventory.length === 0) {
			console.log(`|| Minting to ${account.address}...`);
			for (let i = 0; i < 5; i++)
				await abt.connect(deployer).mintTo(account.address);
		}
		// Approve
		inventory = await abt.inventoryOf(account.address);
		for (let i = 0; i < inventory.length; i++)
			await abt.connect(account).approve(market.target, inventory[i]);
	}

	console.log('\nBEGIN SIMULATION');
	const environment = { deployer, accounts, market, abt };
	await listNfts(environment);
	await buyNfts(environment);
	await withdrawEarnings(environment);
	console.log('END SIMULATION');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

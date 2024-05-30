const hre = require('hardhat');
const { ethers } = hre;

// price input must be > 0
const createListing = async (signer, nft, tokenId, market, log = false) => {
	const tokenHolder = await nft.ownerOf(tokenId);
	const isNftOwner = signer.address === tokenHolder;

	const listingData = await market.readListing(nft.target, tokenId);
	const notListed = listingData.usdPennyPrice === 0;

	const approvedAddress = await nft.getApproved(tokenId);
	const nftIsApprovedForMarket = market.target === approvedAddress;

	if (log) {
		console.log('can.createListing', {
			isNftOwner,
			notListed,
			nftIsApprovedForMarket,
		});
	}

	return isNftOwner && notListed && nftIsApprovedForMarket;
};

const updateListing = async (signer, nft, tokenId, market, log = false) => {
	const tokenHolder = await nft.ownerOf(tokenId);
	const isNftOwner = signer.address === tokenHolder;

	const listingData = await market.readListing(nft.target, tokenId);
	const isListed = listingData.usdPennyPrice !== 0;

	const approvedAddress = await nft.getApproved(tokenId);
	const nftIsApprovedForMarket = market.target === approvedAddress;

	if (log) {
		console.log('can.updateListing', {
			isNftOwner,
			notListed,
		});
		if (!nftIsApprovedForMarket)
			console.log('WARNING: LISTING WILL BE DELETED!');
		// this will also happen if price <= 0
	}

	return isNftOwner && isListed;
};

const destroyListing = async (signer, nft, tokenId, market, log = false) => {
	const tokenHolder = await nft.ownerOf(tokenId);
	const isNftOwner = signer.address === tokenHolder;

	const listingData = await market.readListing(nft.target, tokenId);
	const isListed = listingData.usdPennyPrice !== 0;

	if (log) {
		console.log('can.destroyListing', {
			isNftOwner,
			isListed,
		});
	}
	return isNftOwner && isListed;
};

const acceptAsk = async (signer, nft, tokenId, market, log = false) => {
	const tokenHolder = await nft.ownerOf(tokenId);
	const isNotNftOwner = signer.address !== tokenHolder;

	const listingData = await market.readListing(nft.target, tokenId);
	const isListed = listingData.usdPennyPrice !== 0;

	if (log) {
		console.log('can.acceptAsk', {
			isNotNftOwner,
			isListed,
		});
	}

	return isNotNftOwner && isListed;
};

const withdrawProceeds = async (signer, nft, tokenId, market, log = false) => {
	const proceeds = await market.checkProceeds(signer.address);
	const hasProceeds = parseInt(proceeds.rawValue) > 0;

	if (log) {
		console.log('can.withdrawProceeds', {
			hasProceeds,
		});
	}
	return hasProceeds;
};

module.exports = {
	createListing,
	updateListing,
	destroyListing,
	acceptAsk,
	withdrawProceeds,
};

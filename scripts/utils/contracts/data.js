const hre = require('hardhat');
const { ethers } = hre;

const isListingData = (listingData) => {
	try {
		const { seller, usdPennyPrice, rawValueGas, rawValueTkn } = listingData;
		const isMissingData = [
			seller,
			usdPennyPrice,
			rawValueGas,
			rawValueTkn,
		].includes(undefined);
		return !isMissingData;
	} catch (e) {
		return false;
	}
};

module.exports = { isListingData };

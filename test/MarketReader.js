const { ethers } = require('hardhat');
const { assert, expect } = require('chai');
const { deployContract } = require('./utils/setup');
const { deployCoreContracts } = require('./utils/deployment');

describe('Market Reader', () => {
	let accounts, deployer;
	let token, oracle, market, nft;
	let reader;

	const tokenId = 1;
	const price = 123;
	const BigZero = ethers.parseEther('0');

	beforeEach(async () => {
		[deployer, ...accounts] = await ethers.getSigners();

		///////////////////////////
		// DEPLOY CORE CONTRACTS //
		///////////////////////////
		const contracts = await deployCoreContracts(deployer);
		token = contracts.token;
		oracle = contracts.oracle;
		market = contracts.market;
		nft = contracts.nft;

		///////////////////
		// DEPLOY READER //
		///////////////////
		reader = await deployContract(deployer, 'MarketReader', [market.target]);
	});

	describe('Deployment', () => {
		it('has the correct market address', async () => {
			expect(await reader.market()).to.be.eql(market.target);
		});
	});

	describe('View Functions', () => {
		beforeEach(async () => {
			for await (const account of accounts) {
				await nft.connect(deployer).mintTo(account.address);
				const tknId = await nft.numTokens();
				await nft.connect(account).approve(market.target, tknId);
				await nft.connect(deployer).mintTo(account.address);
			}
		});
		it('can fetch arrays of listings', async () => {
			const numTokens = await nft.numTokens();
			const tokenIds = Array.from(
				{ length: parseInt(numTokens) },
				(_, i) => i + 1
			);
			const listings = await reader.readListings(nft.target, tokenIds);
			listings.forEach((listing) => {
				expect(listing.seller).to.be.eql(ethers.ZeroAddress);
				expect(listing.usdPennyPrice).to.be.eql(ethers.toBigInt(0));
				expect(listing.rawValueGas).to.be.eql(ethers.toBigInt(0));
				expect(listing.rawValueTkn).to.be.eql(ethers.toBigInt(0));
			});
		});
	});
});

/*
describe('FUNCTION_NAME_INVOLVED', () => {
	describe('EXPECTATIONS', () => {
		it('updates X with Y', async () => {
			////////////////////////////////
		});
		it('emits an event after CONDITION_GOES_HERE', async () => {
			////////////////////////////////////////////////////////
		});
	});
	describe('ERRORS', () => {
		// Public Modifiers
		it('prevents X', async () => {
			/////////////////////////////////////////////////
		});
		// Internal Modifiers
		it('prevents Y', async () => {
			/////////////////////////////////////////////////
		});
		// Inline Modifiers
		it('prevents Z', async () => {
			/////////////////////////////////////////////////
		});
	});
}); 
*/

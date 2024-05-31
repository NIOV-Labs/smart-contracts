const { ethers } = require('hardhat');
const { assert, expect } = require('chai');
const { deployContract } = require('./utils/setup');
const { deployCoreContracts } = require('./utils/deployment');

describe('Niov Market', () => {
	let accounts, deployer, user;
	let token, oracle, market, nft;
	let reader;
	let altToken, altOracle;

	const tokenId = 1;
	const price = 123;
	const BigZero = ethers.parseEther('0');

	beforeEach(async () => {
		[deployer, user, ...accounts] = await ethers.getSigners();

		///////////////////////////
		// DEPLOY CORE CONTRACTS //
		///////////////////////////
		const contracts = await deployCoreContracts(deployer);
		token = contracts.token;
		oracle = contracts.oracle;
		market = contracts.market;
		nft = contracts.nft;

		// setup
		await nft.connect(deployer).mintTo(deployer.address);
		await nft.connect(deployer).approve(market.target, tokenId);

		///////////////////
		// DEPLOY READER //
		///////////////////
		reader = await deployContract(deployer, 'MarketReader', [market.target]);

		////////////////////////
		// DEPLOY SUBSTITUTES //
		////////////////////////
		altToken = await deployContract(deployer, 'WMATIC');
		altOracle = await deployContract(deployer, 'PolygonLinkSim');
	});

	const createListing = async () =>
		await market.connect(deployer).createListing(nft.target, tokenId, price);
	const readListing = async () =>
		await market.connect(deployer).readListing(nft.target, tokenId);
	const destroyListing = async () =>
		await market.connect(deployer).destroyListing(nft.target, tokenId);
	const updateListing = async (newPrice) =>
		await market.connect(deployer).updateListing(nft.target, tokenId, newPrice);
	const acceptAsk_Gas = async () => {
		const listing = await readListing();
		const value = listing.rawValueGas;
		await market.connect(user).acceptAsk(nft.target, tokenId, { value });
		return value;
	};
	const withdrawProceeds = async () =>
		await market.connect(deployer).withdrawProceeds();

	// getters
	const exchangeRate = async () => {
		const roundData = await oracle.latestRoundData();
		return parseInt(roundData.answer) / 10 ** 8;
	};
	const expectedValue = async (usdPennyPrice) => {
		const exRate = await exchangeRate();
		const value = usdPennyPrice / exRate / 100;
		return ethers.toBigInt(value * 10 ** 18);
	};

	// COMPLETE
	describe('ListingDatabase CRUD Operations', () => {
		describe('createListing & readListing', () => {
			describe('EXPECTATIONS', () => {
				it('creates listing with seller and price', async () => {
					{
						const permissions = await reader.canCreateListing(
							deployer.address,
							nft.target,
							tokenId,
							price
						);
						assert(permissions.canCreate === true);
						assert(permissions.isNftOwner === true);
						assert(permissions.notListed === true);
						assert(permissions.nftIsApprovedForMarket === true);
						assert(permissions.nonZeroPrice === true);
					}
					await createListing();

					const listing = await readListing();

					assert(listing.seller === deployer.address);
					assert(parseInt(listing.usdPennyPrice) === price);
					const expected = await expectedValue(price);
					assert(listing.rawValueGas === expected);
					assert(listing.rawValueTkn === expected);
				});
				it('emits an event after creating a listing', async () => {
					expect(await createListing())
						.to.emit('ListingCreated')
						.withArgs(nft.target, tokenId, price, deployer.address);
				});
				it('returns empty listing if user transfers NFT after list', async () => {
					await createListing();
					await nft
						.connect(deployer)
						.transferFrom(deployer.address, user.address, tokenId);

					const listing = await readListing();

					assert(listing.seller === ethers.ZeroAddress);
					assert(listing.usdPennyPrice === BigZero);
					assert(listing.rawValueGas === BigZero);
					assert(listing.rawValueTkn === BigZero);
				});
				it('still allows users to relist NFTs after transfer', async () => {
					await createListing();
					await nft
						.connect(deployer)
						.transferFrom(deployer.address, user.address, tokenId);
					await nft.connect(user).approve(market.target, tokenId);
					{
						const permissions = await reader.canCreateListing(
							user.address,
							nft.target,
							tokenId,
							price
						);
						assert(permissions.canCreate === true);
						assert(permissions.isNftOwner === true);
						assert(permissions.notListed === true);
						assert(permissions.nftIsApprovedForMarket === true);
						assert(permissions.nonZeroPrice === true);
					}
					expect(
						await market.connect(user).createListing(nft.target, tokenId, price)
					)
						.to.emit('ListingCreated')
						.withArgs(nft.target, tokenId, price, user.address);

					const listing = await readListing();

					assert(listing.seller === user.address);
					assert(parseInt(listing.usdPennyPrice) === parseInt(price));
					const expected = await expectedValue(price);
					assert(listing.rawValueGas === expected);
					assert(listing.rawValueTkn === expected);
				});

				it('Should translate prices correctly', async () => {
					const rate = await exchangeRate();
					const newPrice = rate * 100;
					const wholeEther = ethers.parseEther('1.0');
					await market
						.connect(deployer)
						.createListing(nft.target, tokenId, newPrice);

					const listing = await readListing();

					const expectedPrice = ethers.toBigInt(newPrice);
					assert(listing.seller === deployer.address);
					expect(listing.usdPennyPrice).to.be.equal(expectedPrice);
					expect(listing.rawValueGas).to.be.equal(wholeEther);
					expect(listing.rawValueTkn).to.be.equal(wholeEther);
				});

				it('Double Checking...', async () => {
					const rate = await exchangeRate();
					await market
						.connect(deployer)
						.createListing(nft.target, tokenId, 100);
					const expected = ethers.toBigInt((1 / rate) * 10 ** 18);

					const listing = await readListing();

					assert(listing.seller === deployer.address);
					assert(listing.usdPennyPrice === ethers.toBigInt(100));
					expect(listing.rawValueGas).to.be.equal(expected);
					expect(listing.rawValueTkn).to.be.equal(expected);
				});
			});
			describe('ERRORS', () => {
				// External Modifiers
				it('reverts if anyone but the owner tries to call', async () => {
					{
						let permissions = await reader.canCreateListing(
							user.address,
							nft.target,
							tokenId,
							price
						);
						assert(permissions.canCreate === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.notListed === true);
						assert(permissions.nftIsApprovedForMarket === true);
						assert(permissions.nonZeroPrice === true);
					}
					await expect(
						market.connect(user).createListing(nft.target, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
					await nft.connect(deployer).approve(user.address, tokenId);
					// even if they add approval
					{
						permissions = await reader.canCreateListing(
							user.address,
							nft.target,
							tokenId,
							price
						);
						assert(permissions.canCreate === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.notListed === true);
						assert(permissions.nftIsApprovedForMarket === false);
						assert(permissions.nonZeroPrice === true);
					}

					await expect(
						market.connect(user).createListing(nft.target, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
				it('reverts if there is already a listing', async () => {
					await createListing();
					{
						const permissions = await reader.canCreateListing(
							deployer.address,
							nft.target,
							tokenId,
							price
						);
						assert(permissions.canCreate === false);
						assert(permissions.isNftOwner === true);
						assert(permissions.notListed === false);
						assert(permissions.nftIsApprovedForMarket === true);
						assert(permissions.nonZeroPrice === true);
					}
					await expect(createListing())
						.to.be.revertedWithCustomError(market, 'AlreadyListed')
						.withArgs(nft.target, tokenId);
				});
				it('needs approvals to list item', async () => {
					await nft.connect(deployer).approve(ethers.ZeroAddress, tokenId);
					{
						const permissions = await reader.canCreateListing(
							deployer.address,
							nft.target,
							tokenId,
							price
						);
						assert(permissions.canCreate === false);
						assert(permissions.isNftOwner === true);
						assert(permissions.notListed === true);
						assert(permissions.nftIsApprovedForMarket === false);
						assert(permissions.nonZeroPrice === true);
					}
					await expect(createListing()).to.be.revertedWithCustomError(
						market,
						'NotApprovedForMarketplace'
					);
				});
				// Inline Modifiers
				it('reverts if the price is 0', async () => {
					{
						const permissions = await reader.canCreateListing(
							deployer.address,
							nft.target,
							tokenId,
							BigZero
						);
						assert(permissions.canCreate === false);
						assert(permissions.isNftOwner === true);
						assert(permissions.notListed === true);
						assert(permissions.nftIsApprovedForMarket === true);
						assert(permissions.nonZeroPrice === false);
					}
					await expect(
						market.createListing(nft.target, tokenId, BigZero)
					).revertedWithCustomError(market, 'PriceMustBeAboveZero');
				});
			});
		});

		describe('destroyListing', () => {
			describe('EXPECTATIONS', () => {
				it('removes listings', async () => {
					await createListing();
					{
						let permissions = await reader.canDestroyListing(
							deployer.address,
							nft.target,
							tokenId
						);
						assert(permissions.canDestroy === true);
						assert(permissions.isNftOwner === true);
						assert(permissions.isListed === true);
					}
					await destroyListing();

					const listing = await readListing();

					assert(listing.seller === ethers.ZeroAddress);
					assert(listing.usdPennyPrice === BigZero);
					assert(listing.rawValueGas === BigZero);
					assert(listing.rawValueTkn === BigZero);
				});

				it('emits an event after deleting a listing', async () => {
					await createListing();
					expect(await destroyListing())
						.to.emit('ListingDestroyed')
						.withArgs(nft.target, tokenId, deployer.address);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if anyone but the owner tries to call', async () => {
					await createListing();
					{
						let permissions = await reader.canDestroyListing(
							user.address,
							nft.target,
							tokenId
						);
						assert(permissions.canDestroy === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.isListed === true);
					}
					await expect(
						market.connect(user).destroyListing(nft.target, tokenId)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
					// even if they add approval
					await nft.connect(deployer).approve(user.address, tokenId);
					{
						let permissions = await reader.canDestroyListing(
							user.address,
							nft.target,
							tokenId
						);
						assert(permissions.canDestroy === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.isListed === true);
					}
					await expect(
						market.connect(user).destroyListing(nft.target, tokenId)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
				// Internal Modifiers
				it('reverts if there is no listing', async () => {
					{
						let permissions = await reader.canDestroyListing(
							deployer.address,
							nft.target,
							tokenId
						);
						assert(permissions.canDestroy === false);
						assert(permissions.isNftOwner === true);
						assert(permissions.isListed === false);
					}
					await expect(destroyListing())
						.to.be.revertedWithCustomError(market, 'NotListed')
						.withArgs(nft.target, tokenId);
				});
			});
		});

		describe('updateListing', () => {
			const updatedPrice = 420;
			describe('EXPECTATIONS', () => {
				it('updates the price of the listing', async () => {
					await createListing();
					{
						let permissions = await reader.canUpdateListing(
							deployer.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === true);
						assert(permissions.isNftOwner === true);
						assert(permissions.isListed === true);
					}
					{
						let prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							updatedPrice
						);
						assert(prediction.willDestroy === false);
						assert(prediction.zeroPrice === false);
						assert(prediction.nftNotApprovedForMarket === false);
					}
					await updateListing(updatedPrice);

					const listing = await readListing();

					assert(listing.seller === deployer.address);
					assert(parseInt(listing.usdPennyPrice) === parseInt(updatedPrice));
					const expected = await expectedValue(updatedPrice);
					assert(listing.rawValueGas === expected);
					assert(listing.rawValueTkn === expected);
				});

				it('emits an event after price update', async () => {
					await createListing();
					expect(await updateListing(updatedPrice))
						.to.emit('ListingUpdated')
						.withArgs(nft.target, tokenId, updatedPrice, deployer.address);
				});
				it('can delete listings if price <= 0', async () => {
					await createListing();
					{
						let permissions = await reader.canUpdateListing(
							deployer.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === true);
						assert(permissions.isNftOwner === true);
						assert(permissions.isListed === true);
					}
					{
						let prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							BigZero
						);
						assert(prediction.willDestroy === true);
						assert(prediction.zeroPrice === true);
						assert(prediction.nftNotApprovedForMarket === false);
					}
					expect(await updateListing(BigZero))
						.to.emit('ListingDestroyed')
						.withArgs(nft.target, tokenId, deployer.address);

					const listing = await readListing();

					assert(listing.seller === ethers.ZeroAddress);
					assert(listing.usdPennyPrice === BigZero);
					assert(listing.rawValueGas === BigZero);
					assert(listing.rawValueTkn === BigZero);
				});

				it('can delete listings if token not approved', async () => {
					await createListing();
					await nft.connect(deployer).approve(ethers.ZeroAddress, tokenId);
					{
						let permissions = await reader.canUpdateListing(
							deployer.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === true);
						assert(permissions.isNftOwner === true);
						assert(permissions.isListed === true);
					}
					{
						let prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							updatedPrice
						);
						assert(prediction.willDestroy === true);
						assert(prediction.zeroPrice === false);
						assert(prediction.nftNotApprovedForMarket === true);
					}
					expect(await updateListing(updatedPrice))
						.to.emit('ListingDestroyed')
						.withArgs(nft.target, tokenId, deployer.address);

					const listing = await readListing();

					assert(listing.seller === ethers.ZeroAddress);
					assert(listing.usdPennyPrice === BigZero);
					assert(listing.rawValueGas === BigZero);
					assert(listing.rawValueTkn === BigZero);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if anyone but the owner tries to call', async () => {
					{
						let permissions = await reader.canUpdateListing(
							user.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.isListed === false);
					}
					{
						let prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							updatedPrice
						);
						assert(prediction.willDestroy === false);
						assert(prediction.zeroPrice === false);
						assert(prediction.nftNotApprovedForMarket === false);
					}
					await expect(
						market.updateListing(nft.target, tokenId, price)
					).to.be.revertedWithCustomError(market, 'NotListed');
					await createListing();
					market = market.connect(user);
					{
						permissions = await reader.canUpdateListing(
							user.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.isListed === true);
					}
					{
						prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							updatedPrice
						);
						assert(prediction.willDestroy === false);
						assert(prediction.zeroPrice === false);
						assert(prediction.nftNotApprovedForMarket === false);
					}
					await expect(
						market.updateListing(nft.target, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
				// Internal Modifiers
				it('reverts if there is no listing', async () => {
					{
						let permissions = await reader.canUpdateListing(
							deployer.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === false);
						assert(permissions.isNftOwner === true);
						assert(permissions.isListed === false);
					}
					{
						let prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							updatedPrice
						);
						assert(prediction.willDestroy === false);
						assert(prediction.zeroPrice === false);
						assert(prediction.nftNotApprovedForMarket === false);
					}
					await expect(
						market.updateListing(nft.target, tokenId, price)
					).to.be.revertedWithCustomError(market, 'NotListed');
					await createListing();
					market = market.connect(user);
					{
						permissions = await reader.canUpdateListing(
							user.address,
							nft.target,
							tokenId
						);
						assert(permissions.canUpdate === false);
						assert(permissions.isNftOwner === false);
						assert(permissions.isListed === true);
					}
					{
						prediction = await reader.updateWillDestroyListing(
							nft.target,
							tokenId,
							updatedPrice
						);
						assert(prediction.willDestroy === false);
						assert(prediction.zeroPrice === false);
						assert(prediction.nftNotApprovedForMarket === false);
					}
					await expect(
						market.updateListing(nft.target, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
			});
		});
	});

	describe('Purchasing & Proceeds (LISTINGS)', () => {
		// TODO @BONUS describe('acceptAsk in Wrapped Native Tokens', () => {});

		describe('acceptAsk in Gas', () => {
			describe('EXPECTATIONS', () => {
				it('transfers the nft to the buyer', async () => {
					await createListing();
					{
						const listing = await readListing();
						const value = listing.rawValueGas;
						const permissions = await reader.canAcceptAsk(
							user.address,
							nft.target,
							tokenId,
							value
						);
						assert(permissions.canAccept === true);
						assert(permissions.isNotNftOwner === true);
						assert(permissions.isListed === true);
						assert(permissions.accurateValue === true);
					}
					await acceptAsk_Gas();
					const newOwner = await nft.ownerOf(tokenId);
					assert(newOwner == user.address);
				});
				it('destroys the listing', async () => {
					await createListing();
					await acceptAsk_Gas();

					const listing = await readListing();

					assert(listing.seller === ethers.ZeroAddress);
					assert(listing.usdPennyPrice === BigZero);
					assert(listing.rawValueGas === BigZero);
					assert(listing.rawValueTkn === BigZero);
				});

				it('updates the proceeds record', async () => {
					await createListing();
					const value = await acceptAsk_Gas();
					const proceeds = await market.checkProceeds(deployer.address);
					assert(proceeds[0] === value);
				});
				it('emits an event after purchase', async () => {
					await createListing();
					const listing = await readListing();
					const value = listing.rawValueGas;
					expect(await acceptAsk_Gas())
						.to.emit('ListingClosed')
						.withArgs(
							user.address,
							nft.target,
							tokenId,
							price,
							ethers.ZeroAddress,
							value,
							deployer.address
						);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if user is owner', async () => {
					await createListing();
					{
						const listing = await readListing();
						const value = listing.rawValueGas;
						const permissions = await reader.canAcceptAsk(
							deployer.address,
							nft.target,
							tokenId,
							value
						);
						assert(permissions.canAccept === false);
						assert(permissions.isNotNftOwner === false);
						assert(permissions.isListed === true);
						assert(permissions.accurateValue === true);
					}
					await expect(
						market
							.connect(deployer)
							.acceptAsk(nft.target, tokenId, { value: price })
					).to.be.revertedWithCustomError(market, 'SpenderIsOwner');
				});
				it('reverts if the item isnt listed', async () => {
					{
						const permissions = await reader.canAcceptAsk(
							user.address,
							nft.target,
							tokenId,
							0
						);
						assert(permissions.canAccept === false);
						assert(permissions.isNotNftOwner === true);
						assert(permissions.isListed === false);
						assert(permissions.accurateValue === true);
					}
					await expect(
						market
							.connect(user)
							.acceptAsk(nft.target, tokenId, { value: price })
					).to.be.revertedWithCustomError(market, 'NotListed');
				});
				// Inline Modifiers
				it('reverts if the price isnt met', async () => {
					await createListing();
					{
						const permissions = await reader.canAcceptAsk(
							user.address,
							nft.target,
							tokenId,
							BigZero
						);
						assert(permissions.canAccept === false);
						assert(permissions.isNotNftOwner === true);
						assert(permissions.isListed === true);
						assert(permissions.accurateValue === false);
					}
					await expect(
						market
							.connect(user)
							.acceptAsk(nft.target, tokenId, { value: BigZero })
					).to.be.revertedWithCustomError(market, 'PriceNotMet');
				});
			});
		});

		describe('withdrawals', () => {
			describe('EXPECTATIONS', () => {
				it('withdraws proceeds', async () => {
					await createListing();
					await acceptAsk_Gas();

					const proceeds = await market.checkProceeds(deployer.address);
					const gasProceeds = parseInt(proceeds[0]);
					const initialBalance = parseInt(
						await ethers.provider.getBalance(deployer.address)
					);
					const expectedBalance = (gasProceeds + initialBalance).toPrecision(
						14
					);
					{
						let canWithdraw = await reader.canWithdrawProceeds(
							deployer.address
						);
						assert(canWithdraw === true);
					}
					const txResponse = await withdrawProceeds();
					const transactionReceipt = await txResponse.wait();
					const { gasUsed, gasPrice } = transactionReceipt;
					const gasCost = parseInt(gasUsed) * parseInt(gasPrice);
					const finalBalance = parseInt(
						await ethers.provider.getBalance(deployer.address)
					);
					const beforeAndGas = (finalBalance + gasCost).toPrecision(14);

					expect(beforeAndGas).to.be.equal(expectedBalance);
				});
				it('emits an event after withdrawal', async () => {
					await createListing();
					const value = await acceptAsk_Gas();
					expect(await withdrawProceeds())
						.to.emit('ListingClosed')
						.withArgs(price, value, deployer.address);
				});
				it('forcefully withdraws proceeds', async () => {
					// await createListing();
					await nft
						.connect(deployer)
						.transferFrom(deployer.address, user.address, tokenId);
					await nft.connect(user).approve(market.target, tokenId);
					await market.connect(user).createListing(nft.target, tokenId, price);

					// const value = await acceptAsk_Gas();
					const listing = await readListing();
					const value = listing.rawValueGas;
					await market
						.connect(deployer)
						.acceptAsk(nft.target, tokenId, { value });

					const proceeds = await market.checkProceeds(user.address);
					const gasProceeds = parseInt(proceeds[0]);
					const initialBalance = parseInt(
						await ethers.provider.getBalance(user.address)
					);
					const expectedBalance = (gasProceeds + initialBalance).toPrecision(
						14
					);

					const txResponse = await market
						.connect(deployer)
						.forceWithdraw(user.address);
					await txResponse.wait();
					const finalBalance = parseInt(
						await ethers.provider.getBalance(user.address)
					).toPrecision(14);

					expect(finalBalance).to.be.equal(expectedBalance);
				});
				it('emits an event after forced  withdrawal', async () => {
					// await createListing();
					await nft
						.connect(deployer)
						.transferFrom(deployer.address, user.address, tokenId);
					await nft.connect(user).approve(market.target, tokenId);
					await market.connect(user).createListing(nft.target, tokenId, price);

					// const value = await acceptAsk_Gas();
					const listing = await readListing();
					const value = listing.rawValueGas;
					await market
						.connect(deployer)
						.acceptAsk(nft.target, tokenId, { value });

					expect(await market.connect(deployer).forceWithdraw(user.address))
						.to.emit('ListingClosed')
						.withArgs(price, value, user.address);
				});
			});
			describe('ERRORS', () => {
				// Inline Modifiers
				it("doesn't allow 0 proceed withdrawls", async () => {
					{
						let canWithdraw = await reader.canWithdrawProceeds(
							deployer.address
						);
						assert(canWithdraw === false);
					}
					await expect(withdrawProceeds()).to.be.revertedWithCustomError(
						market,
						'NoProceeds'
					);
				});
			});
		});
	});

	// COMPLETE
	describe('OracleHandler/ OwnableAddressTracker', () => {
		describe('NativeTokenTracker', () => {
			describe('EXPECTATIONS', () => {
				it('is deployed correctly', async () => {
					expect(await market.readNativeToken()).to.be.equal(token.target);
				});
				it('emits an event after updating the native token address', async () => {
					expect(await market.updateNativeToken(altToken.target))
						.to.emit('NativeTokenUpdated')
						.withArgs(token.target, altToken.target);
					expect(await market.readNativeToken()).to.be.equal(altToken.target);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if operator not owner', async () => {
					await expect(
						market.connect(user).updateNativeToken(altToken.target)
					).to.be.revertedWithCustomError(market, 'OwnableUnauthorizedAccount');
				});
				// Internal Inline Modifiers
				// TODO @PROD it('reverts if target is not token contract', async () => {});
				// supportsInterface?
			});
		});
		describe('OracleTracker', () => {
			describe('EXPECTATIONS', () => {
				it('is deployed correctly', async () => {
					expect(await market.readOracle()).to.be.equal(oracle.target);
				});
				it('emits an event after updating the native token address', async () => {
					expect(await market.updateOracle(altOracle.target))
						.to.emit('OracleUpdated')
						.withArgs(oracle.target, altOracle.target);
					expect(await market.readOracle()).to.be.equal(altOracle.target);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if operator not owner', async () => {
					await expect(
						market.connect(user).updateOracle(altOracle.target)
					).to.be.revertedWithCustomError(market, 'OwnableUnauthorizedAccount');
				});
				// Internal Inline Modifiers
				// TODO @PROD it('reverts if target is not oracle contract', async () => {});
				// supportsInterface?
			});
		});
	});

	// TODO @BONUS describe('OfferDatabase CRUD Operations', () => {});
	// TODO @BONUS describe('Purchasing & Proceeds (Offers)', () => {});
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

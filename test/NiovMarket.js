const { ethers } = require('hardhat');
const { assert, expect } = require('chai');

describe('Niov Market', () => {
	let accounts, deployer, user;
	let nativeToken, nativeTokenAddress, oracle, oracleAddress;
	let market, marketAddress, nft, nftAddress;
	// let handler, handlerAddress;
	let altToken, altTokenAddress, altOracle, altOracleAddress;
	const price = 123;
	const tokenId = 1;
	const BigZero = ethers.parseEther('0');

	const logBalance = async (target) => {
		const raw = await ethers.provider.getBalance(target.address);
		const toLog = parseInt(raw) / 10 ** 18;
		console.log('balance:', toLog);
	};

	beforeEach(async () => {
		[deployer, user, ...accounts] = await ethers.getSigners();

		let deployedContract;
		/////////////////////////
		// DEPLOY DEPENDENCIES //
		/////////////////////////
		// DEPLOY WRAPPED NATIVE TOKEN
		const NativeTokenFactory = await ethers.getContractFactory('WETH9');
		deployedContract = await NativeTokenFactory.connect(deployer).deploy();
		nativeToken = deployedContract.connect(deployer);
		nativeTokenAddress = nativeToken.target;
		// DEPLOY ORACLE
		const OracleFactory = await ethers.getContractFactory('EthereumLinkSim');
		deployedContract = await OracleFactory.connect(deployer).deploy();
		oracle = deployedContract.connect(deployer);
		oracleAddress = oracle.target;

		//////////////////////
		// DEPLOY ECOSYSTEM //
		//////////////////////
		/*
		// DEPLOY ORACLE HANDLER
		const OracleHandlerFactory = await ethers.getContractFactory(
			'OracleHandler'
		);
		deployedContract = await OracleHandlerFactory.connect(deployer).deploy(
			oracleAddress,
			nativeTokenAddress
		);
		handler = deployedContract.connect(deployer);
		handlerAddress = oracle.target;
		*/
		// DEPLOY MARKETPLACE
		const NiovMarketFactory = await ethers.getContractFactory('NiovMarket');
		deployedContract = await NiovMarketFactory.connect(deployer).deploy(
			oracleAddress,
			nativeTokenAddress
		);
		market = deployedContract.connect(deployer);
		marketAddress = market.target;
		// DEPLOY BASIC NFT
		const NftFactory = await ethers.getContractFactory('AssetBoundToken');
		deployedContract = await NftFactory.connect(deployer).deploy();
		nft = deployedContract.connect(deployer);
		nftAddress = nft.target;
		// Setup
		await nft.connect(deployer).mintTo(deployer.address);
		await nft.connect(deployer).approve(marketAddress, tokenId);

		////////////////////////
		// DEPLOY SUBSTITUTES //
		////////////////////////
		// DEPLOY ALT TOKEN
		const AltTokenFactory = await ethers.getContractFactory('WMATIC');
		deployedContract = await AltTokenFactory.connect(deployer).deploy();
		altToken = deployedContract.connect(deployer);
		altTokenAddress = altToken.target;
		// DEPLOY Alt ORACLE
		const AltOracleFactory = await ethers.getContractFactory('PolygonLinkSim');
		deployedContract = await AltOracleFactory.connect(deployer).deploy();
		altOracle = deployedContract.connect(deployer);
		altOracleAddress = oracle.target;
	});

	const createListing = async () =>
		await market.connect(deployer).createListing(nftAddress, tokenId, price);
	const readListing = async () =>
		await market.connect(deployer).readListing(nftAddress, tokenId);
	const destroyListing = async () =>
		await market.connect(deployer).destroyListing(nftAddress, tokenId);
	const updateListing = async (newPrice) =>
		await market.connect(deployer).updateListing(nftAddress, tokenId, newPrice);
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
					await createListing();
					const listing = await readListing();
					assert(listing[0] === deployer.address); // seller
					assert(parseInt(listing[1]) === price); // usdPennyPrice
					const expected = await expectedValue(price);
					assert(listing[2] === expected); // rawValueGas
					assert(listing[3] === expected); // rawValueTkn
				});
				it('emits an event after creating a listing', async () => {
					expect(await createListing())
						.to.emit('ListingCreated')
						.withArgs(nftAddress, tokenId, price, deployer.address);
				});
				it('returns empty listing if user transfers NFT after list', async () => {
					await createListing();
					await nft
						.connect(deployer)
						.transferFrom(deployer.address, user.address, tokenId);
					const listing = await readListing();
					assert(listing[0] === ethers.ZeroAddress); // seller
					assert(listing[1] === BigZero); // usdPennyPrice
					assert(listing[2] === BigZero); // rawValueGas
					assert(listing[3] === BigZero); // rawValueTkn
				});
				it('still allows users to relist NFTs after transfer', async () => {
					await createListing();
					await nft
						.connect(deployer)
						.transferFrom(deployer.address, user.address, tokenId);
					await nft.connect(user).approve(marketAddress, tokenId);
					expect(
						await market.connect(user).createListing(nftAddress, tokenId, price)
					)
						.to.emit('ListingCreated')
						.withArgs(nftAddress, tokenId, price, user.address);
					const listing = await readListing();
					assert(listing[0] === user.address); // seller
					assert(parseInt(listing[1]) === parseInt(price)); // price
					const expected = await expectedValue(price);
					assert(listing[2] === expected); // rawValueGas
					assert(listing[3] === expected); // rawValueTkn
				});
				it('Should translate prices correctly', async () => {
					const rate = await exchangeRate();
					const newPrice = rate * 100;
					const wholeEther = ethers.parseEther('1.0');
					await market
						.connect(deployer)
						.createListing(nftAddress, tokenId, newPrice);
					const listing = await readListing();
					// console.log(listing);
					const expectedPrice = ethers.toBigInt(newPrice);
					assert(listing[0] === deployer.address); // seller
					expect(listing[1]).to.be.equal(expectedPrice); // rawValueGas
					expect(listing[2]).to.be.equal(wholeEther); // rawValueGas
					expect(listing[3]).to.be.equal(wholeEther); // rawValueTkn
				});
				it('Double Checking...', async () => {
					const rate = await exchangeRate();
					await market
						.connect(deployer)
						.createListing(nftAddress, tokenId, 100);
					const expected = ethers.toBigInt((1 / rate) * 10 ** 18);
					const listing = await readListing();
					assert(listing[0] === deployer.address); // seller
					assert(listing[1] === ethers.toBigInt(100)); // usdPennyPrice
					expect(listing[2]).to.be.equal(expected); // rawValueGas
					expect(listing[3]).to.be.equal(expected); // rawValueTkn
				});
			});
			describe('ERRORS', () => {
				// External Modifiers
				it('reverts if anyone but the owner tries to call', async () => {
					await expect(
						market.connect(user).createListing(nftAddress, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
					// even if they add approval
					await nft.connect(deployer).approve(user.address, tokenId);
					await expect(
						market.connect(user).createListing(nftAddress, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
				it('reverts if there is already a listing', async () => {
					await createListing();
					await expect(createListing())
						.to.be.revertedWithCustomError(market, 'AlreadyListed')
						.withArgs(nftAddress, tokenId);
				});
				it('needs approvals to list item', async () => {
					await nft.connect(deployer).approve(ethers.ZeroAddress, tokenId);
					await expect(createListing()).to.be.revertedWithCustomError(
						market,
						'NotApprovedForMarketplace'
					);
				});
				// Inline Modifiers
				it('reverts if the price is 0', async () => {
					await expect(
						market.createListing(nftAddress, tokenId, BigZero)
					).revertedWithCustomError(market, 'PriceMustBeAboveZero');
				});
			});
		});

		describe('destroyListing', () => {
			describe('EXPECTATIONS', () => {
				it('removes listings', async () => {
					await createListing();
					await destroyListing();
					const listing = await readListing();
					assert(listing[0] === ethers.ZeroAddress); // seller
					assert(listing[1] === BigZero); // usdPennyPrice
					assert(listing[2] === BigZero); // rawValueGas
					assert(listing[3] === BigZero); // rawValueTkn
				});
				it('emits an event after deleting a listing', async () => {
					await createListing();
					expect(await destroyListing())
						.to.emit('ListingDestroyed')
						.withArgs(nftAddress, tokenId, deployer.address);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if anyone but the owner tries to call', async () => {
					await createListing();
					await expect(
						market.connect(user).destroyListing(nftAddress, tokenId)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
					// even if they add approval
					await nft.connect(deployer).approve(user.address, tokenId);
					await expect(
						market.connect(user).destroyListing(nftAddress, tokenId)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
				// Internal Modifiers
				it('reverts if there is no listing', async () => {
					await expect(destroyListing())
						.to.be.revertedWithCustomError(market, 'NotListed')
						.withArgs(nftAddress, tokenId);
				});
			});
		});

		describe('updateListing', () => {
			const updatedPrice = 420;
			describe('EXPECTATIONS', () => {
				it('updates the price of the listing', async () => {
					await createListing();
					await updateListing(updatedPrice);
					const listing = await readListing();
					assert(listing[0] === deployer.address); // seller
					assert(parseInt(listing[1]) === parseInt(updatedPrice)); // seller
					const expected = await expectedValue(updatedPrice);
					assert(listing[2] === expected); // rawValueGas
					assert(listing[3] === expected); // rawValueTkn
				});
				it('emits an event after price update', async () => {
					await createListing();
					expect(await updateListing(updatedPrice))
						.to.emit('ListingUpdated')
						.withArgs(nftAddress, tokenId, updatedPrice, deployer.address);
				});
				it('can delete listings if price <= 0', async () => {
					await createListing();
					expect(await updateListing(BigZero))
						.to.emit('ListingDestroyed')
						.withArgs(nftAddress, tokenId, deployer.address);
					const listing = await readListing();
					assert(listing[0] === ethers.ZeroAddress); // seller
					assert(listing[1] === BigZero); // usdPennyPrice
					assert(listing[2] === BigZero); // rawValueGas
					assert(listing[3] === BigZero); // rawValueTkn
				});
				it('can delete listings if token not approved', async () => {
					await createListing();
					await nft.connect(deployer).approve(ethers.ZeroAddress, tokenId);
					expect(await updateListing(updatedPrice))
						.to.emit('ListingDestroyed')
						.withArgs(nftAddress, tokenId, deployer.address);
					const listing = await readListing();
					assert(listing[0] === ethers.ZeroAddress); // seller
					assert(listing[1] === BigZero); // usdPennyPrice
					assert(listing[2] === BigZero); // rawValueGas
					assert(listing[3] === BigZero); // rawValueTkn
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if anyone but the owner tries to call', async () => {
					await expect(
						market.updateListing(nftAddress, tokenId, price)
					).to.be.revertedWithCustomError(market, 'NotListed');
					await createListing();
					market = market.connect(user);
					await expect(
						market.updateListing(nftAddress, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
				// Internal Modifiers
				it('reverts if there is no listing', async () => {
					await expect(
						market.updateListing(nftAddress, tokenId, price)
					).to.be.revertedWithCustomError(market, 'NotListed');
					await createListing();
					market = market.connect(user);
					await expect(
						market.updateListing(nftAddress, tokenId, price)
					).to.be.revertedWithCustomError(market, 'SpenderNotOwner');
				});
			});
		});
	});

	const acceptAsk_Gas = async () => {
		const listing = await readListing();
		const value = listing[2]; // listing[2] === rawValueGas
		await market.connect(user).acceptAsk(nftAddress, tokenId, { value });
		return value;
	};
	const withdrawProceeds = async () =>
		await market.connect(deployer).withdrawProceeds();

	describe('Purchasing & Proceeds (LISTINGS)', () => {
		// TODO @BONUS describe('acceptAsk in Wrapped Native Tokens', () => {});

		describe('acceptAsk in Gas', () => {
			describe('EXPECTATIONS', () => {
				it('transfers the nft to the buyer', async () => {
					await createListing();
					await acceptAsk_Gas();
					const newOwner = await nft.ownerOf(tokenId);
					assert(newOwner == user.address);
				});
				it('destroys the listing', async () => {
					await createListing();
					await acceptAsk_Gas();
					const listing = await readListing();
					assert(listing[0] === ethers.ZeroAddress); // seller
					assert(listing[1] === BigZero); // usdPennyPrice
					assert(listing[2] === BigZero); // rawValueGas
					assert(listing[3] === BigZero); // rawValueTkn
				});
				it('updates the proceeds record', async () => {
					await createListing();
					const value = await acceptAsk_Gas();
					const proceeds = await market.checkProceeds(deployer.address);
					assert(proceeds == value);
				});
				it('emits an event after purchase', async () => {
					await createListing();
					const listing = await readListing();
					const value = listing[2];
					expect(await acceptAsk_Gas())
						.to.emit('ListingClosed')
						.withArgs(
							user.address,
							nftAddress,
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
					await expect(
						market
							.connect(deployer)
							.acceptAsk(nftAddress, tokenId, { value: price })
					).to.be.revertedWithCustomError(market, 'SpenderIsOwner');
				});
				it('reverts if the item isnt listed', async () => {
					await expect(
						market
							.connect(user)
							.acceptAsk(nftAddress, tokenId, { value: price })
					).to.be.revertedWithCustomError(market, 'NotListed');
				});
				// Inline Modifiers
				it('reverts if the price isnt met', async () => {
					await createListing();
					await expect(
						market
							.connect(user)
							.acceptAsk(nftAddress, tokenId, { value: BigZero })
					).to.be.revertedWithCustomError(market, 'PriceNotMet');
				});
			});
		});

		describe('withdrawals', () => {
			describe('EXPECTATIONS', () => {
				it('withdraws proceeds', async () => {
					await createListing();
					await acceptAsk_Gas();
					const deployerProceedsBefore = parseInt(
						await market.checkProceeds(deployer.address)
					);
					const deployerBalanceBefore = parseInt(
						await ethers.provider.getBalance(deployer.address)
					);

					const txResponse = await withdrawProceeds();
					const transactionReceipt = await txResponse.wait();
					const { gasUsed, gasPrice } = transactionReceipt;
					const gasCost = parseInt(gasUsed) * parseInt(gasPrice);

					const deployerBalanceAfter = parseInt(
						await ethers.provider.getBalance(deployer.address)
					);

					const beforeAndGas = (deployerBalanceAfter + gasCost).toPrecision(14);
					const expectedBalance = (
						deployerProceedsBefore + deployerBalanceBefore
					).toPrecision(14);

					expect(beforeAndGas).to.be.equal(expectedBalance);
				});
				it('emits an event after withdrawal', async () => {
					await createListing();
					const value = await acceptAsk_Gas();
					expect(await withdrawProceeds())
						.to.emit('ListingClosed')
						.withArgs(price, value, deployer.address);
				});
			});
			describe('ERRORS', () => {
				// Inline Modifiers
				it("doesn't allow 0 proceed withdrawls", async () => {
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
					expect(await market.readNativeToken()).to.be.equal(
						nativeTokenAddress
					);
				});
				it('emits an event after updating the native token address', async () => {
					expect(await market.updateNativeToken(altTokenAddress))
						.to.emit('NativeTokenUpdated')
						.withArgs(nativeTokenAddress, altTokenAddress);
					expect(await market.readNativeToken()).to.be.equal(altTokenAddress);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if operator not owner', async () => {
					await expect(
						market.connect(user).updateNativeToken(altTokenAddress)
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
					expect(await market.readOracle()).to.be.equal(oracleAddress);
				});
				it('emits an event after updating the native token address', async () => {
					expect(await market.updateOracle(altOracleAddress))
						.to.emit('OracleUpdated')
						.withArgs(oracleAddress, altOracleAddress);
					expect(await market.readOracle()).to.be.equal(altOracleAddress);
				});
			});
			describe('ERRORS', () => {
				// Public Modifiers
				it('reverts if operator not owner', async () => {
					await expect(
						market.connect(user).updateOracle(altOracleAddress)
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

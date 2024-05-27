const { ethers } = require('hardhat');
require('@nomicfoundation/hardhat-chai-matchers');
const { expect } = require('chai');

describe('Mintable721', () => {
	let deployer, clients;
	let contract;
	const baseURI = 'http://localhost:3000/api/ligand/';

	beforeEach(async () => {
		[deployer, ...clients] = await ethers.getSigners();
		const ContractFactory = await ethers.getContractFactory('NiovLigandToken');
		contract = await ContractFactory.connect(deployer).deploy();
	});

	describe('Deployment', () => {
		it('Should deploy successfully', async () => {
			expect(await contract.name()).to.equal('Niov Ligand Token');
			expect(await contract.symbol()).to.equal('NLT');
			expect(await contract.numTokens()).to.equal(0);
			expect(await contract.owner()).to.equal(deployer.address);
		});
		it('Should prevent the display of unminted URIs', async () => {
			for (let i = 0; i < 10; i++) {
				await expect(contract.tokenURI(i))
					.to.be.revertedWithCustomError(contract, 'ERC721NonexistentToken')
					.withArgs(i);
			}
		});
		it('Should prevent the display of the zero address inventory', async () => {
			await expect(contract.inventoryOf(ethers.ZeroAddress))
				.to.be.revertedWithCustomError(contract, 'ERC721InvalidOperator')
				.withArgs(ethers.ZeroAddress);
		});
	});

	describe('Mocks', () => {
		it('Should deploy successfully once', async () => {
			const MockFactory = await ethers.getContractFactory(
				'WrappedFortniteSkins'
			);
			const mock = await MockFactory.connect(deployer).deploy();
			expect(await mock.name()).to.equal('Wrapped Fortnite Skins');
			expect(await mock.symbol()).to.equal('4SKINZ');
			expect(await mock.numTokens()).to.equal(0);
			expect(await mock.owner()).to.equal(deployer.address);
		});

		it('Should deploy successfully twice', async () => {
			const MockFactory = await ethers.getContractFactory('ExpensiveJpeg');
			const mock = await MockFactory.connect(deployer).deploy();
			expect(await mock.name()).to.equal('Expensive JPEG');
			expect(await mock.symbol()).to.equal('$JPG');
			expect(await mock.numTokens()).to.equal(0);
			expect(await mock.owner()).to.equal(deployer.address);
		});

		it('Should deploy successfully thrice', async () => {
			const MockFactory = await ethers.getContractFactory('NiftyTrash');
			const mock = await MockFactory.connect(deployer).deploy();
			expect(await mock.name()).to.equal('Nifty Trash');
			expect(await mock.symbol()).to.equal('TRASH');
			expect(await mock.numTokens()).to.equal(0);
			expect(await mock.owner()).to.equal(deployer.address);
		});
	});

	describe('Operation', () => {
		it('Should mint properly and track inventory', async () => {
			expect(await contract.numTokens()).to.equal(0);
			let firstExpectedArray = [];
			for (let i = 1; i <= 10; i++) {
				firstExpectedArray.push(i);
				await contract.connect(deployer).mintTo(clients[0].address);
				expect(await contract.numTokens()).to.equal(i);
				expect(await contract.inventoryOf(deployer.address)).to.deep.equal([]);
				expect(await contract.inventoryOf(clients[0].address)).to.deep.equal(
					firstExpectedArray
				);
			}
			let secondExpectedArray = [];
			for (let i = 11; i <= 20; i++) {
				secondExpectedArray.push(i);
				await contract.connect(deployer).mintTo(clients[1].address);
				expect(await contract.numTokens()).to.equal(i);
				expect(await contract.inventoryOf(deployer.address)).to.deep.equal([]);
				expect(await contract.inventoryOf(clients[1].address)).to.deep.equal(
					secondExpectedArray
				);
				expect(await contract.inventoryOf(clients[0].address)).to.deep.equal(
					firstExpectedArray
				);
			}
		});

		it('Should display the URI of minted tokens', async () => {
			expect(await contract.numTokens()).to.equal(0);
			for (let i = 1; i <= 10; i++) {
				await contract.connect(deployer).mintTo(clients[0].address);
				expect(await contract.numTokens()).to.equal(i);
				for (let j = 11; j > i; j--) {
					await expect(contract.tokenURI(j))
						.to.be.revertedWithCustomError(contract, 'ERC721NonexistentToken')
						.withArgs(j);
				}
				for (let j = 1; j <= i; j++) {
					expect(await contract.tokenURI(j)).to.equal(baseURI + j);
				}
			}
		});

		it('Should not mint to zero address', async () => {
			expect(await contract.numTokens()).to.equal(0);
			await expect(contract.connect(deployer).mintTo(ethers.ZeroAddress))
				.to.be.revertedWithCustomError(contract, 'ERC721InvalidReceiver')
				.withArgs(ethers.ZeroAddress);
			expect(await contract.numTokens()).to.equal(0);
		});

		it('Should only allow deployer(owner) to mint', async () => {
			expect(await contract.numTokens()).to.equal(0);
			for (let i = 0; i < clients.length; i++) {
				await expect(contract.connect(clients[i]).mintTo(clients[1].address))
					.to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount')
					.withArgs(clients[i].address);
			}
			expect(await contract.numTokens()).to.equal(0);
		});
	});
});

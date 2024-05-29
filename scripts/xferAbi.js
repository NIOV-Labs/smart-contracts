const { transferAbi } = require('./utils/hardhat');
// For contracts that are deployed by a factory
(async () => {
	// transferAbi('ABT010');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

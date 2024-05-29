const { transferAbi } = require('./utils/deployment');
// For contracts that are deployed by a factory
(async () => {
	const roots = ['.', '../backend', '../frontend'];
	// transferAbi('ABT010', roots);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

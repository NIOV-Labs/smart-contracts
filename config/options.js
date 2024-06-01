const gasReporterDisabled = { enabled: false };

const gasReporterEnabled = {
	enabled: true,
	currency: 'USD',
	excludeContracts: [],
};

const solidity = {
	version: '0.8.20',
	settings: {
		optimizer: { enabled: true, runs: 200 },
	},
};

module.exports = { gasReporterDisabled, gasReporterEnabled, solidity };

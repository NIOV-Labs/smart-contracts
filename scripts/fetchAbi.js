const { artifacts } = require('hardhat');

const fs = require('fs');
const Cache = require('../utils/Cache');
function fetchAbi(name) {
	const roots = ['.', '../niov-backend', '../niov-frontend'];
	roots.forEach((repo) => {
		let destination = `${repo}/utils/interfaces`;
		if (!fs.existsSync(destination)) fs.mkdirSync(destination);
		const abi = new Cache(`${destination}/${name}.json`);
		abi.update({ abi: artifacts.readArtifactSync(name).abi });
	});
}
(async () => {
	// fetchAbi('ABT010');
	// fetchAbi('ABTLayers');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

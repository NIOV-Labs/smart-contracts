const fs = require('fs');

function rmDir(pathTo) {
	if (fs.existsSync(pathTo)) fs.rmSync(pathTo, { recursive: true });
}

rmDir('./artifacts');
rmDir('./cache');

const roots = ['.', '../backend', '../frontend'];
roots.forEach((repo) => {
	rmDir(`${repo}/utils/deploymentMap/31337.json`);
	rmDir(`${repo}/utils/interfaces`);
});

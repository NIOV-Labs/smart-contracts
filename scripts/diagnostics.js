const EvmConfig = require('../utils/evm/Config');
new EvmConfig(true);

// const pkgVersion = (pkgName) => {
// 	try {
// 		var pkg = require(pkgName);
// 		var pkgVersion = require(`${pkgName}/package.json`).version;
// 		console.log(`${pkgName}@${pkgVersion}`);
// 	} catch (er) {
// 		pkg = null;
// 	}
// };

// const packageJson = require('@nomicfoundation/hardhat-toolbox/package.json');
// console.log('\npeerDependencies', packageJson.peerDependencies);

import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Factory", (m) => {
  const factory = m.contract("Factory", []);
  
  return { factory }

})



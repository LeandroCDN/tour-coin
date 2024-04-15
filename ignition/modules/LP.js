const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LPModule", (m) => {
  const LP = m.contract("LP");
  return { LP };
});
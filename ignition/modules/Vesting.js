const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


//(address currency_, uint8 maxClaims_, address newOwner)
const Currency = "0x6FE09ce1C0Af342EB7eda03Bf393694f20eA5042";
const MaxClaims = 11n;
const NewOwner = "0xe027625a79C62E2967a4Ac3B5aA11a7a07cca7fd";

module.exports = buildModule("VestingModule", (m) => {
  const currency = m.getParameter("currency", Currency);
  const maxClaims_ = m.getParameter("maxClaims_", MaxClaims);
  const newOwner = m.getParameter("newOwner", NewOwner);

  const vesting = m.contract("Vesting", [currency,maxClaims_,newOwner]);

  return { vesting };
});
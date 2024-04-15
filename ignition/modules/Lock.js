const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const _lpLockAddress = "0x2417E3Caa8a18aca2b80DcE4925775A0F2dD00Aa";

module.exports = buildModule("LockModule", (m) => {
  const lpLockAddress = m.getParameter("lpLockAddress", _lpLockAddress);

  const lock = m.contract("Lock", [lpLockAddress]);

  return { lock };
});

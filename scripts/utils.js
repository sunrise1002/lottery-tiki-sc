const fs = require("fs");
const path = require("path");

function getContracts() {
  let json;
  try {
    const env = process.env.NODE_ENV;
    json = fs.readFileSync(
      path.join(__dirname, `../configs/${env}.contract-addresses.json`)
    );
  } catch (err) {
    json = "{}";
  }
  const addresses = JSON.parse(json);
  return addresses;
}

function saveContract(network, contract, address) {
  const env = process.env.NODE_ENV;

  const addresses = getContracts();
  addresses[network] = addresses[network] || {};
  addresses[network][contract] = address;
  fs.writeFileSync(
    path.join(__dirname, `../configs/${env}.contract-addresses.json`),
    JSON.stringify(addresses, null, "    ")
  );
}

module.exports = {
  getContracts,
  saveContract,
};

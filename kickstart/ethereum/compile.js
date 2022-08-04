const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");

const buildPath = path.resolve(__dirname, "build");  // path to the build folder
fs.removeSync(buildPath);  // remove the build folder if it exists

const campaignPath = path.resolve(__dirname, "contracts", "Campaign.sol");  // path to the campaign contract
const source = fs.readFileSync(campaignPath, "utf8"); // read the contract source code from the file
const output = solc.compile(source, 1).contracts;  // compile the contract source code and get the output

fs.ensureDirSync(buildPath);  // create the build folder if it doesn't exist

for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(":", "") + ".json"),
    output[contract]  // write the output to the build folder
  );
}  // for each contract in the output

const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");
const { isTypedArray } = require("util/types");
const { isReadable } = require("stream");

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () =>{
    accounts = await web3.eth.getAccounts(); // get the list of accounts from the blockchain

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))  // create a new contract instance
        .deploy({ data: compiledFactory.bytecode })  // deploy the contract
        .send({ from: accounts[0], gas: "1000000" });  // send the transaction to the blockchain

    await factory.methods.createCampaign("100").send({
        from: accounts[0],
        gas: "1000000"
    });  // create a new campaign from the factory contract

    [campaignAddress] = await factory.methods.getDeployedCampaigns().call(); // get the list of deployed campaigns

    campaign = await new web3.eth.Contract(
        JSON.parse(compiledCampaign.interface),
        campaignAddress
    ); // create a new contract instance

});  // run before each test

describe("Campaigns", () => {
    it('dapploy factory and campaign', () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it('marks coller as campagin manager', async () => {
        const manager = await campaign.methods.manager().call();
        assert.equal(accounts[0], manager);
    });

    it('allows people to contribute money and marks them as approvers', async () => {
        await campaign.methods.contribute().send({
            value: '200',
            from: accounts[1]
        })
        const isContributor = await campaign.methods.approvers(accounts[1]).call();
        assert(isContributor);
    });

    it('requires a minimum contribution', async () => {
        try {
            await campaign.methods.contribute().send({
                value: '5',
                from: accounts[1]
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('allows a manager to make a payment request', async () => {
        await campaign.methods
            .createRequest('Buy batteries', '100', accounts[1])
            .send({from: accounts[0], gas: '1000000'});
        const request = await campaign.methods.requests(0).call();
        assert.equal('Buy batteries', request.description);
    });

    it("processes requests", async () => {
        await campaign.methods.contribute().send({
          from: accounts[0],
          value: web3.utils.toWei("10", "ether"),
        });

        await campaign.methods
          .createRequest("A", web3.utils.toWei("5", "ether"), accounts[1])
          .send({ from: accounts[0], gas: "1000000" });

        await campaign.methods.approveRequest(0).send({
          from: accounts[0],
          gas: "1000000",
        });

        let oldBalance = await web3.eth.getBalance(accounts[1]);
        oldBalance = web3.utils.fromWei(oldBalance, "ether");
        oldBalance = parseFloat(oldBalance);
        //console.log(oldBalance);

        await campaign.methods.finalizeRequest(0).send({
          from: accounts[0],
          gas: "1000000",
        });

        let balance = await web3.eth.getBalance(accounts[1]);
        balance = web3.utils.fromWei(balance, "ether");
        balance = parseFloat(balance);
        //console.log(balance);
        assert(balance > oldBalance);
      });
    });
pragma solidity ^0.4.17;

contract campaignFactory {
    address[] public deploydCampaigns;

    function createCampaign(uint minimum) public {
        address newCampaign = new Campaign(minimum, msg.sender);
        deploydCampaigns.push(newCampaign);
    }  // create campaign with minimum contribution

    function getDeployedCampaigns() public view returns (address[]) {
        return deploydCampaigns;
    }  // get list of all campaigns
}

contract Campaign {
    struct Request {
        string description; // description of the request for what the funds will be used
        uint value; //in ether
        address recipient; // address of the recipient of the funds (who will receive the funds)
        bool complete; // true if request has been completed and the funds have been sent
        uint approvalCount; // count of approvals for this request
        mapping(address => bool) approvals; // mapping of address of the approver if approved
    }  // the Request struct is used to store the data for a request

    Request[] public requests;
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount;

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }  // modifier function to restrict access to the other functions only to the manager

    constructor (uint minimum, address creator) public {
        manager = creator;
        minimumContribution = minimum;
    }  // constructor defines the manager and minimum contribution

    function contribute() public payable {
        require(msg.value > minimumContribution);  // check if the contribution is greater than the minimum

        approvers[msg.sender] = true;  // add the sender to the approvers mapping with a value of true  
        approversCount++;
    }  // contribute to the campaign (only if you contribute at least minimumContribution)

    function createRequest(string description, uint value, address recipient) public restricted {
        Request memory newRequest = Request({
            description: description,
            value: value,
            recipient: recipient,
            complete: false,
            approvalCount: 0
        }); // memory is a keyword in Solidity and is used to create a new struct in memory instead of on the blockchain

        requests.push(newRequest);  // add newRequest to the requests array
    }   // this function is called by the manager to create a new request

    function approveRequest(uint index) public {
        Request storage request = requests[index];  // get the request at the index

        require(approvers[msg.sender]);  // check if the sender is in the approvers mapping with a value of true (only if you are an contributor)
        require(!request.approvals[msg.sender]);  // check if the sender has already approved the request if not, then continue
        
        request.approvals[msg.sender] = true;  // add the sender to the approvals mapping (maping of address of the approver if already approved)
        request.approvalCount++;  // increase the approval count
    }

    function finalizeRequest(uint index) public restricted {
        Request storage request = requests[index];  // get the request at the index

        require(request.approvalCount > (approversCount / 2));  // check if the number of approvals is greater than half the number of contributors
        require(!request.complete);  // check if the request has already been completed

        request.recipient.transfer(request.value);  // transfer the funds to the recipient
        request.complete = true;  // set the request to complete
    } // finalizeRequest is called by the manager to finalize a request and send the funds to the recipient

    function getSummary() public view returns (
        uint, uint, uint, uint, address
    ) {
        return (
            minimumContribution,
            this.balance,
            requests.length,
            approversCount,
            manager
        );
    } // getSummary returns the minimumContribution, balance, number of requests, number of approvers, and manager

    function getRequestCout() public view returns (uint) {
        return requests.length;
    } // getRequestCount returns the number of requests
} 
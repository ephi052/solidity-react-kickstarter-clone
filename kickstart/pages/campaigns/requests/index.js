import React, { Component } from 'react';
import Layout from '../../../components/Layout';
import { Table, Button } from 'semantic-ui-react';
import { Link } from '../../../routes';
import Campaign from '../../../ethereum/campaign';
import RequestRow from '../../../components/RequestRow';

class RequestIndex extends Component {
    static async getInitialProps(props) {
        const { address } = props.query;
        const campaign = Campaign(address);
        const requestsCount = await campaign.methods.getRequestCout().call();
        const approversCount = await campaign.methods.approversCount().call();

        const requests = await Promise.all(
            Array(parseInt(requestsCount)).fill().map(async (element, index) => {
                return campaign.methods.requests(index).call();
            })
        );
        
        return { 
            address: address, 
            requests: requests, 
            requestsCount: requestsCount, 
            approversCount: approversCount 
        };
    }

    renderRows() {
        return this.props.requests.map((request, index) => {
            return <RequestRow 
                key={index}
                id={index}
                request={request}
                address={this.props.address}
                approversCount={this.props.approversCount}
            />;
        });
    }

    render() {
        const { Header, Row, HeaderCell, Body } = Table;

        return (
            <Layout>
                <h3>
                    Requests of Campaign 
                    <Link route={`/campaigns/${this.props.address}`}>
                        <a> {this.props.address}</a>
                    </Link>
                </h3>
                <Link route={`/campaigns/${this.props.address}/requests/new`}>
                    <a>
                        <Button primary floated='right' style={{ marginBottom : 10}}>
                            Add Request
                        </Button>
                    </a>
                </Link>
                <Table>
                    <Header>
                        <Row>
                            <HeaderCell>ID</HeaderCell>
                            <HeaderCell>Description</HeaderCell>
                            <HeaderCell>Amount</HeaderCell>
                            <HeaderCell>Recipient</HeaderCell>
                            <HeaderCell>Approval Count</HeaderCell>
                            <HeaderCell>Approve</HeaderCell>
                            <HeaderCell>Finalize</HeaderCell>
                            <HeaderCell>Completed</HeaderCell>
                        </Row>
                    </Header>
                    <Body>
                        {this.renderRows()}
                    </Body>
                </Table>
                <div>
                    Total Requests: {this.props.requestsCount}
                </div>
            </Layout>
        );
    }
}

export default RequestIndex;
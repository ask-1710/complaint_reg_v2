# complaint_reg_v2

Welcome to Criminal Investigation and Complaint Tracking using Blockchain

This project is developed by Aarthi Suresh Kumar and Anirudh TN, final year students of SSN College of Engineering and submitted as their final year project. 

The project aims to revolutionalize complaint evidence management and sharing ensuring high levels of security and reliability using blockchain.

It is developed in Internet Computer Blockchain and the canisters/smart contracts are coded in motoko, language developed for building smart contracts in internet computer by Dfinity.


Link referred while working on the project:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/quickstart/hello10mins)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/)
- [Motoko Language Quick Reference](https://internetcomputer.org/docs/current/references/motoko-ref/)
- [JavaScript API Reference](https://erxue-5aaaa-aaaab-qaagq-cai.raw.ic0.app)



## Running the project locally

If you want to run the project locally, you can use the following commands:

```bash
cd complaint_reg_v2/

# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy

# Start the server for frontend application
npm start

# Start the IPFS local node 
jsipfs daemon
```

<!-- Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`. -->

The above commands will deploy and run three backend canisters, one load balancer canister, a frontend canister in port 4943.

It will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.


# INSTALLATION GUIDE

Use only node v18.10.0 and npm v8.19.2

Install dfx 0.12.1

Run 

**DFX_VERSION=0.12.1 sh -ci "$(curl -sSL https://internetcomputer.org/install.sh)"**

Follow the instructions above to get started with the project

**npm i --location=global ipfs**  -> to install cli to spawn local ipfs node 

Run these two commnads:

jsipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://127.0.0.1:5002", "http://localhost:3000", "http://127.0.0.1:5001", "https://webui.ipfs.io"]'
jsipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'


Command to run to spawn a node

**jsipfs daemon** -> command to run


To install ipfs-http-client to connect this application to the local IPFS node

**npm i ipfs-http-client** -> in the root directory of the project




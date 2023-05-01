# Criminal Investigation and Complaint Tracking using Blockchain

Welcome to Criminal Investigation and Complaint Tracking using Blockchain

This project is developed and submitted by Aarthi Suresh Kumar and Anirudh TN, final year students at SSN College of Engineering, as their final year project.

It aims to revolutionalize complaint evidence management and sharing by ensuring high levels of security and reliability using blockchain.

This project runs on Internet Computer Blockchain and the canisters/smart contracts are developed in Motoko, frontend is developed using React.


Link referred while working on the project:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/quickstart/hello10mins)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/)
- [Motoko Language Quick Reference](https://internetcomputer.org/docs/current/references/motoko-ref/)
- [JavaScript API Reference](https://erxue-5aaaa-aaaab-qaagq-cai.raw.ic0.app)



# INSTALLATION GUIDE

Use only versions node v18.10.0 and npm v8.19.2 to run this project

Install dfx 0.12.1 by running the following command in the terminal

Run 
```bash
DFX_VERSION=0.12.1 sh -ci "$(curl -sSL https://internetcomputer.org/install.sh)"
```
Install IPFS cli to spawn an IPFS node locally

```bash
# to install cli to spawn local ipfs node 
npm i --location=global ipfs
````


Run these two commnads:
```bash
jsipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://127.0.0.1:5002", "http://localhost:3000", "http://127.0.0.1:5001", "https://webui.ipfs.io"]'

jsipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'

```

Command to run to spawn a node
```bash
jsipfs daemon
```

To install ipfs-http-client to connect this application to the local IPFS node
```bash
# in the root directory of the project
npm i ipfs-http-client
```

Add the chrome extension for plug wallet. Create an account if required or import the secret keys to import an existing wallet.





# RUN THE PROJECT

If you want to run the project locally, you can use the following commands:

```bash
cd complaint_reg_v2/

```
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy

# Start the server for frontend application
npm start

# Start the IPFS local node 
jsipfs daemon

# To stop the local network
dfx stop
```

<!-- Once the job completes, the application will be available at `http://localhost:4943?canisterId={asset_canister_id}`. -->

The above commands will deploy and run three backend canisters, one load balancer canister, and a frontend canister and starts a webserver at port 4943.

The server for the frontend will run at `http://localhost:8080`, proxying API requests to the replica at port 4943.


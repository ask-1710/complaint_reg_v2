import React, { useEffect , useState } from "react";
import ReactDOM from "react-dom/client";
import { complaint_reg_v2_backend } from "../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../declarations/complaint_reg_v2_backend";
import Registeration from "./components/registeration";
import { Router } from "../../../node_modules/react-router-dom/dist/index";
import { Route } from "../../../node_modules/react-router-dom/dist/index";
import PoliceDashboard from "./pages/PoliceDashboard";
import { redirect } from "react-router-dom";
import { Navbar } from "../../../node_modules/react-bootstrap/esm/index";
import { Link } from "../../../node_modules/react-router-dom/dist/index";


const App = function () {
  const [num, setNum] = useState(4);
  const [actor, setActor] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [principalId, setPrincipalId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);

  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
  const whitelist = [nnsCanisterId];
  const host = "http://127.0.0.1:4943";

  // useEffect(() => {
  //   verifyConnection();
  // }, []);

  useEffect(() => {
    if (isConnected) createActor();
  }, [isConnected]);

  useEffect(() => {
    if (principalId != "" && actor != "") verifyUser();
  }, [principalId, actor]);

  useEffect(() => {
    if (!isNewUser) getUserDetails();
  }, [isNewUser]);

  // REGISTERING & CREATING ACTOR
  const verifyConnection = async () => {
    // const connected = await window.ic.plug.isConnected();
    // if (!connected) {
    setActor(false);
    setIsConnected(false);
    await connecttion();
    // } else {
    //   console.log("connection already exists : verify connection ");
    //   await createActor();
    //   setIsConnected(true);
    // }
  };
  const onConnectionUpdate = () => {
    console.log(
      window.ic.plug.sessionManager.sessionData + " set connection update"
    );
  };
  const connecttion = async () => {
    try {
      const publicKey = await window.ic.plug.requestConnect({
        whitelist,
        host,
        onConnectionUpdate,
        timeout: 50000,
      });
      console.log(`The connected user's public key is:`, publicKey);
      if (publicKey) {
        setIsConnected(true);
        setPublicKey(publicKey);
        const principalId = await window.ic.plug.agent.getPrincipal();
        if (principalId) {
          console.log(`The connected user's principal id is:`, principalId);
          setPrincipalId(principalId);
        }
        // Create an actor to interact with the NNS Canister
        // we pass the NNS Canister id and the interface factory
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.log(e);
    }
  };
  const createActor = async () => {
    try {
      const NNSUiActor = await window.ic.plug.createActor({
        canisterId: nnsCanisterId,
        interfaceFactory: idlFactory,
      });
      setActor(NNSUiActor);
      // await createUser();
    } catch (ex) {
      console.log("Error while creating actor\n" + ex);
    }
  };

  /*************INTERACTION WITH BC ****************/
  const verifyUser = async () => {
    if (principalId) {
      const isNew = await actor.isNewActor();
      if (isNew) {
        setIsNewUser(true);
      } else {
        setIsNewUser(false);
      }
    }
  };

  const getUserDetails = async () => {
    const details = await actor.getUserDetails();
    console.log(details);

  };
  /*************INTERACTION WITH BC ****************/

  /**************EVENT HANDLERS ***********************/
  const connectToPlug = () => {
    verifyConnection();
  };
  /**************EVENT HANDLERS ***********************/

  return (
    <div className="container">
      <p>{num}</p>
      {isConnected && actor != "" ? (
        isNewUser ? (
          <>
            <Registeration actor={actor} principalId={principalId} />
          </>
        ) : (
          <>
          <Navbar>
            <ul>
              <li>Smart Police Chain</li>
              {/* <li><Link to="policedashboard">Police Dashboard</Link></li> */}
            </ul>
          </Navbar>
          <br/>
          <PoliceDashboard actor = {actor}/>
            {/* <Router> */}
              {/* <Route path="/userdashboard">
                <UserDashboard
                  actor={actor}
                  setActor={setActor}
                  principalId={principalId}
                />
              </Route> */}
              {/* <Route path="/addComplaint">
                <ComplaintForm 
                  actor={actor}
                  setActor={setActor}
                  principalId={principalId}
                />
              </Route> */}
              {/* <Route path="/policedashboard" element={<PoliceDashboard actor={actor}/>}>
                <PoliceDashboard
                  actor={actor}
                />
              </Route> */}
            {/* </Router> */}
          </>
        )
      ) : (
        <button onClick={connectToPlug} value="Connect to plug">
          Connect to Plug
        </button>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);

/*
      <button onClick={callBackendCanister}>Call BE canister</button>

*/

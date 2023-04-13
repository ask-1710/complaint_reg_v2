// import logo from './logo.svg';
import Registeration from "./components/registeration";
import PoliceDashboard from "./pages/PoliceDashboard";
import React, { useState, useEffect } from "react";
import UserDashboard from "./pages/UserDashboard";
import { Route, Routes, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {canisterId as canisterId1, complaint_reg_v2_backend_1, idlFactory as idlFactory1} from "../../declarations/complaint_reg_v2_backend_1";
import {canisterId as canisterId2, complaint_reg_v2_backend_2, idlFactory as idlFactory2} from "../../declarations/complaint_reg_v2_backend_2";
import {canisterId as canisterId3, complaint_reg_v2_backend_3, idlFactory as idlFactory3} from "../../declarations/complaint_reg_v2_backend_3";
import {canisterId as canisterIdLB, complaint_reg_v2_load_balancer, idlFactory as idlFactoryLB} from "../../declarations/complaint_reg_v2_load_balancer";

import ComplaintView from "./pages/ComplaintView";
import FileFrame from "./components/fileFrame";
const App = function () {
  const [actor, setActor] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [principalId, setPrincipalId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [actor1, setActor1] = useState("")
  const [actor2, setActor2] = useState("")
  const [actor3, setActor3] = useState("")
  const [actorLB, setActorLB] = useState("")
  const [isNewUser, setIsNewUser] = useState([true, ""]);
  const [actors, setActors] = useState([]);
  const navigate = useNavigate();
  


  const whitelist = [process.env.COMPLAINT_REG_V2_BACKEND_1_CANISTER_ID, process.env.COMPLAINT_REG_V2_BACKEND_2_CANISTER_ID, process.env.COMPLAINT_REG_V2_BACKEND_3_CANISTER_ID, process.env.COMPLAINT_REG_V2_LOAD_BALANCER_CANISTER_ID];
  console.log(whitelist);
  const host = "http://127.0.0.1:4943";
  const pathname = useLocation().pathname;

  useEffect(() => {
    if (isConnected) createActor1();
  }, [isConnected]);

  useEffect(() => {
    if (principalId != "" && actor != "") verifyUser();
  }, [principalId, actor]);

  // REGISTERING & CREATING ACTOR
  const verifyConnection = async () => {
    
    setActor(false);
    setIsConnected(false);
    await connecttion();
    
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
        // const principalId = await window.ic.plug.agent.getPrincipal();
        const principalId = window.ic.plug.sessionManager.sessionData.principalId;

        if (principalId) {
          console.log(`The connected user's principal id is:`, principalId);
          setPrincipalId(principalId);
        }
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.log(e);
    }
  };
  const createActor1 = async () => {
    try {
      const NNSUiActor = await window.ic.plug.createActor({
        canisterId: process.env.COMPLAINT_REG_V2_BACKEND_1_CANISTER_ID,
        interfaceFactory: idlFactory1,
      });
      setActor(NNSUiActor);
    } catch (ex) {
      console.log("Error while creating actor\n" + ex);
    }
  };
  const createActor2 = async () => {
    var actor2 = await window.ic.plug.createActor({
      canisterId: process.env.COMPLAINT_REG_V2_BACKEND_2_CANISTER_ID,
      interfaceFactory: idlFactory2,
    });
    actors.push(actor2);
    setActor(actor2)
  }
  const createActor3 = async () => {
    var actor3 = await window.ic.plug.createActor({
      canisterId: process.env.COMPLAINT_REG_V2_BACKEND_3_CANISTER_ID,
      interfaceFactory: idlFactory3,
    });
    actors.push(actor3);
    setActor(actor3)
  }
  const createActorLB = async () => {
    var actor4 = await window.ic.plug.createActor({
      canisterId: process.env.COMPLAINT_REG_V2_LOAD_BALANCER_CANISTER_ID,
      interfaceFactory: idlFactoryLB,
    });
    actors.push(actor4);
    setActor(actor);
  }

  // /*************INTERACTION WITH BC ****************/
  const verifyUser = async () => {
    if (isConnected) {
      const isNew = await complaint_reg_v2_load_balancer.isNewActor(principalId);
      console.log(isNew);
      if (isNew[0]) {
        setIsNewUser(isNew);
        setIsSetupComplete(true);
      } else {
        if (isNew[1] == "user") {
          setIsSetupComplete(true);
          setIsNewUser(isNew);
          navigate("/userdashboard", {
            state: { actor: actor, principalId: principalId },
          });
        }
        if (isNew[1] == "police") {
          setIsSetupComplete(true);
          setIsNewUser(isNew);
          navigate("/policedashboard", {
            state: { actor: actor, principalId: principalId },
          });
        }
      }
    }
  };
  // /*************INTERACTION WITH BC ****************/

  // /**************EVENT HANDLERS ***********************/

  const connectToPlug = () => {
    verifyConnection();
  };
  // /**************EVENT HANDLERS ***********************/

  return (
    <div className="body-container">
      {pathname == "/" && (
        <>
        <h1>Complaint Tracking & Criminal Investigation System</h1>
          {isConnected && isSetupComplete ? (
            isNewUser[0] && (
              <Registeration
                actor={actor}
                createActor1={createActor1}
                createActor2={createActor2}
                createActor3={createActor3}
                actors={actors}
                principalId={principalId}
                setIsNewUser={setIsNewUser}
              />
            )
          ) : (
            <div className="registeration-card">
              <div className="center">
                <div className="typewriter">
                  <p>
                    All you have to do to login is connect with plug wallet!
                  </p>
                </div>
                <br />
                <button
                  className="plug-button button-27"
                  onClick={connectToPlug}
                  value="Connect to plug"
                >
                  Connect to Plug
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Routes>
        <Route
          path="/userdashboard"
          element={
            <UserDashboard
              setIsConnected={setIsConnected}
              createActor1={createActor1}
              createActor2={createActor2}
              createActor3={createActor3}
              createActorLB={createActorLB}
              setIsNewUser={setIsNewUser}
              actors={actors}
              actor={actor}
              setIsSetupComplete={setIsSetupComplete}
            />
          }
        ></Route>
        <Route
          path="/policedashboard"
          element={
            <PoliceDashboard
              setIsConnected={setIsConnected}
              createActor1={createActor1}
              createActor2={createActor2}
              createActor3={createActor3}
              createActorLB={createActorLB}
              setIsNewUser={setIsNewUser}
              actors={actors}
              actor={actor}
              setIsSetupComplete={setIsSetupComplete}
            />
          }
        ></Route>
        <Route
          path="/complaintview/:complaintId/*"
          element={
            <ComplaintView
              setIsConnected={setIsConnected}
              createActor1={createActor1}
              createActor2={createActor2}
              createActor3={createActor3}
              createActorLB={createActorLB}
              setIsNewUser={setIsNewUser}
              actors={actors}
              actor={actor}
              setIsSetupComplete={setIsSetupComplete}
            />
          }
        >
          <Route path=":cid" element={<FileFrame />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
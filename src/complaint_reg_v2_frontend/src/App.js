// import logo from './logo.svg';
import Registeration from "./components/registeration";
import PoliceDashboard from "./pages/PoliceDashboard";
import React, { useState, useEffect } from "react";
import UserDashboard from "./pages/UserDashboard";
import { Route, Routes } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { complaint_reg_v2_backend } from "../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../declarations/complaint_reg_v2_backend";

const App = function () {
  const [actor, setActor] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [principalId, setPrincipalId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isNewUser, setIsNewUser] = useState([true, ""]);
  const navigate = useNavigate();

  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
  const whitelist = [nnsCanisterId];
  const host = "http://127.0.0.1:4943";

  useEffect(() => {
    if (isConnected) createActor();
  }, [isConnected]);

  useEffect(() => {
    if (principalId != "" && actor != "") verifyUser();
  }, [principalId, actor]);

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
    } catch (ex) {
      console.log("Error while creating actor\n" + ex);
    }
  };

  // /*************INTERACTION WITH BC ****************/
  const verifyUser = async () => {
    if (isConnected) {
      const isNew = await actor.isNewActor();
      if (isNew[0]) {
        setIsNewUser(isNew);
      } else {
        if (isNew[1] == "user") {
          setIsNewUser(isNew);
          navigate("/userdashboard", {
            state: { actor: actor, principalId: principalId },
          });
        }
        if (isNew[1] == "police") {
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
      {isConnected ? (
        isNewUser[0] && (
          <Registeration
            actor={actor}
            principalId={principalId}
            setIsNewUser={setIsNewUser}
          />
        )
      ) : (
        <div className="registeration-card">
          <div className="center">
            <div className="typewriter">
              <p>All you have to do to login is connect with plug wallet!</p>
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
      <Routes>
        <Route path="/userdashboard" element={<UserDashboard setIsConnected={setIsConnected} createActor={createActor} setIsNewUser={setIsNewUser}/>}></Route>
        <Route path="/policedashboard" element={<PoliceDashboard setIsConnected={setIsConnected} createActor={createActor} setIsNewUser={setIsNewUser}/>}></Route>
      </Routes>
    </div>
  );
};

export default App;
// http://127.0.0.1:4943/?canisterId=r7inp-6aaaa-aaaaa-aaabq-cai

import React, { useEffect } from "react";
import Switch from "react-switch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import * as eccryptoJS from 'eccrypto-js';
var eccrypto = require("eccrypto");
const CryptoJS = require("crypto-js")


const Registeration = ({ actor, principalId , setIsNewUser }) => {
  const [userInfo, setUserInfo] = useState({ name: "", address: "" , role: "user", mobileNum: "" });
  const [policeInfo, setPoliceInfo] = useState({
    name: "",
    designation: "",
    role: "investigator",
    stationCode: "",
    stationAddress: "",
    mobileNum: ""
  });
  const [isUser, setIsUser] = useState(false);
  const [hasRoleChosen, setHasRoleChosen] = useState(false);
  const navigate = useNavigate();
  const secret = "hagnrotu10394dd3";

  const createUser = async () => {
    console.log("Calling add user function");
    const privKey = eccrypto.generatePrivate();
    const principalText = window.ic.plug.sessionManager.sessionData.principalId.toString();
    const encPrivKey = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(privKey.toString("base64")), secret).toString(); // base64, encrypted key
    localStorage.setItem(principalText, encPrivKey);
    const pubKey = eccrypto.getPublic(privKey);
    const createdUserResp = await actor.addUser(userInfo.name, userInfo.role, userInfo.address, pubKey.toString("base64")); // public key
    console.log(createdUserResp);
    setIsNewUser(false)
    navigate("/userdashboard", { state: { principalId , isConnected: true } });
  };
  const createPolice = async () => {
    console.log("Calling add police function");
    const privKey = eccrypto.generatePrivate();
    const principalText = window.ic.plug.sessionManager.sessionData.principalId.toString();
    const encPrivKey = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(privKey.toString("base64")), secret).toString(); // base64, encrypted key
    localStorage.setItem(principalText, encPrivKey);
    const pubKey = eccrypto.getPublic(privKey);
    const createdPoliceResp = await actor.addPolice(
      policeInfo.name,
      policeInfo.designation,
      policeInfo.role,
      pubKey.toString("base64")
    );
    console.log(createdPoliceResp);
    setIsNewUser(false);
    navigate("/policedashboard", { state: { principalId , isConnected: true } });
  };

  return (
    <div className="registration-card center">
      <div className="container">
        <div className="row typewriter">
          <p>Select your role:</p>
        </div>
        <div className="row mt-3">
          <Switch
            className="mr-5 mb-0 col-4"
            name="userType"
            onChange={(ev) => {
              setIsUser(ev);
              setHasRoleChosen(true);
            }}
            checked={isUser}
          />
          <p className="mt-1 col-2">{isUser ? "Complainant" : "Police"}</p>
        </div>
      </div>
      {hasRoleChosen && (
        <>
          {isUser ? (
            <div className="container">
              <div className="row mt-2 justify-content-center">
                <input
                  className="form-control col-6"
                  placeholder="Enter name"
                  type="text"
                  id="userName"
                  name="userName"
                  value={userInfo.name}
                  onChange={(ev) => {
                    setUserInfo({ ...userInfo, ["name"]: ev.target.value });
                  }}
                ></input>
              </div>
              <div className="row mt-2 justify-content-center">
                <input
                  className="form-control col-6"
                  placeholder="Enter address"
                  type="text"
                  id="userName"
                  name="userName"
                  value={userInfo.address}
                  onChange={(ev) => {
                    setUserInfo({ ...userInfo, ["address"]: ev.target.value });
                  }}
                ></input>
              </div>

              <button
                className="mt-4 button-27"
                type="submit"
                onClick={createUser}
              >
                Create User account
              </button>
            </div>
          ) : (
            <div className="container">
              <div className="row mt-2 justify-content-center">
                <input
                  type="text"
                  className="col-6 form-control"
                  id="policeName"
                  placeholder="Enter name"
                  name="policeName"
                  value={policeInfo.name}
                  onChange={(ev) => {
                    setPoliceInfo({ ...policeInfo, ["name"]: ev.target.value });
                  }}
                ></input>
              </div>
              {/* <div className="row mt-2">
                <div className="col-4">
                    <p className="placeholder-text-color">Enter Role</p>
                </div>
                <div className="col-6">
                <input
                  type="radio"
                  className="col-6"
                  name="policeRole"
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setPoliceInfo({ ...policeInfo, ["role"]: "creator" });
                    }
                  }}
                />
                Creator
                <input
                  type="radio"
                  className="col-6"
                  name="policeRole"
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setPoliceInfo({ ...policeInfo, ["role"]: "owner" });
                    }
                  }}
                />
                Owner            
                <input
                  type="radio"
                  name="policeRole"
                  className="col-6"
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setPoliceInfo({ ...policeInfo, ["role"]: "general" });
                    }
                  }}
                />
                General
              </div>
              </div> */}
              <div className="row mt-2 justify-content-center">
                <input
                  type="type"
                  id="designation"
                  className="form-control col-6"
                  placeholder="Enter designation"
                  name="policeDesignation"
                  value={policeInfo.designation}
                  onChange={(ev) => {
                    setPoliceInfo({
                      ...policeInfo,
                      ["designation"]: ev.target.value,
                    });
                  }}
                />
              </div>
              <div className="row mt-2 justify-content-center">
                <input
                  className="form-control col-6"
                  placeholder="Enter station code"
                  type="text"
                  id="stationCode"
                  name="stationCode"
                  value={policeInfo.stationCode}
                  onChange={(ev) => {
                    setPoliceInfo({
                      ...policeInfo,
                      ["stationCode"]: ev.target.value,
                    });
                  }}
                ></input>
              </div>
              <div className="row mt-2 justify-content-center">
                <input
                  className="form-control col-6"
                  placeholder="Enter station address"
                  type="text"
                  id="stationAddress"
                  name="stationAddress"
                  value={policeInfo.stationAddress}
                  onChange={(ev) => {
                    setPoliceInfo({
                      ...policeInfo,
                      ["stationAddress"]: ev.target.value,
                    });
                  }}
                ></input>
              </div>
              <div className="row mt-2 justify-content-center">
                <input
                  className="form-control col-6"
                  placeholder="Enter mobile number"
                  type="text"
                  id="mobileNum"
                  name="mobileNum"
                  value={policeInfo.mobileNum}
                  onChange={(ev) => {
                    setPoliceInfo({
                      ...policeInfo,
                      ["mobileNum"]: ev.target.value,
                    });
                  }}
                ></input>
              </div>

              <button
                className="mt-4 button-27"
                type="submit"
                onClick={createPolice}
              >
                Create Police account
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Registeration;

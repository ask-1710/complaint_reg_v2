import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import Switch from "react-switch";
import { useState } from "react";

const Registeration = ({ actor, principalId }) => {
  const [userInfo, setUserInfo] = useState({ name: "" });
  const [policeInfo, setPoliceInfo] = useState({
    name: "",
    designation: "",
    role: "",
  });
  const [isUser, setIsUser] = useState(false);
  const [hasRoleChosen, setHasRoleChosen] = useState(false);

  useEffect(() => {}, []);

  const createUser = async () => {
    console.log("Calling add user function");
    const createdUserResp = await actor.addUser(userInfo.name, "general");
    console.log(createdUserResp);
  };
  const createPolice = async () => {
    console.log("Calling add police function");
    const createdPoliceResp = await actor.addPolice(
      policeInfo.name,
      policeInfo.designation,
      policeInfo.role
    );
    console.log(createdPoliceResp);
  };

  return (
    <>
      {hasRoleChosen ? (
        <>
          <>
            Select your role:
            <br />
            <Switch
              name="userType"
              onChange={(ev) => {
                setIsUser(ev);
              }}
              checked={isUser}
            />
            {isUser ? "Complainant" : "Police"}
            <br />
            <br />
          </>
          <>
            {isUser ? (
              <>
                <h4>Registeration form for user</h4>
                <p>Enter your name :</p>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={userInfo.name}
                  onChange={(ev) => {
                    setUserInfo({ ...userInfo, ["name"]: ev.target.value });
                  }}
                ></input>
                <p>Hi {" " + userInfo.name + " "} !!</p>
                <button type="submit" onClick={createUser}>
                  Create User account
                </button>
              </>
            ) : (
              <>
                <h4>Registeration form for police</h4>
                <p>Enter your name :</p>
                <input
                  type="text"
                  id="policeName"
                  name="policeName"
                  value={policeInfo.name}
                  onChange={(ev) => {
                    setPoliceInfo({ ...policeInfo, ["name"]: ev.target.value });
                  }}
                ></input>
                <br />
                <input
                  type="radio"
                  name="policeRole"
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setPoliceInfo({ ...policeInfo, ["role"]: "creator" });
                    }
                  }}
                />
                Creator
                <br />
                <input
                  type="radio"
                  name="policeRole"
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setPoliceInfo({ ...policeInfo, ["role"]: "owner" });
                    }
                  }}
                />
                Owner
                <br />
                <input
                  type="radio"
                  name="policeRole"
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setPoliceInfo({ ...policeInfo, ["role"]: "general" });
                    }
                  }}
                />
                General
                <br />
                <input
                  type="type"
                  id="designation"
                  name="policeDesignation"
                  value={policeInfo.designation}
                  onChange={(ev) => {
                    setPoliceInfo({
                      ...policeInfo,
                      ["designation"]: ev.target.value,
                    });
                  }}
                />
                <br />
                <p>Hi {" " + policeInfo.name + " "} !!</p>
                <button type="submit" onClick={createPolice}>
                  Create Police account
                </button>
              </>
            )}
          </>
        </>
      ) : (
        <>
          Select your role:
          <br />
          <Switch
            name="userType"
            onChange={(ev) => {
              setIsUser(ev);
              setHasRoleChosen(true);
            }}
            checked={isUser}
          />
          {isUser ? "Complainant" : "Police"}
          <br />
          <br />
        </>
      )}
    </>
  );
};

export default Registeration;

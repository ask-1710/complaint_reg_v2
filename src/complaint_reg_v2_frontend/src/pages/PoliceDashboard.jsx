import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { complaint_reg_v2_backend_1 } from "../../../declarations/complaint_reg_v2_backend_1";
import { complaint_reg_v2_backend_2 } from "../../../declarations/complaint_reg_v2_backend_2";
import { complaint_reg_v2_backend_3 } from "../../../declarations/complaint_reg_v2_backend_3";
import { complaint_reg_v2_load_balancer } from "../../../declarations/complaint_reg_v2_load_balancer";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend_1";
import Spinner from "react-bootstrap/Spinner";

import { useEffect } from "react";
import { Badge } from "react-bootstrap";
import { create } from "ipfs-http-client";
import * as FileSaver from "file-saver";
var eccrypto = require("eccrypto");
const CryptoJS = require("crypto-js")

const PoliceDashboard = ({
  actor1,
  actor2,
  actor3,
  actors,
  setIsConnected,
  createActor1,
  createActor2,
  createActor3,
  createActorLB,
  setIsNewUser,
  setIsSetupComplete,
}) => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [addedEvidence, setAddedEvidence] = useState(false);
  const [errorWhileAdding, setErrorWhileAdding] = useState(false);
  const [isInvestigator, setIsInvestigator] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isChargesheet, setIsChargesheet] = useState(true);
  const [isComplaintSet, setIsComplaintSet] = useState(false);
  const [userCanister, setUserCanister] = useState();

  const navigate = useNavigate();
  const location = useLocation();
  const possibleStages = {
    firregisteration: { step: 1, badgeText: "FIR registeration" },
    investigation: { step: 2, badgeText: "Investigation on-progress" },
    finalreportfiling: { step: 3, badgeText: "Filing final report" },
    solved: { step: 4, badgeText: "Solved" },
    unsolved: { step: 5, badgeText: "Unsolved" },
  };

  // const principalId = location?.state?.principalId;
  // const isConnected = location?.state?.isConnected;


  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const ipfs = create({
    url: "http://127.0.0.1:5002/",
  });

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, "police");
    setIsConnected(true);
  }, []);

  useEffect(()=>{
    if(!isComplaintSet) getUnassignedComplaints();
  }, [actor1])

  async function getUnassignedComplaints() {
    var complaintsFrom1 = await complaint_reg_v2_backend_1.getUnassignedComplaints();
    var complaintsFrom2 = await complaint_reg_v2_backend_2.getUnassignedComplaints();
    var complaintsFrom3 = await complaint_reg_v2_backend_3.getUnassignedComplaints();
    var complaints = [];
    if(complaintsFrom1 != []) {
      complaints.push(...complaintsFrom1);
    }
    if(complaintsFrom2 != []) {
      complaints.push(...complaintsFrom2)
    }
    if(complaintsFrom3 != []) {
      complaints.push(...complaintsFrom3)
    }
    if(actor1=="") return;
    const principalId = window.ic.plug.sessionManager.sessionData.principalId;    
    const userCanister = await complaint_reg_v2_load_balancer.getCanisterByUserPrincipal(principalId);
    setUserCanister(userCanister);    

    for(const complaint of complaints) {
      complaint[1].isInvestigator = (principalId == complaint[1].investigatorPrincipal);
    }
    // const complaints=[[0, {title: "abc", summary: "sum", date: "12/3/22", location: "delhi"}],
    // [1, {title: "abc", summary: "sum", date: "12/3/22", location: "delhi"}]];
    setComplaints(complaints);
    setIsComplaintSet(true);
  }

  async function updateComplaint(complaintId) {
    const complaintActor = await complaint_reg_v2_load_balancer.getCanisterByComplaintID(complaintId);
    setSelectedComplaint(null);
    
    var result;
    if(complaintActor == 0){ 
      
      result = await actor1.updateComplaintStatus(complaintId, updatedStatus);
    }
    else if(complaintActor == 1) {
      
      result = await actor2.updateComplaintStatus(complaintId, updatedStatus);
    }
    else if(complaintActor == 2) {
      
      result = await actor3.updateComplaintStatus(complaintId, updatedStatus);
    }
    if(result==true) {
      console.log("Updated complaint id "+complaintId+" with status "+updatedStatus);
      getUnassignedComplaints();
    }
  }

  async function uploadEvidences(e) {
    const chosenFiles = Array.prototype.slice.call(e.target.files)  
    setUploadedFiles(chosenFiles);
  }

  async function saveEvidences(complaintId, _ev, document) {
    const file = uploadedFiles[0]; // accepts only one file
    let fr = new FileReader();
    fr.onload = async function(e) {
      const binaryString = e.target.result;
      const parts = binaryString.split(";base64,")[1];

      var key = "";
      for(var i=0;i<16;i++) {
            key += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(parts), key);
      const result = await ipfs.add(encrypted.toString());
      console.log(result.path);
      await encryptAESKeyAndSave(key, complaintId, result.path, document);
   }
    fr.readAsDataURL(file);
  }

  async function saveFIR(complaintId, _ev, document) {
    const file = uploadedFiles[0]; // accepts only one file
    let fr = new FileReader();
    fr.onload = async function(e) {
      const binaryString = e.target.result;
      const parts = binaryString.split(";base64,")[1];

      var key = "";
      for(var i=0;i<16;i++) {
            key += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
            
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(parts), key);
      const result = await ipfs.add(encrypted.toString());
      console.log(result.path);
      await encryptAESKeyAndSave(key, complaintId, result.path, document);
   }
    fr.readAsDataURL(file);
  }

  async function saveChargesheetOrClosureReport(complaintId, _ev, doc) {
    var document = isChargesheet?"chargesheet":"closurereport";
    const file = uploadedFiles[0]; // accepts only one file
    let fr = new FileReader();
    fr.onload = async function(e) {
      const binaryString = e.target.result;
      const parts = binaryString.split(";base64,")[1];

      var key = "";
      for(var i=0;i<16;i++) {
            key += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(parts), key);
      const result = await ipfs.add(encrypted.toString());
      console.log(result.path);
      await encryptAESKeyAndSave(key, complaintId, result.path, document);
   }
    fr.readAsDataURL(file);
  }

  async function encryptAESKeyAndSave(aesKey,complaintId, fileCID, document) {
    const principalId = window.ic.plug.sessionManager.sessionData.principalId;
    let pubKey = "" ;
    let polPubKey = "";
    let actor ;
    console.log(userCanister);
    if(userCanister == 0) {
      actor = actor1;
    }
    else if(userCanister == 1) {
      actor = actor2;
    }
    else if(userCanister == 2){ 
      actor = actor3;
    }    
    pubKey = await actor.getPublicKeyByPrincipal(principalId); // encryption with public key
    polPubKey = Buffer.from(pubKey, "base64");
    console.log(pubKey);
    const aesSymmetricKey = Buffer.from(aesKey, "base64");

    const complaintCanister = await complaint_reg_v2_load_balancer.getCanisterByComplaintID(complaintId);
    if(complaintCanister == 0) {
      
      actor = actor1
    }
    else if(complaintCanister == 1) {
      
      actor = actor2;
    }
    else if(complaintCanister == 2) {

      actor = actor3;
    }
    
    eccrypto.encrypt(polPubKey, aesSymmetricKey).then(async function(encrypted) {
      const encStringified = JSON.stringify(encrypted);
      // store encrypted aes key
      let someRes = await complaint_reg_v2_load_balancer.addFileOwnerAndGetCanisterId(fileCID, principalId, complaintId)
      let result;
      if(document=="FIR") result = await actor.addFIR(complaintId, fileCID, encStringified, "");
      else if(document == "chargesheet") result = await actor.addChargesheet(complaintId, fileCID, encStringified, "");
      else if(document == "closurereport") result = await actor.addClosureReport(complaintId, fileCID, encStringified, "");
      else result = await actor.addEvidence(complaintId, fileCID, encStringified, "");      
      console.log(result);
      setAddedEvidence(result);
      setAddingEvidence(false);
      if(!result) {
        setErrorWhileAdding(true);
      }
    });
    
  }

  // async function checkIfInvestigator(complaint) {
  //   // const complaintCanister = await complaint_reg_v2_load_balancer.getCanisterByComplaintID(compaincomplaintId);
  //   // if(complaintCanister == 0) await createActor1();
  //   // else if(complaintCanister == 1) await createActor2();
  //   // else if(complaintCanister == 2) await createActor3(); 
  //   const principalId = window.ic.plug.sessionManager.sessionData.principalId;
  //   // if(principalId == complaint)
  //   // const isInvestigator = await actor.isInvestigatorForComplaint(complaintId);
  //   // setIsInvestigator(isInvestigator);
  //   // console.log("Is investigator?" + isInvestigator);
  //   return isInvestigator;
  // }

  async function showSave(updated) {
    setShowSaveButton(updated!=originalStatus);
  }

  async function writeToFile(fileName, data) {

    const file = new Blob([data], {type: 'application/json'});

    FileSaver.saveAs(file, fileName);
    
  }

  function stringifyJSON1(obj) {
    console.log(obj);
    if(typeof obj == "bigint") {
      return obj.toString();
    }
    // Base case: handle primitive types
    if (typeof obj !== 'object' || obj === null) {
      return JSON.stringify(obj);
    }
    // arrays
    // const newObj = Array.isArray(obj) ? [] : {};

    const newObj = Array.isArray(obj) ? obj : {};
    
    // Recursive case: handle objects
    const keys = Object.keys(obj);  
    keys.forEach((key) => {
      newObj[key] = stringifyJSON(obj[key]);
    });
    console.log("If json ? ");
    console.log(newObj);
 
    return JSON.stringify(newObj);
  }

  function stringifyJSON(obj) {
    if(typeof obj == "bigint") {
      return obj.toString();
    }
    // Base case: handle primitive types
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
  
    // Recursive case: handle objects and arrays
    const keys = Object.keys(obj);
  
    const newObj = Array.isArray(obj) ? [] : {};
  
    keys.forEach((key) => {
      newObj[key] = stringifyJSON(obj[key]);
    });
  
    return JSON.stringify(newObj);
  }
  

  
  async function backupAllData() {
    const principalId = window.ic.plug.sessionManager.sessionData.principalId;    
    const userDet = await complaint_reg_v2_load_balancer.getUser(principalId);
    if(userDet[1] == "admin") {
      const allData1 = await actor1.queryAllData();
      const allData2 = await actor2.queryAllData();
      const allData3 = await actor3.queryAllData();
      const date1 = new Date().toString() + "-replica-1";
      const date2 = new Date().toString() + "-replica-2";
      const date3 = new Date().toString() + "-replica-3";
      let stringified1 = stringifyJSON(allData1);
      let stringified2 = stringifyJSON(allData2);
      let stringified3 = stringifyJSON(allData3);

      writeToFile(date1, stringified1);
      writeToFile(date2, stringified2);
      writeToFile(date3, stringified3);
    } else {
      alert("Only admins can create backups!");
    }
  }

  return (
    <div className="container">
      <div className="flex d-flex">
        <div className="row">
          <div className="col-8">
          <button className="button-27 my-4" onClick={getUnassignedComplaints}>
            Get New Complaints
          </button>
          </div>
          <div className="col-4">
          <button className="button-27 my-4" onClick={backupAllData}>
            Backup Data
          </button>
          </div>
        </div>
      </div>

      {!isComplaintSet && 
          <div className="center">
            <Spinner animation="border">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>}
      {isComplaintSet && complaints.length == 0 ? (
        <div className="typewriter center">
          <p> No complaints yet ... </p>
        </div>
      ) : (
        isComplaintSet && (<div className="container">
          <div className="list-group">
            {complaints.map((complaint) => {
              return (
                <div key={complaint[0]}>
                  {selectedComplaint == complaint[0] && complaint[1].isInvestigator ? (
                    <div className="list-group-item my-2 list-group-item-action align-items-start" key={complaint[0]}>
                      <div className="flex d-flex flex-column p-2 m-4">
                        <div>
                          Subject:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].title}
                            disabled={true}
                          />
                        </div>
                        <div>
                          Description:{" "}
                          <textarea
                            className="wrap-content form-control"
                            value={complaint[1].summary}
                            disabled
                          ></textarea>
                        </div>
                        <div>
                          Date of occurence:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].date}
                            disabled={true}
                          />
                        </div>
                        <div>
                          Area of occurence:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].location}
                            disabled={true}
                          ></input>
                        </div>
                        <div>
                          Status:{" "}
                          <select
                            type="select"
                            className="form-control"
                            value={updatedStatus}
                            onChange={(ev) => {
                              setUpdatedStatus(ev.target.value);
                              showSave(ev.target.value);
                            }}
                          >
                          <option value={Object.keys(possibleStages)[0]}>
                            FIR registration ongoing
                          </option>
                          {
                            complaint[1].FIR!="NONE" && (
                              <>
                              <option value={Object.keys(possibleStages)[1]}>
                                Investigation ongoing
                              </option>
                              <option value={Object.keys(possibleStages)[2]}>
                                Final Report filing
                              </option>
                              {
                                (complaint[1].chargesheet!='NONE' || complaint[1].closureReport!='NONE') && (
                                  <>
                                    <option value={Object.keys(possibleStages)[3]}>Verdict passed</option>
                                    <option value={Object.keys(possibleStages)[4]}>Case abandoned</option>
                                  </>
                                )
                              }
                            </>
                            )
                          }
                          </select>
                        </div>
                        <div>
                          <div className="flex d-flex flex-row p-2 m-5">
                            <div className="m-6 p-6">
                              <button
                                className="button-27"
                                onClick={(ev) => {
                                  setSelectedComplaint(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                            {showSaveButton && <div className="m-6 p-6">
                              <button
                                className="button-27"
                                onClick={(ev) => {
                                  updateComplaint(complaint[0]);
                                }}
                              >
                                Submit
                              </button>
                            </div>
                            }
                          </div>
                        </div>
                      

                      <div>
                        {
                          addedEvidence && <p className="success-message">File saved</p>
                        }                        
                        {
                          errorWhileAdding && <p className="error-message">You do not have the permissions to add a case document for this complaint!<br/> Please contact admin to assign this complaint to you</p>
                        }
                        {
                          originalStatus == Object.keys(possibleStages)[1] && (
                            addingEvidence?(
                              <>
                              <p className="flex-box label-text">Only pdf accepted</p>
                              <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf , image/png, image/jpg, image/jpeg"></input>
                              {uploadedFiles.map(file=>{return <Badge text="dark" bg="warning">{file.name}</Badge>})}
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveEvidences(complaint[0], ev, "evidence")}}>Save</button>
                              <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);setErrorWhileAdding(false);setAddedEvidence(false);}}>Cancel</button>
                              </>
                            ):(
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);setAddedEvidence(false);setErrorWhileAdding(false);}}>Add evidence</button>
                            )
                          )
                        }
                        {
                          originalStatus == Object.keys(possibleStages)[0] && (
                            addingEvidence?(
                              <>
                              <p className="flex-box label-text">Only pdf accepted</p>
                              <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf"></input>
                              {uploadedFiles.map(file=>{return <Badge  text="dark" bg="warning">{file.name}</Badge>})}
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveFIR(complaint[0], ev, "FIR")}}>Save</button>
                              <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);setErrorWhileAdding(false);setAddedEvidence(false);}}>Cancel</button>
                              </>
                            ):(
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);setAddedEvidence(false);setErrorWhileAdding(false);}}>Register FIR</button>
                            )
                          ) 
                        }
                        {
                          originalStatus == Object.keys(possibleStages)[2] && (
                            addingEvidence?(
                              <>
                                <input
                                  className="mx-2"
                                  type="checkbox"
                                  name="isChargesheet"
                                  checked={isChargesheet}
                                  onChange={()=>{setIsChargesheet(!isChargesheet)}}
                                />
                                You are uploading the {isChargesheet? "chargesheet":"closure report"}<br/>
                                <p className="flex-box label-text">Only pdf accepted</p>
                                <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf"></input>
                                {uploadedFiles.map(file=>{return <Badge  text="dark" bg="warning">{file.name}</Badge>})}
                                <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveChargesheetOrClosureReport(complaint[0], ev, "")}}>Save</button>
                                <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);setErrorWhileAdding(false);setAddedEvidence(false);}}>Cancel</button>
                              </>
                            ):(
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);setAddedEvidence(false);setErrorWhileAdding(false);}}>Upload Document</button>
                            )
                          )
                        }
                      </div>
                      </div>
                    </div>                    
                  ) : (
                    <div className="list-group-item my-2 list-group-item-action align-items-start" key={complaint[0]} data-toggle="list">
                      <div
                        key={complaint[0]}
                        onClick={(ev) => {
                          setSelectedComplaint(complaint[0]);
                          setUpdatedStatus(Object.keys(complaint[1].status)[0]);
                          setOriginalStatus(Object.keys(complaint[1].status)[0])
                        }}
                      > 
                        {
                          complaint[1].isInvestigator && <Badge className="float-right" bg="warning" text="dark">CASE HANDLED BY YOU</Badge>
                        }
                        <ul className="complaint-list">
                          <li>
                            <b>Subject</b>
                            {" : " + complaint[1].title}
                          </li>
                          <li>
                            <b>Description of incident</b>
                            {" : " + complaint[1].summary}
                          </li>
                          <li>
                            <b>Date of occurence</b>
                            {" : " + complaint[1].date}
                          </li>
                          <li>
                            <b>Area of occurence</b>
                            {" : " + complaint[1].location}
                          </li>{" "}
                          <li>
                            {possibleStages[Object.keys(complaint[1].status)[0]]
                              .step < 2 ? (
                              <Badge bg="warning" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            ) : possibleStages[
                                Object.keys(complaint[1].status)[0]
                              ].step < 4 ? (
                              <Badge bg="info" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            ) : possibleStages[
                                Object.keys(complaint[1].status)[0]
                              ].badgeText == "Solved" ? (
                              <Badge bg="success" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            ) : (
                              <Badge bg="danger" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            )}
                          </li>
                        </ul>                        
                      </div>
                      <button className="button-27 small-button" onClick={()=>{navigate(`/complaintview/${complaint[0]}`, {state: {userType: "police"}})}}>View details</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>)
      )}
    </div>
  );
};

export default PoliceDashboard;
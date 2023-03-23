import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { complaint_reg_v2_backend } from "../../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend";
import { useEffect } from "react";
import { Badge } from "react-bootstrap";
import { create } from "ipfs-http-client";
var eccrypto = require("eccrypto");
const CryptoJS = require("crypto-js")

const PoliceDashboard = ({
  actor,
  setIsConnected,
  createActor,
  setIsNewUser,
  setIsSetupComplete,
}) => {
  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
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

  const navigate = useNavigate();
  const location = useLocation();
  const possibleStages = {
    firregisteration: { step: 1, badgeText: "FIR registeration" },
    investigation: { step: 2, badgeText: "Investigation on-progress" },
    finalreportfiling: { step: 3, badgeText: "Filing final report" },
    solved: { step: 4, badgeText: "Solved" },
    unsolved: { step: 5, badgeText: "Unsolved" },
  };

  const principalId = location?.state?.principalId;
  const isConnected = location?.state?.isConnected;

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const ipfs = create({
    url: "http://127.0.0.1:5002/",
  });

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, "police");
    setIsConnected(true);

    if (actor == "") createActor();
  }, []);

  useEffect(() => {
    if (actor != "") getUnassignedComplaints();
  }, [actor]);

  useEffect(()=>{
    checkIfInvestigator();
  },[selectedComplaint]);

  async function getUnassignedComplaints() {
    var complaints = await complaint_reg_v2_backend.getUnassignedComplaints();
    console.log(complaints);
    // const complaints=[[0, {title: "abc", summary: "sum", date: "12/3/22", location: "delhi"}],
    // [1, {title: "abc", summary: "sum", date: "12/3/22", location: "delhi"}]];
    setComplaints(complaints);
  }

  async function updateComplaint(complaintId) {
    setSelectedComplaint(null);
    console.log("Updating complaint id "+complaintId+" with status "+updatedStatus);
    var result = await actor.updateComplaintStatus(complaintId, updatedStatus);
    if(result==true) {
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
    const pubKey = await complaint_reg_v2_backend.getPublicKeyByPrincipal(principalId); // encryption with public key
    const polPubKey = Buffer.from(pubKey, "base64");
    const aesSymmetricKey = Buffer.from(aesKey, "base64");
    eccrypto.encrypt(polPubKey, aesSymmetricKey).then(async function(encrypted) {
      const encStringified = JSON.stringify(encrypted);
      // store encrypted aes key
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

  async function checkIfInvestigator() {
    console.log("Selected complaint "+selectedComplaint);
    if(selectedComplaint!="" && selectedComplaint!=null) {
      const isInvestigator = await actor.isInvestigatorForComplaint(selectedComplaint);
      setIsInvestigator(isInvestigator);
    }
  }

  async function showSave(updated) {
    setShowSaveButton(updated!=originalStatus);
  }

  return (
    <div className="container">
      <button className="button-27 my-4" onClick={getUnassignedComplaints}>
        Get New Complaints
      </button>
      {complaints.length == 0 ? (
        <div className="typewriter center">
          <p> No complaints yet ... </p>
        </div>
      ) : (
        <div className="container">
          <div className="list-group">
            {complaints.map((complaint) => {
              return (
                <div key={complaint[0]}>
                  {selectedComplaint == complaint[0] && isInvestigator ? (
                    <div className="list-group-item my-2 list-group-item-action align-items-start" key={complaint[0]}>
                      <div className="flex d-flex flex-column p-2 m-4">
                        <div>
                          Short description:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].title}
                            disabled={true}
                          />
                        </div>
                        <div>
                          Summary:{" "}
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
                          Location of occurence:{" "}
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
                      </div>{" "}

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
                        <ul className="complaint-list">
                          <li>
                            <b>Short description</b>
                            {" : " + complaint[1].title}
                          </li>
                          <li>
                            <b>Summary of incident</b>
                            {" : " + complaint[1].summary}
                          </li>
                          <li>
                            <b>Date of occurence</b>
                            {" : " + complaint[1].date}
                          </li>
                          <li>
                            <b>Location of occurence</b>
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
        </div>
      )}
    </div>
  );
};

export default PoliceDashboard;
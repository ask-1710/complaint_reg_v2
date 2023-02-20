import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { complaint_reg_v2_backend } from "../../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend";
import { useEffect } from "react";
import { Badge } from "react-bootstrap";
import { create } from "ipfs-http-client";

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
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([])

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

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, "police");
    setIsConnected(true);

    if (actor == "") createActor();
  }, []);

  useEffect(() => {
    if (actor != "") getUnassignedComplaints();
  }, [actor]);

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
  }

  async function uploadEvidences(e) {
    const chosenFiles = Array.prototype.slice.call(e.target.files)  
    console.log(chosenFiles);
    setUploadedFiles(chosenFiles);
  }

  async function saveEvidences(ev) {
    const ipfs = await create({
      url: "http://127.0.0.1:5002/",
    });
    
    const file = uploadedFiles[0];
    const result = await ipfs.add(file);
    console.log(result)
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
                <>
                  {selectedComplaint == complaint[0] ? (
                    <div className="list-group-item my-2 list-group-item-action align-items-start">
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
                            }}
                          >
                            <option value="firregisteration">
                              FIR ongoing
                            </option>
                            <option value="investigation">
                              Investigation ongoing
                            </option>
                            <option value="finalreportfiling">
                              Final Report filing
                            </option>
                            <option value="solved">Verdict passed</option>
                            <option value="unsolved">Case abandoned</option>
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
                            <div className="m-6 p-6">
                              <button
                                className="button-27"
                                onClick={(ev) => {
                                  updateComplaint(complaint[0]);
                                }}
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>{" "}
                    </div>
                  ) : (
                    <div className="list-group-item my-2 list-group-item-action align-items-start" data-toggle="list">
                      <div
                        key={complaint[0]}
                        onClick={(ev) => {
                          setSelectedComplaint(complaint[0]);
                          setUpdatedStatus(Object.keys(complaint[1].status)[0]);
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
                      <div>
                        {
                          addingEvidence?(
                            <>
                            <p className="flex-box label-text">Upload one or more files</p>
                            <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf , image/png, image/jpg, image/jpeg"></input>
                            {uploadedFiles.map(file=>{return <Badge text="dark" bg="warning">{file.name}</Badge>})}
                            <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveEvidences(ev)}}>Save</button>
                            <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);}}>Cancel</button>
                            </>
                          ):(
                            <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);}}>Add evidence</button>
                          )
                        }
                      </div>
                    </div>
                  )}
                </>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliceDashboard;

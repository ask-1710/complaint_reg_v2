import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { complaint_reg_v2_backend } from "../../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend";
import { useEffect } from "react";
import { Badge } from "react-bootstrap";

const PoliceDashboard = ({
  actor,
  setIsConnected,
  createActor,
  setIsNewUser,
  setIsSetupComplete,
}) => {
  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
  const [complaints, setComplaints] = useState([]);
  const [complaintId, setComplaintId] = useState(0);
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

  function updateComplaint(complaintId) {
    console.log(complaintId);
    setComplaintId(complaintId);
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
                <button
                  key={complaint[0]}
                  onDoubleClick={() => {
                    updateComplaint(complaint[0]);
                  }}
                  href="#"
                  className="list-group-item my-2 list-group-item-action align-items-start"
                  data-toggle="list"
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
                            possibleStages[Object.keys(complaint[1].status)[0]]
                              .badgeText
                          }
                        </Badge>
                      ) : possibleStages[Object.keys(complaint[1].status)[0]]
                          .step < 4 ? (
                        <Badge bg="info" text="dark">
                          {
                            possibleStages[Object.keys(complaint[1].status)[0]]
                              .badgeText
                          }
                        </Badge>
                      ) : possibleStages[Object.keys(complaint[1].status)[0]]
                          .badgeText == "Solved" ? (
                        <Badge bg="success" text="dark">
                          {
                            possibleStages[Object.keys(complaint[1].status)[0]]
                              .badgeText
                          }
                        </Badge>
                      ) : (
                        <Badge bg="danger" text="dark">
                          {
                            possibleStages[Object.keys(complaint[1].status)[0]]
                              .badgeText
                          }
                        </Badge>
                      )}
                    </li>
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliceDashboard;

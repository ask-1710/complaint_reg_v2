import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { complaint_reg_v2_backend } from "../../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend";
import { useEffect } from "react";

const PoliceDashboard = ({actor , setIsConnected, createActor, setIsNewUser, setIsSetupComplete}) => {
  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
  const [complaints, setComplaints] = useState([]);
  const [complaintId, setComplaintId] = useState(0);
  const location = useLocation();

  const principalId = location?.state?.principalId;
  const isConnected = location?.state?.isConnected;

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false,"police");
    setIsConnected(true);
    
    if (actor == "") createActor();
  },[]);

  useEffect(()=>{
    if(actor!="") getUnassignedComplaints();
  },[actor])
  
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
                  <ol>
                    <li>{complaint[1].title}</li>
                    <li>{complaint[1].summary}</li>
                    <li>{complaint[1].date}</li>
                    <li>{complaint[1].location}</li>
                    <li>{complaint[1].status}</li>
                  </ol>
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

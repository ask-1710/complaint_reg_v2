import React, { useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import ComplaintForm from "../components/complaintForm";
import { complaint_reg_v2_load_balancer } from "../../../declarations/complaint_reg_v2_load_balancer";

const UserDashboard = ({
  actors,
  setIsConnected,
  createActor1,
  actor1,
  actor2, 
  actor3,
  createActor2,
  createActor3,
  setIsNewUser,
  setIsSetupComplete,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    address: "",
    complaints: [],
  });
  const [complaints, setComplaints] = useState([]);
  const [isUserSet, setIsUserSet] = useState(false);
  const possibleStages = {
    firregisteration: { step: 1, badgeText: "FIR registeration" },
    investigation: { step: 2, badgeText: "Investigation on-progress" },
    finalreportfiling: { step: 3, badgeText: "Filing final report" },
    solved: { step: 4, badgeText: "Solved" },
    unsolved: { step: 5, badgeText: "Unsolved" },
  };

  // const location = useLocation();
  // const { principalId } = location?.state || {};
  // const { isConnected } = location?.state || {};

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, "user");
    setIsConnected(true);
  }, []);

  useEffect(() => {
    if (!isUserSet) getUserDetails();
  }, [actor1, actor2, actor3]);

  async function getUserDetails() {
    // console.log("user is :"+principalId+":getUserDetails");
    const principalId = window.ic.plug.sessionManager.sessionData.principalId;
    if(principalId == "") return;
    const mappedCanister = await complaint_reg_v2_load_balancer.getCanisterByUserPrincipal(principalId);
    console.log("mapped canister: " + mappedCanister);
    let user 
    let userComplaints
    if(mappedCanister == 0) {
      user = await actor1.getUserDetails();
      userComplaints = await actor1.getUserComplaints();  
    }
    else if(mappedCanister == 1) {
      console.log(actor2);
      user = await actor2.getUserDetails();
      userComplaints = await actor2.getUserComplaints();
    }
    else if(mappedCanister == 2){
      user = await actor3.getUserDetails();
      userComplaints = await actor3.getUserComplaints();
    }
    
    // const user = {
    //   principal: "ihdq3043c109j4",
    //   name: "rt",
    //   address: "chennai",
    //   complaintIds: [0, 1],
    // };
    // const userComplaints = [
    //   [0, { title: "abc", summary: "sum", date: "12/3/22", location: "delhi" ,  status:{firregisteration : null} }],
    //   [1, { title: "abc", summary: "sum", date: "12/3/22", location: "delhi" ,  status:{finalreportfiling : null} }],
    //   [2, { title: "abc", summary: "sum", date: "12/3/22", location: "delhi" ,  status:{solved : null} }],
    //   [3, { title: "abc", summary: "sum", date: "12/3/22", location: "delhi" ,  status:{unsolved : null} }],
    //   [4, { title: "abc", summary: "sum", date: "12/3/22", location: "delhi" ,  status:{finalreportfiling : null} }],
    // ];

    setUser(user[1]);
    setComplaints(userComplaints);
    setIsUserSet(true);
  }

  const handleClickScrollToComplaintForm = () => {
    const anchor = document.querySelector("#anchor");
    anchor.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleClickScrollToTop = () => {
    const anchor = document.querySelector("#top");
    anchor.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="container">
      <div className="container">
        <div className="jumbotron d-flex justify-content-around" id="top">
          <div className="pt-4 display-2">My Dashboard</div>
          <div className="pt-5 mr-2">
            {isUserSet && (
              <button
                className="btn active"
                type="button"
                onClick={handleClickScrollToComplaintForm}
              >
                New complaint
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="container">
        {isUserSet ? (
          <div>
            {complaints.length > 0 && (
              <div className="jumbotron">
                <div className="pt-4 display-6">Track your complaints</div>
                <hr className="my-4"></hr>
                <div className="new-section-container container">
                  <div className="list-group">
                    {complaints.map((complaint) => {
                      return (
                        <div
                          key={complaint[0]}
                          className="list-group-item my-2 list-group-item-action align-items-start"
                          data-toggle="list"
                        >
                          <ul className="complaint-list">
                            <li><b>Subject</b>{' : ' + complaint[1].title}</li>
                            <li><b>Description</b>{' : ' + complaint[1].summary}</li>
                            <li><b>Date of occurence</b>{' : ' + complaint[1].date}</li>
                            <li><b>Area of occurence</b>{' : ' + complaint[1].location}</li>
                            <li>
                              {possibleStages[
                                Object.keys(complaint[1].status)[0]
                              ].step < 2 ? (
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
                          <button className="button-27 small-button" onClick={()=>{navigate(`/complaintview/${complaint[0]}`, {state: {userType: "complainant"}})}}>View details</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div id="anchor" className="new-section-container">
              <div className="new-section-center">
                <div className="mb-5">
                  <ComplaintForm actors={actors} actor1={actor1} actor2={actor2} actor3={actor3} createActor1={createActor1} createActor2={createActor2} createActor3={createActor3} />
                </div>
                <div className="mt-4 d-flex flex-row-reverse">
                  <button
                    className="btn active"
                    type="button"
                    onClick={handleClickScrollToTop}
                  >
                    Back to top
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="center">
            <Spinner animation="border">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

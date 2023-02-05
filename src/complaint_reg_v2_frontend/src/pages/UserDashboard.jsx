import React, { useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Badge } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend";
import { Card } from "../../../../node_modules/react-bootstrap/esm/index";
import CardHeader from "../../../../node_modules/react-bootstrap/esm/CardHeader";
import ComplaintForm from "../components/complaintForm";

const UserDashboard = ({
  actor,
  setIsConnected,
  createActor,
  setIsNewUser,
  setIsSetupComplete,
}) => {
  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
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

  const location = useLocation();
  const { principalId } = location?.state || {};
  const { isConnected } = location?.state || {};

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, "user");
    setIsConnected(true);
    if (actor == "") createActor();
  }, []);

  useEffect(() => {
    if (!isUserSet && actor != "") getUserDetails();
  }, [actor]);

  async function getUserDetails() {
    // console.log("user is :"+principalId+":getUserDetails");
    const user = await actor.getUserDetails();
    const userComplaints = await actor.getUserComplaints();

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
                        <button
                          key={complaint[0]}
                          href="#"
                          className="list-group-item my-2 list-group-item-action align-items-start"
                          data-toggle="list"
                        >
                          <ul>
                            <li>{complaint[1].title}</li>
                            <li>{complaint[1].summary}</li>
                            <li>{complaint[1].date}</li>
                            <li>{complaint[1].location}</li>
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
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div id="anchor" className="new-section-container">
              <div className="new-section-center">
                <div className="mb-5">
                  <ComplaintForm actor={actor} createActor={createActor} />
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

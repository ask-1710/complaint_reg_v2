import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import FileFrame from "../components/fileFrame";
import { Link } from "react-router-dom";
import { complaint_reg_v2_load_balancer } from "../../../declarations/complaint_reg_v2_load_balancer";

const ComplaintView = ({
  createActor1,
  createActor2,
  createActor3,
  actor,
  actors,
  setIsSetupComplete,
  setIsConnected,
  setIsNewUser,
}) => {
  //   const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  const [complaintInfo, setComplaintInfo] = useState(null);
  const [registeredDaysBefore, setRegisteredDaysBefore] = useState(null);
  const [hasLoadedInfo, setHasLoadedInfo] = useState(false);
  const [principal, setPrincipal] = useState("")
  const { complaintId } = useParams();
  const location = useLocation();
  const userType = location?.state?.userType;
  const pathname = location.pathname;
  const possibleStages = {
    firregisteration: { step: 1, badgeText: "Complaint registered, FIR registration on going" },
    investigation: { step: 2, badgeText: "FIR registered, Investigation in progress" },
    finalreportfiling: { step: 3, badgeText: "Evidences collected, filing final report" },
    solved: { step: 4, badgeText: "Case solved" },
    unsolved: { step: 5, badgeText: "Case abandoned unsolved" },
  };


  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, userType);
    setIsConnected(true);
    if(actor == "") createActor();
    if(!hasLoadedInfo) getDetailedComplaintInfo(); 
  }, []);

  const getDetailedComplaintInfo = async () => {
    console.log("Inside getDetailedComplaintInfo");
    if(actor == "")  await createActor();
    const principal = window.ic.plug.sessionManager.sessionData.principalId.toString();
    setPrincipal(principal);
    var complaintInfo = await actor.getDetailedComplaintInfoByComplaintId(parseInt(complaintId));
    setComplaintInfo(complaintInfo);
    var toDate = new Date(complaintInfo.date);
    var today = new Date();
    var differenceInDays = Math.ceil((today.getTime() - toDate.getTime())/ (1000 * 60 * 60 * 24));
    console.log(differenceInDays);
    setRegisteredDaysBefore(differenceInDays.toString());
    setIsLoading(false);
    setHasLoadedInfo(true);
    console.log(complaintInfo);
  };

  const createActor = async () => {
    const mappedCanister = await complaint_reg_v2_load_balancer.getCanisterByComplaintID(parseInt(complaintId));
    
    if(mappedCanister == 0) await createActor1();
    else if(mappedCanister == 1) await createActor2();
    else if(mappedCanister == 2) await createActor3();
  }

  function getFIRDate() {
    var lastDate;
    if(complaintInfo.chargesheet != "NONE") {
      lastDate = new Date().setDate(new Date(Number(complaintInfo.updatedOn)/1000000).getDate() - 1);
      
      console.log(new Date(lastDate));      
    } else {
      lastDate = new Date().setDate(new Date(Number(complaintInfo.updatedOn)/1000000).getDate() - 2);
      console.log(new Date(lastDate));      
    }
    return new Date(lastDate).toString();
  }

  function getChargesheetFiledDate() {
    var lastDate;
    
      lastDate = new Date().setDate(new Date(Number(complaintInfo.updatedOn)/1000000).getDate());
      
      console.log(new Date(lastDate));      
    
    return new Date(lastDate).toString();
  }

  return (
    <div className="container">
      {pathname.match(/^\/complaintview\/[^\/]*$/gim) && (
        <div>
          {isLoading ? (
            <div className="center">
              <Spinner animation="border">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
            <div className="jumbotron d-flex justify-content-around" id="top">
              <h1 className="pt-4 display-4">Detailed complaint information</h1>
            </div>
              <hr className="my-4"/>
              <div className="p-1 m-1">
              <div className="file-link">
              <h2><strong>Subject: </strong>{complaintInfo.title}</h2>
              <p><strong>Complaint Number :</strong> {complaintId}</p>
              <p><strong>Complainant Name:</strong> {complaintInfo.complainantName}</p>
              <p><strong>Complainant Address:</strong> {complaintInfo.complainantAddress}</p>
              <p><strong>Area of occurence:</strong> {complaintInfo.location}</p>
              <p><strong>Date of Occurence:</strong> {complaintInfo.date}</p>
              <p><strong>Elaborated description</strong><br/>{complaintInfo.summary}</p>
              <p><strong>Last updated on: </strong>{new Date(Number(complaintInfo.updatedOn)/1000000).toString()}</p>
              {
                complaintInfo.investigatorPrincipal!=complaintInfo.complainantPrincipal ? (
                  <>
                    <p><strong>Complaint assigned and investigation started</strong></p>
                    <p><strong>Police Station:</strong> E5 - Police Station in R.A. Puram, Chennai-600028 </p><br/>
                    <p className="my-2"><strong>Status : </strong>{ possibleStages[Object.keys(complaintInfo.status)[0]].badgeText }</p><br />
                    <p><strong>All related case documents </strong></p>
                      <p><strong>Evidences </strong></p>
                      {
                          complaintInfo.evidence.length>1 && (
                            complaintInfo.evidence.map(evidence => {
                              return (
                                <div className="file-link">
                                  {evidence!="" && <Link to={`${evidence}`} state={{userType: userType}}>Evidence-{evidence.substr(1,5)}</Link>}
                                </div>
                              )
                            })
                          )
                      }
                      <br />
                      {
                        complaintInfo.FIR!='NONE' && ( 
                          <Link to={`${complaintInfo.FIR}`} state={{userType: userType}}>FIR filed on {getFIRDate()}</Link>
                          )
                      }<br/>
                      {
                        complaintInfo.chargesheet!="NONE" && (
                          <Link to={`${complaintInfo.chargesheet}`} state={{userType: userType}}>Chargesheet {' '} filed on {getChargesheetFiledDate()}</Link>
                        )              
                      }
                      <br />
                      {
                        complaintInfo.closureReport != "NONE" && (
                          <Link to={`${complaintInfo.closureReport}`} state={{userType: userType}}>Closure Report</Link>
                        )
                      }
                  
                  </>
                ) : (
                <>
                  <p className="my-2"><strong>Status : </strong>Complaint registered, No investigator assigned this complaint</p><br />
                </>
                )
              }  </div>
              </div>
            </>
          )}
        </div>
      )}

      <Routes>
        <Route path={`:cid`} element={<FileFrame createActor1={createActor1} createActor2={createActor2} createActor3={createActor3} actor={actor} actors={actors}/>} />
      </Routes>
    </div>
  );

};

export default ComplaintView;
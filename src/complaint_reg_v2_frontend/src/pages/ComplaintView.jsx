import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import FileFrame from "../components/fileFrame";
import { Link } from "react-router-dom";

const ComplaintView = ({
  createActor,
  actor,
  setIsSetupComplete,
  setIsConnected,
  setIsNewUser,
}) => {
  //   const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  const [complaintInfo, setComplaintInfo] = useState(null);
  const { complaintId } = useParams();
  const location = useLocation();
  const userType = location?.state?.userType;
  const pathname = location.pathname;
  const possibleStages = {
    firregisteration: { step: 1, badgeText: "FIR registeration" },
    investigation: { step: 2, badgeText: "Investigation on-progress" },
    finalreportfiling: { step: 3, badgeText: "Filing final report" },
    solved: { step: 4, badgeText: "Solved" },
    unsolved: { step: 5, badgeText: "Unsolved" },
  };


  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, userType);
    setIsConnected(true);
    if (actor == "") createActor();
  }, []);

  useEffect(() => {
    if (actor != "") getDetailedComplaintInfo();
  }, [actor]);

  const getDetailedComplaintInfo = async () => {
    console.log("Inside getDetailedComplaintInfo");
    var complaintInfo = await actor.getDetailedComplaintInfoByComplaintId(parseInt(complaintId));
    setComplaintInfo(complaintInfo);
    setIsLoading(false);
    console.log(complaintInfo);
  };

  return (
    <div className="container">
      {pathname.match(/^\/complaintview\/[^\/]*$/gim) && (
        <>
          {isLoading ? (
            <div className="center">
              <Spinner animation="border">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
            <div className="jumbotron d-flex justify-content-around" id="top">
              <h1 className="pt-4 display-4">{complaintInfo.title}</h1><br/>
            </div>
              <hr className="my-4"/>
              <p className="lead">{complaintInfo.summary}</p><br/>
              <p>Incharge Details</p><br/>
              <p>Investigator: {complaintInfo.currentInchargeName}</p><br/>
              <p className="ml-4">{complaintInfo.currentInchargeDesig}</p><br/>
              <p>Police Station: {' '}{complaintInfo.assignedStation}</p><br/>
              <p>Status : { possibleStages[Object.keys(complaintInfo.status)[0]].badgeText }</p><br />
              <p><strong>Case documents :</strong></p><br/>
              <p>Evidences </p>
              {
                  complaintInfo.evidence.length>1 && (
                    complaintInfo.evidence.map(evidence => {
                      return (<>
                        <Link to={`${evidence}`} state={{userType: userType}}>{evidence}</Link><br/>
                        </>
                      )
                    })
                  )
              }
              <br />
              {
                complaintInfo.FIR!='NONE' && ( 
                  <Link to={`${complaintInfo.FIR}`} state={{userType: userType}}>FIR</Link>
                  )
              }<br/>
              {
                complaintInfo.chargesheet!="NONE" && (
                  <Link to={`${complaintInfo.chargesheet}`} state={{userType: userType}}>Chargesheet</Link>
                )              
              }
              <br />
              {
                complaintInfo.closureReport != "NONE" && (
                  <Link to={`${complaintInfo.closureReport}`} state={{userType: userType}}>Closure Report</Link>
                )
              }
              <br />
            </>
          )}
        </>
      )}

      <Routes>
        <Route path={`:cid`} element={<FileFrame createActor={createActor} actor={actor}/>} />
      </Routes>
    </div>
  );
};

export default ComplaintView;

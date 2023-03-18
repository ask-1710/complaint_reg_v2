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
              <div className="card bg-dark text-white file-link">
              <h2>{complaintInfo.title}</h2>
              <p>{complaintInfo.summary}</p>
              {
                complaintInfo.currentInchargeName != "no-police" ? (
                  <>
                    <p><strong>Incharge Details</strong></p>
                    <p><strong>Investigator: </strong>{complaintInfo.currentInchargeName +" , " +complaintInfo.currentInchargeDesig}</p>
                    <p><strong>Police Station:</strong> E5 - Police Station in R.A. Puram, Chennai-600028 </p><br/>
                  </>
                ) : <>No investigator assigned yet</>
              }
              <p><strong>Status : </strong>{ possibleStages[Object.keys(complaintInfo.status)[0]].badgeText }</p><br />
              <p><strong>All related case documents </strong></p>
                <p><strong>Evidences </strong></p>
                {
                    complaintInfo.evidence.length>1 && (
                      complaintInfo.evidence.map(evidence => {
                        return (
                          <div className="file-link">
                            {evidence!="" && <Link to={`${evidence}`} state={{userType: userType}}>{evidence}</Link>}
                          </div>
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
              </div>
              </div>
            </>
          )}
        </div>
      )}

      <Routes>
        <Route path={`:cid`} element={<FileFrame createActor={createActor} actor={actor}/>} />
      </Routes>
    </div>
  );
};

export default ComplaintView;
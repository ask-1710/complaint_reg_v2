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
              <p>Evidences <br/>
              {
                  complaintInfo.evidence.length>1 && (
                    complaintInfo.evidence.map(evidence => {
                      return (<>
                        <Link to={`${evidence}`} state={{userType: userType}}>{evidence}</Link><br/>
                        </>
                      )
                    })
                  )
                } </p>
              <br />
              status not editable
              <br />
              Past inspectors who handled the case
              <br />
              if fir done , link to fir document
              <br />
              if chargesheet files, link to doc
              <br />
              if final report files, link to doc
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

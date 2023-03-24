import DatePicker from "react-date-picker";
import React, { useState } from "react";
import { Card } from "../../../../node_modules/react-bootstrap/esm/index";

const ComplaintForm = ({createActor, actor}) => {
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    summary: "",
    location: "",
    date: new Date(),
  });
  const [complaintCreated, setComplaintCreated] = useState(null);
  const [errorWhileComplaint, setErrorWhileComplaint] = useState(false);
  const subjects = ["person missing", "damaging property", "cell phone missing/theft", "cheating/embezzlement/land grabbing","document missing","murder","kidnapping","public nuisance","offence related to marriage", "eve teasing","rape"];


  async function submitComplaint() {
    console.log(actor);
    console.log(newComplaint);
    const isCreated = await actor.addComplaint(newComplaint.title, newComplaint.summary, newComplaint.location, newComplaint.date.toString());
    if(isCreated) {
        console.log("Complaint Created");
        setComplaintCreated(true);
    } else {
        setComplaintCreated(false);
        console.log("Error while creating complaint");
        setErrorWhileComplaint(true);
    }
    setNewComplaint("", "", "", newComplaint.date);

  }

  return (
    <div className="container">
      <div className="mx-auto">
        {complaintCreated && <p className="success-message">Complaint registered</p>}
        {errorWhileComplaint && <p className="error-message">Complaint registeration failed</p>}
        <Card className="bg-light w-75 mx-auto">
            <div className="row my-2 mx-5">
              <h5>Fill in the details</h5>
            </div>
          <Card.Body>
            <div className="row mt-2 justify-content-center">
              <select 
                className="form-control col-6"
                value={newComplaint.title}
                onChange={(e) => {
                  setNewComplaint({
                    ...newComplaint,
                    ["title"]: e.target.value,
                  });
                }}
                >
                  <option value="">Select the subject</option>
                  {
                    subjects.map((subject) => {
                      return (
                        <option value={subject}>{subject}</option>
                      );
                    })
                  }
              </select>
              {/* <input
                type="text"
                className="form-control col-6"
                placeholder="Select subject"
                value={newComplaint.title}
                onChange={(e) => {
                  setNewComplaint({
                    ...newComplaint,
                    ["title"]: e.target.value,
                  });
                }}
              ></input> */}
            </div>

            <div className="row mt-2 justify-content-center">
              <textarea
                className="col-6 wrap-content form-control"
                placeholder="Enter complaint description"
                wrap="soft"
                value={newComplaint.summary}
                onChange={(e) => {
                  setNewComplaint({
                    ...newComplaint,
                    ["summary"]: e.target.value,
                  });
                }}
              ></textarea>
            </div>
            <div className="row mt-2 justify-content-center">
                <input
                  type="text"
                  className="form-control col-3"
                  placeholder="Enter place of occurence"
                  value={newComplaint.location}
                  onChange={(e) => {
                    setNewComplaint({
                      ...newComplaint,
                      ["location"]: e.target.value,
                    });
                  }}
                ></input>
              </div>
            <div className="row mt-2 justify-content-space-between">
              <div className="col">
                <DatePicker
                  className="form-control col-3"
                  placeholder="Date"
                  value={newComplaint.date}
                  onChange={(e) => {
                    setNewComplaint({
                      ...newComplaint,
                      ["date"]: e,
                    });
                  }}
                />
              </div>

            </div>
            <div className="row mt-4">
              <button className="button-27" onClick={submitComplaint}>Add complaint</button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default ComplaintForm;

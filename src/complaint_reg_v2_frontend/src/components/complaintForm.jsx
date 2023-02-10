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


  async function submitComplaint() {
    console.log(actor);
    console.log(newComplaint);
    const isCreated = await actor.addComplaint(newComplaint.title, newComplaint.summary, newComplaint.location, newComplaint.date.toString());
    if(isCreated) {
        console.log("Complaint Created");
    } else {
        console.log("Error while creating complaint");
    }
    setNewComplaint("", "", "", newComplaint.date);

  }

  return (
    <div className="container">
      <div className="mx-auto">
        <Card className="bg-light w-75 mx-auto">
            <div className="row my-2 mx-5">
              <h5>Fill in the details</h5>
            </div>
          <Card.Body>
            <div className="row mt-2 justify-content-center">
              <input
                type="text"
                className="form-control col-6"
                placeholder="Enter short description(in less than 50 words)"
                value={newComplaint.title}
                onChange={(e) => {
                  setNewComplaint({
                    ...newComplaint,
                    ["title"]: e.target.value,
                  });
                }}
              ></input>
            </div>

            <div className="row mt-2 justify-content-center">
              <textarea
                className="col-6 wrap-content form-control"
                placeholder="Enter summary"
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

              <div className="col">
                <input
                  type="text"
                  className="form-control col-3"
                  placeholder="Enter location"
                  value={newComplaint.location}
                  onChange={(e) => {
                    setNewComplaint({
                      ...newComplaint,
                      ["location"]: e.target.value,
                    });
                  }}
                ></input>
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

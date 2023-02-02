import React, {useState} from 'react';
import { complaint_reg_v2_backend } from "../../../declarations/complaint_reg_v2_backend";


const PoliceDashboard = ({actor}) => {
    const [complaints, setComplaints] = useState([]);
    async function getUnassignedComplaints() {
        var complaints = await complaint_reg_v2_backend.getUnassignedComplaints();
        console.log(complaints);
        console.log(complaints[0][1]);
        console.log(complaints[0][0]);
        setComplaints(complaints);
    }
    return (
        <>
        <h1>PoliceDashboard</h1>
        <button onClick={getUnassignedComplaints}>Get New Complaints</button>
        { 
            complaints==[]?" No complaints yet ! ":
            <>
                <ul>
                    {
                        complaints.map(complaint => {
                            return (
                                <li>
                                    <ol>
                                        <li>{complaint[1].title}</li>
                                        <li>{complaint[1].summary}</li>
                                        <li>{complaint[1].date}</li>
                                        <li>{complaint[1].location}</li>
                                    </ol>
                                </li>
                            );
                        })
                    }
                </ul>
            </>
        }   
        </>
    );
};

export default PoliceDashboard;
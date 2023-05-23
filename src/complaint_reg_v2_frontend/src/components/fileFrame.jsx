import React, {useEffect, useState} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { create } from "ipfs-http-client";
import { complaint_reg_v2_backend_1 } from '../../../declarations/complaint_reg_v2_backend_1';
import { complaint_reg_v2_backend_2 } from '../../../declarations/complaint_reg_v2_backend_2';
import { complaint_reg_v2_backend_3 } from '../../../declarations/complaint_reg_v2_backend_3';
import { complaint_reg_v2_load_balancer } from '../../../declarations/complaint_reg_v2_load_balancer';

var eccrypto = require("eccrypto");

// var EC = require('elliptic').ec;
// const FileSaver = require('file-saver');
// const crypto = require("crypto");
// import * as eccryptoJS from 'eccrypto-js';
const CryptoJS = require("crypto-js")

const FileFrame = ({actors, actor, createActor1, createActor2, createActor3, actor1, actor2, actor3}) => {
    const params = useParams();
    const cid = params?.cid;
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [decryptedString, setDecryptedString] = useState("");
    const [hasAccess, setHasAccess] = useState(null);
    const [hasRequestedAccess, setHasRequestedAccess] = useState(false);
    const [isFileOwner, setIsFileOwner] = useState(false);
    const [fileRequests, setFileRequests] = useState([]);
    const [aesKey, setAESKey] = useState("");
    const [providingAccessStatus, setProvidingAccessStatus]=useState(null);
    const [totalQueryTime, setTotalQueryTime] = useState(0);
    const [mappedCanister, setMappedCanister] = useState(0);
    const [userMappedCanister, setUserMappedCanister] = useState(0);


    const location = useLocation();
    const userType = location?.state?.userType;
    const principal = window.ic.plug.sessionManager.sessionData.principalId.toString();
    // const polPrivKey = Buffer.from(localStorage.getItem(principal), "base64");    

    const secret = process.env.PRIV_KEY_AES_KEY;
    const privKey = localStorage.getItem(principal).toString("base64");
    const decPrivKey = CryptoJS.AES.decrypt(privKey, secret);
    const polPrivKey = Buffer.from(CryptoJS.enc.Base64.stringify(decPrivKey), "base64");

    const ipfs = create({
        url: "http://127.0.0.1:5002/",
    });
    
    useEffect(()=>{
        startActivity();
    },[actor3]);

    const startActivity = async () => {
        let getRequests = []
        var mappedCanister = 0
        var fileDetails = await complaint_reg_v2_load_balancer.getFileOwner(cid);
        console.log(fileDetails);
        mappedCanister = fileDetails[1];

        if(userType == "police" || userType == "admin") {
            console.log("is police");
            var actualfileOwner = fileDetails[0];
            const principal = window.ic.plug.sessionManager.sessionData.principalId.toString();
            if(actualfileOwner == principal) {
                const getRequests1 = await complaint_reg_v2_backend_1.getFileAccessRequests(cid);
                const getRequests2 = await complaint_reg_v2_backend_2.getFileAccessRequests(cid);
                const getRequests3 = await complaint_reg_v2_backend_3.getFileAccessRequests(cid);
                if(getRequests1.length>0) getRequests.push(...getRequests1);
                if(getRequests2.length>0) getRequests.push(...getRequests2);
                if(getRequests3.length>0) getRequests.push(...getRequests3);
            }
            else {
                console.log("not file owner");
                setIsFileOwner(false);
                await getAESKeyToViewFile(mappedCanister);
                return;
            }
            setIsFileOwner(true);
            console.log(getRequests);
            setFileRequests(getRequests);
        }
        await getAESKeyToViewFile(mappedCanister);
        
    };

    const getAESKeyToViewFile = async (mappedCanister) => {
        var startTime = Date.now();

        const principal = window.ic.plug.sessionManager.sessionData.principalId.toString();
        console.time("decrypt-aes-key");
        console.log("retrieve keys");
        let keys;
        if(mappedCanister == 0) {
            keys = await actor1.getEncAESKeyForDecryption(cid);
        }
        else if(mappedCanister == 1) {
            keys = await actor2.getEncAESKeyForDecryption(cid);
        }
        else if(mappedCanister == 2){
            keys = await actor3.getEncAESKeyForDecryption(cid);
        }

        
        console.log(keys);
        if(keys.cid == "" || keys.aesKey == "") {
            setHasAccess(false);
            let hasRequested ;
            let userMappedCanister = await complaint_reg_v2_load_balancer.getCanisterByUserPrincipal(principal);
            if(userMappedCanister == 0) {
                hasRequested = await actor1.hasRequestedAccessForCID(cid);
            }
            else if(userMappedCanister == 1) {
                hasRequested = await actor2.hasRequestedAccessForCID(cid);
            }
            else if(userMappedCanister == 2) {
                hasRequested = await actor3.hasRequestedAccessForCID(cid);
            }
            setUserMappedCanister(userMappedCanister);
            setHasRequestedAccess(hasRequested);
            console.log("no access to file");
        } else {
            console.log("has access");
            setHasAccess(true);
            const encKey = keys.aesKey;
            const iv = keys.iv;
            const bufa = JSON.parse(encKey);
            let newObj = {};
            Object.keys(bufa).forEach(function(key) {
              newObj[key] = Buffer.from(bufa[key]['data']);
            })
            const plaintext = await eccrypto.decrypt(polPrivKey, newObj);
            console.log(plaintext.toString('base64'));
            const actualAesKey = plaintext.toString('base64');
            setAESKey(actualAesKey);
        }
        console.timeEnd("decrypt-aes-key");        
        var endTime = Date.now();

        setTotalQueryTime((endTime-startTime));

    };

    async function displayFile() {
        await decryptEvidence(aesKey, "", cid);
    }

    async function decryptEvidence(aesKey, aesiv, fileCID) {
        
        const efile = ipfs.get(fileCID);
        var chunks = []
        for await (const chunk of efile) {
        chunks = [...chunks, ...chunk]
        }
        const encData = Buffer.from(chunks).toString();
        const base46EncData = "U2Fsd" + encData.split("U2Fsd")[1];
        const decrypted = CryptoJS.AES.decrypt(base46EncData, aesKey);
        var decryptedString = CryptoJS.enc.Base64.stringify(decrypted);
        // console.log(decryptedString)
        console.log("decrypted")
        setIsDecrypted(true);
        setDecryptedString(decryptedString);
        // CPU Intensive BUT CANNOT DOWNLOAD PDF
        let pdfWindow = window.open("")
        pdfWindow.oncontextmenu=function(){return false;}
        pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64," +
        encodeURI(decryptedString) + 
        "#toolbar=0&navpanes=0' oncontextmenu='return false;'></iframe>");

    
    }
        
    async function requestAccessByCID() {
        console.log('Sending request for file with CID '+cid);
        let hasRequested;
        if(userMappedCanister == 0) {
            hasRequested = await actor1.sendRequestAccessForCID(cid);
        }
        else if(userMappedCanister == 1) {
            hasRequested = await actor2.sendRequestAccessForCID(cid); 
        }
        else if(userMappedCanister == 2) {
            hasRequested = await actor3.sendRequestAccessForCID(cid); 
        }
        setHasRequestedAccess(hasRequested); 
    }

    async function provideFileAccess(principal) {
        console.log(principal);
        var reqCanister = await complaint_reg_v2_load_balancer.getCanisterByUserPrincipal(principal);
        var pubKeyOfRequestor;
        if(reqCanister == 0) {
            pubKeyOfRequestor = await complaint_reg_v2_backend_1.getPublicKeyByPrincipal(principal);
        }
        else if(reqCanister == 1) { 
            pubKeyOfRequestor = await complaint_reg_v2_backend_2.getPublicKeyByPrincipal(principal); 
        }
        else if(reqCanister == 2) {
            pubKeyOfRequestor = await complaint_reg_v2_backend_3.getPublicKeyByPrincipal(principal); 
        }

        console.log("pub key of user " + pubKeyOfRequestor.toString());

        // encrypt AES Key with pubKeyOfUser
        const bufPubKey = Buffer.from(pubKeyOfRequestor, "base64");
        const aesSymmetricKey = Buffer.from(aesKey, "base64");
        console.log(aesKey + " key given for access to user");
        eccrypto.encrypt(bufPubKey, aesSymmetricKey).then(async function(encrypted) {
            const encStringified = JSON.stringify(encrypted);
            // store encrypted aes key
            let result ;
            if(reqCanister == 0) {
                result = await actor1.provideAccessToFile(principal, cid, encStringified);
            }
            else if(reqCanister == 1) { 
                result = await actor2.provideAccessToFile(principal, cid, encStringified);            
            }
            else if(reqCanister == 2) {
                result = await actor3.provideAccessToFile(principal, cid, encStringified);            
            }
            console.log(result);
            setProvidingAccessStatus(result);
            if(result == true) {
            // refetch requests
                let getRequests = []
                const getRequests1 = await complaint_reg_v2_backend_1.getFileAccessRequests(cid);
                const getRequests2 = await complaint_reg_v2_backend_2.getFileAccessRequests(cid);
                const getRequests3 = await complaint_reg_v2_backend_3.getFileAccessRequests(cid);
                if(getRequests1.length>0) getRequests.push(...getRequests1);
                if(getRequests2.length>0) getRequests.push(...getRequests2);
                if(getRequests3.length>0) getRequests.push(...getRequests3);
                setFileRequests(getRequests);
            }
        });
        
    }

    return (
        <div className='container'>
            {
                hasAccess && totalQueryTime>0 && (<h4>The symmetric key was decrypted in {totalQueryTime} ms</h4>)
            }
            {
                hasAccess!=null && hasAccess==false && ( 
                    !hasRequestedAccess ? (
                        <>
                            <div className="alert alert-info mt-4" role="alert">
                                You do not have access to view this file
                            </div>
                            <button className='button-27' onClick={()=>{requestAccessByCID()}}>Click to Request Access</button>
                        </>
                    ) : (
                        <>
                            <div className="alert alert-info mt-4" role="alert">
                                You have already requested access for this file
                            </div>
                        </>
                    )
                )
            }    
            {
                hasAccess && <button className='button-27 mt-4' onClick={()=>{displayFile();}}>Click to view</button>
            }
            {
                isFileOwner && (
                    <div className='mt-4'>
                        <p>You are the owner of this file</p>
                        <p>Review requests to view this file below: </p>
                        {
                            providingAccessStatus && <p className='success-message'>Access has been granted!</p>
                        }
                        {
                            fileRequests.length>0 && fileRequests.map(req => {
                                return (
                                    <div key={req[0]} className='flex d-flex row'>
                                        <div className='col'>
                                            <p>Id: {req[0].substr(0,5)}******</p>
                                        </div>
                                        <div className='col'>
                                            <p>Name : {req[1].name}</p>
                                        </div>
                                        <div className='col'>
                                            <p>Category :{req[1].category} </p>
                                        </div>
                                        <div className='col-3'>
                                            <button onClick={()=>{provideFileAccess(req[0])}} className='button-27 small'>Provide access</button>
                                        </div>
                                    </div>
                                    )
                            })
                        }
                        {
                            fileRequests.length==0 && <p className='text-muted'>No pending access requests</p>
                        }
                    </div>
                ) 
            }
        </div>
    )
}


export default FileFrame;


/*

TRIED METHODS
        // const url = "data:application/pdf;base64,"+encodeURI(decryptedString)+"#toolbar=0&navpanes=0";

        // FIND  A WAY TO AVOID DOWNLOAD
        // const r = await fetch(`data:application/pdf;base64,${encodeURI(decryptedString)}`);
        // const blob = await r.blob();
        // const url =  URL.createObjectURL(blob);
        // window.open(url);
        // console.log(url);
        // Convert to array buffer, download pdf
        // var bytes = [];
        // while (decryptedString.length >= 8) { 
        //     bytes.push(parseInt(decryptedString.substring(0, 8), 16));
        //     decryptedString = decryptedString.substring(8, decryptedString.length);
        // }
        // const outFile = new Blob(bytes, {type: "application/pdf"});
        // FileSaver.saveAs(outFile, "out.pdf");



*/
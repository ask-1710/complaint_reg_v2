import React, {useEffect, useState} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { create } from "ipfs-http-client";
import { complaint_reg_v2_backend } from '../../../declarations/complaint_reg_v2_backend';

var eccrypto = require("eccrypto");

// var EC = require('elliptic').ec;
// const FileSaver = require('file-saver');
// const crypto = require("crypto");
// import * as eccryptoJS from 'eccrypto-js';
const CryptoJS = require("crypto-js")

const FileFrame = ({actor, createActor}) => {
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

    const location = useLocation();
    const userType = location?.state?.userType;
    const principal = window.ic.plug.sessionManager.sessionData.principalId.toString();
    const polPrivKey = Buffer.from(localStorage.getItem(principal), "base64");

    const ipfs = create({
        url: "http://127.0.0.1:5002/",
    });
    
    useEffect(()=>{
        if(actor=="") createActor();
        else startActivity();
    },[]);

    const startActivity = async () => {
        if(userType == "police") {
            console.log("is police");
            const getRequests = await actor.getFileAccessRequests(cid);
            if(getRequests.length == 1 && getRequests[0][0]=="") {
                console.log("not file owner");
                setIsFileOwner(false);
                await getAESKeyToViewFile();
                return;
            }
            setIsFileOwner(true);
            console.log(getRequests);
            setFileRequests(getRequests);
        }
        await getAESKeyToViewFile();
    };

    const getAESKeyToViewFile = async () => {
        console.log("retrieve keys");
        const keys = await actor.getEncAESKeyForDecryption(cid);
        console.log(keys);
        if(keys.cid == "" || keys.aesKey == "") {
            setHasAccess(false);
            const hasRequested = await actor.hasRequestedAccessForCID(cid);
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
        const hasRequested = await actor.sendRequestAccessForCID(cid); // TO BE IMPLEMENTED
        setHasRequestedAccess(hasRequested);
    }

    async function provideFileAccess(principal) {
        var pubKeyOfRequestor = await complaint_reg_v2_backend.getPublicKeyByPrincipal(principal);
        console.log("pub key of user " + pubKeyOfRequestor.toString());

        // encrypt AES Key with pubKeyOfUser
        const bufPubKey = Buffer.from(pubKeyOfRequestor, "base64");
        const aesSymmetricKey = Buffer.from(aesKey, "base64");
        console.log(aesKey + " key given for access to user");
        eccrypto.encrypt(bufPubKey, aesSymmetricKey).then(async function(encrypted) {
          const encStringified = JSON.stringify(encrypted);
          // store encrypted aes key
          const result = await actor.provideAccessToFile(principal, cid, encStringified);
          console.log(result);
          setProvidingAccessStatus(result);
          if(result == true) {
            // refetch requests
            const getRequests = await actor.getFileAccessRequests(cid);
            setFileRequests(getRequests);
          }
        });
        
    }

    return (
        <div className='container'>
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
                            <div className="alert alert-info" role="alert">
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
                                        <p>Name : {req[1].name}</p>
                                    </div>
                                    <div className='col'>
                                        <p>User category :{req[1].category} </p>
                                    </div>
                                    <div className='col-2'>
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
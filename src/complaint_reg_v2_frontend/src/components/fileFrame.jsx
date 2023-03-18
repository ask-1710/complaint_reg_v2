import React, {useEffect, useState} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { create } from "ipfs-http-client";
import { complaint_reg_v2_backend } from '../../../declarations/complaint_reg_v2_backend';

var eccrypto = require("eccrypto");
const CryptoJS = require("crypto-js")

const FileFrame = ({actor, createActor}) => {
    const params = useParams();
    const cid = params?.cid;
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [decryptedString, setDecryptedString] = useState("");
    const [hasAccess, setHasAccess] = useState(null);
    const [hasRequestedAccess, setHasRequestedAccess] = useState(false);
    const [isFileOwner, setIsFileOwner] = useState(null);
    const [fileRequests, setFileRequests] = useState([]);
    const [aesKey, setAESKey] = useState("");
    const [providingAccessStatus, setProvidingAccessStatus]=useState(null);

    const location = useLocation();
    const userType = location?.state?.userType;
    const principal = window.ic.plug.sessionManager.sessionData.principalId.toString();
    const myPrivKeyBuf = Buffer.from(localStorage.getItem(principal), "base64");

    const ipfs = create({
        url: "http://127.0.0.1:5002/",
    });
    
    useEffect(()=>{
        if(actor=="") createActor();
        else startActivity();
    },[]);

    const getFileRequests = async () => {
        if(userType == "police") {
            console.log("is police");
            const getRequests = await actor.getFileAccessRequests(cid);
            if(getRequests.length == 1 && getRequests[0][0]=="") {
                console.log("not file owner");
                setIsFileOwner(false);
                await getAESKeyToViewFile();
                return false;
            }
            setIsFileOwner(true);
            console.log("isfile owner : "+isFileOwner);
            console.log(getRequests);
            setFileRequests(getRequests);
            console.log("file requests got");
            return true;
        } else {
            return false;
        }
        
    }

    const startActivity = async () => {
        const isOwner = await getFileRequests();
        await getAESKeyToViewFile(isOwner);
    };

    const getAESKeyToViewFile = async (isFileOwner) => {
        console.time('to-decrypt-AES-key');
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

			if(isFileOwner) {  // owner -> get using assymetric encryption
                console.log("file owner");
				setHasAccess(true);
				const encKey = keys.aesKey;
				const iv = keys.iv;
				const bufa = JSON.parse(encKey);
				let newObj = {};
				Object.keys(bufa).forEach(function(key) {
				  newObj[key] = Buffer.from(bufa[key]['data']);
				})
				const plaintext = await eccrypto.decrypt(myPrivKeyBuf, newObj);
				console.log(plaintext.toString('base64'));
				const actualAesKey = plaintext.toString('base64');
				setAESKey(actualAesKey);
			} else { // derive shared key -> get aes key
                setHasAccess(true);
                console.log("not file owner");
                const ownerPrincipal = await complaint_reg_v2_backend.getFileOwnerAsPrincipal(cid);
				const ownerPubKey = await complaint_reg_v2_backend.getPublicKeyByPrincipal(ownerPrincipal); // TO BE IMPLEMENTED
				// const ownerPubKey = "BKJ07gkq4hZWHSecimzkDFq5Dem9bqyJxAh3dyp1cvn1/Rjk/uiClQXa42lMCDweYgMyNyTxiFMRl349v+huErg=";
                console.log(ownerPubKey);
				const ownerPubKeyBuf = Buffer.from(ownerPubKey, "base64");
				const encKey = keys.aesKey;
				const iv = keys.iv;
				console.log(encKey);
				eccrypto.derive(myPrivKeyBuf, ownerPubKeyBuf).then(function(sharedKey) {
					const toBuf = sharedKey.toString("base64");
					const decrypted = CryptoJS.AES.decrypt(encKey, toBuf);
					const decryptedString = CryptoJS.enc.Base64.stringify(decrypted);
					console.log(decryptedString);
                    setAESKey(decryptedString);
				})
			}
        }
        console.timeEnd('to-decrypt-AES-key');
    };

    async function displayFile() {
        console.log("In decrypt function: "  + aesKey);
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

    async function provideFileAccess(reqPrincipal) {
        const reqPubKey = await complaint_reg_v2_backend.getPublicKeyByPrincipal(reqPrincipal);
        const reqPubKeyBuf = Buffer.from(reqPubKey, "base64");

		eccrypto.derive(myPrivKeyBuf, reqPubKeyBuf).then(async function(sharedKey) {
			const sharedKeyBase64 = sharedKey.toString("base64");
            localStorage.setItem("sharedKey", sharedKeyBase64);
			console.log(sharedKeyBase64);
			const symmetricKeyWordArray = CryptoJS.enc.Base64.parse(aesKey);
			// console.log(symmetricKeyWordArray);
			const encrypted = CryptoJS.AES.encrypt(symmetricKeyWordArray, sharedKeyBase64); // added padding// try removing padding and check
			const encStringified = encrypted.toString();
			console.log(encStringified);
			
            const result = await actor.provideAccessToFile(reqPrincipal, cid, encStringified);
			console.log(result);
			setProvidingAccessStatus(result);
			if(result == true) {
			// 	// refetch requests
				const getRequests = await actor.getFileAccessRequests(cid);
				setFileRequests(getRequests);
			}
		});
        
    }

    return (
        <div className='container'>
            {hasAccess!=null && hasAccess==false && ( 
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
            )}    
            {hasAccess && <button className='button-27 mt-4' onClick={()=>{displayFile();}}>Click to view</button>}
            {isFileOwner && (
                <div className='mt-4'>
                    <p>You are the owner of this file</p>
                    <p>Review requests to view this file below: </p>
                    {providingAccessStatus && <p className='success-message'>Access has been granted!</p>}
                    {fileRequests.length>0 && fileRequests.map(req => {
						return (
						<div key={req[0]} className='flex d-flex row'>
							<div className='col'>
								<p>Name : {req[1].name}</p>
							</div>
							<div className='col'>
								<p>User category :{req[1].category} </p>
							</div>
							<div className='col-3'>
								<button onClick={()=>{provideFileAccess(req[0])}} className='button-27 small'>Provide access</button>
							</div>
						</div>
						)
					})}
                    {fileRequests.length==0 && <p className='text-muted'>No pending access requests</p>}
                </div>
            )}
        </div>
    )
}


export default FileFrame;

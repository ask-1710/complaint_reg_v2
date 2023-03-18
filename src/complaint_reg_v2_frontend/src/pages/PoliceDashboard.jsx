import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { complaint_reg_v2_backend } from "../../../declarations/complaint_reg_v2_backend";
import { idlFactory } from "../../../declarations/complaint_reg_v2_backend";
import { useEffect } from "react";
import { Badge } from "react-bootstrap";
import { create } from "ipfs-http-client";
var eccrypto = require("eccrypto");
const CryptoJS = require("crypto-js")

const PoliceDashboard = ({
  actor,
  setIsConnected,
  createActor,
  setIsNewUser,
  setIsSetupComplete,
}) => {
  const nnsCanisterId = "rrkah-fqaaa-aaaaa-aaaaq-cai";
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [addedEvidence, setAddedEvidence] = useState(false);
  const [errorWhileAdding, setErrorWhileAdding] = useState(false);
  const [isInvestigator, setIsInvestigator] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isChargesheet, setIsChargesheet] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const possibleStages = {
    firregisteration: { step: 1, badgeText: "FIR registeration" },
    investigation: { step: 2, badgeText: "Investigation on-progress" },
    finalreportfiling: { step: 3, badgeText: "Filing final report" },
    solved: { step: 4, badgeText: "Solved" },
    unsolved: { step: 5, badgeText: "Unsolved" },
  };

  const principalId = location?.state?.principalId;
  const isConnected = location?.state?.isConnected;
  // const key = eccryptoJS.randomBytes(32);
  // const iv = eccryptoJS.randomBytes(16); // store as [encKey, IV] in ic
  const key = "secretsecretsecr"
  const iv = "secretiv"
  const ipfs = create({
    url: "http://127.0.0.1:5002/",
  });

  useEffect(() => {
    setIsSetupComplete(true);
    setIsNewUser(false, "police");
    setIsConnected(true);

    if (actor == "") createActor();
  }, []);

  useEffect(() => {
    if (actor != "") getUnassignedComplaints();
  }, [actor]);

  useEffect(()=>{
    checkIfInvestigator();
  },[selectedComplaint]);

  async function getUnassignedComplaints() {
    var complaints = await complaint_reg_v2_backend.getUnassignedComplaints();
    console.log(complaints);
    // const complaints=[[0, {title: "abc", summary: "sum", date: "12/3/22", location: "delhi"}],
    // [1, {title: "abc", summary: "sum", date: "12/3/22", location: "delhi"}]];
    setComplaints(complaints);
  }

  async function updateComplaint(complaintId) {
    setSelectedComplaint(null);
    console.log("Updating complaint id "+complaintId+" with status "+updatedStatus);
    var result = await actor.updateComplaintStatus(complaintId, updatedStatus);
    if(result==true) {
      getUnassignedComplaints();
    }
  }

  async function uploadEvidences(e) {
    const chosenFiles = Array.prototype.slice.call(e.target.files)  
    setUploadedFiles(chosenFiles);
  }

  async function saveEvidences(complaintId, _ev, document) {
    const file = uploadedFiles[0]; // accepts only one file
    let fr = new FileReader();
    fr.onload = async function(e) {
      const binaryString = e.target.result;
      const parts = binaryString.split(";base64,")[1];
            
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(parts), key);
      const result = await ipfs.add(encrypted.toString());
      console.log(result.path);
      await encryptAESKeyAndSave(key, complaintId, result.path, document);
   }
    fr.readAsDataURL(file);
  }

  async function saveFIR(complaintId, _ev, document) {
    const file = uploadedFiles[0]; // accepts only one file
    let fr = new FileReader();
    fr.onload = async function(e) {
      const binaryString = e.target.result;
      const parts = binaryString.split(";base64,")[1];
            
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(parts), key);
      const result = await ipfs.add(encrypted.toString());
      console.log(result.path);
      await encryptAESKeyAndSave(key, complaintId, result.path, document);
   }
    fr.readAsDataURL(file);
  }

  async function saveChargesheetOrClosureReport(complaintId, _ev, doc) {
    var document = isChargesheet?"chargesheet":"closurereport";
    const file = uploadedFiles[0]; // accepts only one file
    let fr = new FileReader();
    fr.onload = async function(e) {
      const binaryString = e.target.result;
      const parts = binaryString.split(";base64,")[1];
            
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Base64.parse(parts), key);
      const result = await ipfs.add(encrypted.toString());
      console.log(result.path);
      await encryptAESKeyAndSave(key, complaintId, result.path, document);
   }
    fr.readAsDataURL(file);
  }

  async function encryptAESKeyAndSave(aesKey,complaintId, fileCID, document) {
    const principalId = window.ic.plug.sessionManager.sessionData.principalId;
    const pubKey = await complaint_reg_v2_backend.getPublicKeyByPrincipal(principalId); // encryption with public key
    const polPubKey = Buffer.from(pubKey, "base64");
    const aesSymmetricKey = Buffer.from(aesKey, "base64");
    eccrypto.encrypt(polPubKey, aesSymmetricKey).then(async function(encrypted) {
      const encStringified = JSON.stringify(encrypted);
      // store encrypted aes key
      let result;
      if(document=="FIR") result = await actor.addFIR(complaintId, fileCID, encStringified, "");
      else if(document == "chargesheet") result = await actor.addChargesheet(complaintId, fileCID, encStringified, "");
      else if(document == "closurereport") result = await actor.addClosureReport(complaintId, fileCID, encStringified, "");
      else result = await actor.addEvidence(complaintId, fileCID, encStringified, "");      
      console.log(result);
      setAddedEvidence(result);
      setAddingEvidence(false);
      if(!result) {
        setErrorWhileAdding(true);
      }
    });
    
  }

  async function checkIfInvestigator() {
    console.log("Selected complaint "+selectedComplaint);
    if(selectedComplaint!="" && selectedComplaint!=null) {
      const isInvestigator = await actor.isInvestigatorForComplaint(selectedComplaint);
      setIsInvestigator(isInvestigator);
    }
  }

  async function showSave(updated) {
    setShowSaveButton(updated!=originalStatus);
  }

  return (
    <div className="container">
      <button className="button-27 my-4" onClick={getUnassignedComplaints}>
        Get New Complaints
      </button>
      {complaints.length == 0 ? (
        <div className="typewriter center">
          <p> No complaints yet ... </p>
        </div>
      ) : (
        <div className="container">
          <div className="list-group">
            {complaints.map((complaint) => {
              return (
                <>
                  {selectedComplaint == complaint[0] && isInvestigator ? (
                    <div className="list-group-item my-2 list-group-item-action align-items-start">
                      <div className="flex d-flex flex-column p-2 m-4">
                        <div>
                          Short description:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].title}
                            disabled={true}
                          />
                        </div>
                        <div>
                          Summary:{" "}
                          <textarea
                            className="wrap-content form-control"
                            value={complaint[1].summary}
                            disabled
                          ></textarea>
                        </div>
                        <div>
                          Date of occurence:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].date}
                            disabled={true}
                          />
                        </div>
                        <div>
                          Location of occurence:{" "}
                          <input
                            className="form-control"
                            type="text"
                            value={complaint[1].location}
                            disabled={true}
                          ></input>
                        </div>
                        <div>
                          Status:{" "}
                          <select
                            type="select"
                            className="form-control"
                            value={updatedStatus}
                            onChange={(ev) => {
                              setUpdatedStatus(ev.target.value);
                              showSave(ev.target.value);
                            }}
                          >
                          <option value={Object.keys(possibleStages)[0]}>
                            FIR registration ongoing
                          </option>
                          {
                            complaint[1].FIR!="NONE" && (
                              <>
                              <option value={Object.keys(possibleStages)[1]}>
                                Investigation ongoing
                              </option>
                              <option value={Object.keys(possibleStages)[2]}>
                                Final Report filing
                              </option>
                              {
                                (complaint[1].chargesheet!='NONE' || complaint[1].closureReport!='NONE') && (
                                  <>
                                    <option value={Object.keys(possibleStages)[3]}>Verdict passed</option>
                                    <option value={Object.keys(possibleStages)[4]}>Case abandoned</option>
                                  </>
                                )
                              }
                            </>
                            )
                          }
                          </select>
                        </div>
                        <div>
                          <div className="flex d-flex flex-row p-2 m-5">
                            <div className="m-6 p-6">
                              <button
                                className="button-27"
                                onClick={(ev) => {
                                  setSelectedComplaint(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                            {showSaveButton && <div className="m-6 p-6">
                              <button
                                className="button-27"
                                onClick={(ev) => {
                                  updateComplaint(complaint[0]);
                                }}
                              >
                                Submit
                              </button>
                            </div>
                            }
                          </div>
                        </div>
                      </div>{" "}

                      <div>
                        {
                          addedEvidence && <p className="success-message">File saved</p>
                        }                        
                        {
                          errorWhileAdding && <p className="error-message">You do not have the permissions to add a case document for this complaint!<br/> Please contact admin to assign this complaint to you</p>
                        }
                        {
                          originalStatus == Object.keys(possibleStages)[1] && (
                            addingEvidence?(
                              <>
                              <p className="flex-box label-text">Only pdf accepted</p>
                              <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf , image/png, image/jpg, image/jpeg"></input>
                              {uploadedFiles.map(file=>{return <Badge text="dark" bg="warning">{file.name}</Badge>})}
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveEvidences(complaint[0], ev, "evidence")}}>Save</button>
                              <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);setErrorWhileAdding(false);setAddedEvidence(false);}}>Cancel</button>
                              </>
                            ):(
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);setAddedEvidence(false);setErrorWhileAdding(false);}}>Add evidence</button>
                            )
                          )
                        }
                        {
                          originalStatus == Object.keys(possibleStages)[0] && (
                            addingEvidence?(
                              <>
                              <p className="flex-box label-text">Only pdf accepted</p>
                              <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf"></input>
                              {uploadedFiles.map(file=>{return <Badge  text="dark" bg="warning">{file.name}</Badge>})}
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveFIR(complaint[0], ev, "FIR")}}>Save</button>
                              <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);setErrorWhileAdding(false);setAddedEvidence(false);}}>Cancel</button>
                              </>
                            ):(
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);setAddedEvidence(false);errorWhileAdding(false);}}>Register FIR</button>
                            )
                          ) 
                        }
                        {
                          originalStatus == Object.keys(possibleStages)[2] && (
                            addingEvidence?(
                              <>
                                <input
                                  className="mx-2"
                                  type="checkbox"
                                  name="isChargesheet"
                                  checked={isChargesheet}
                                  onChange={()=>{setIsChargesheet(!isChargesheet)}}
                                />
                                You are uploading the {isChargesheet? "chargesheet":"closure report"}<br/>
                                <p className="flex-box label-text">Only pdf accepted</p>
                                <input className="form-control" onChange={(ev)=>{uploadEvidences(ev)}} type="file" multiple accept="application/pdf"></input>
                                {uploadedFiles.map(file=>{return <Badge  text="dark" bg="warning">{file.name}</Badge>})}
                                <button className="button-27 small-right-bottom-button" onClick={(ev)=>{saveChargesheetOrClosureReport(complaint[0], ev, "")}}>Save</button>
                                <button className="button-27 not-button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(false);setErrorWhileAdding(false);setAddedEvidence(false);}}>Cancel</button>
                              </>
                            ):(
                              <button className="button-27 small-right-bottom-button" onClick={(ev)=>{setAddingEvidence(true);setAddedEvidence(false);setErrorWhileAdding(false);}}>Upload Document</button>
                            )
                          )
                        }
                      </div>
                    </div>                    
                  ) : (
                    <div className="list-group-item my-2 list-group-item-action align-items-start" data-toggle="list">
                      <div
                        key={complaint[0]}
                        onClick={(ev) => {
                          setSelectedComplaint(complaint[0]);
                          setUpdatedStatus(Object.keys(complaint[1].status)[0]);
                          setOriginalStatus(Object.keys(complaint[1].status)[0])
                        }}
                      >
                        <ul className="complaint-list">
                          <li>
                            <b>Short description</b>
                            {" : " + complaint[1].title}
                          </li>
                          <li>
                            <b>Summary of incident</b>
                            {" : " + complaint[1].summary}
                          </li>
                          <li>
                            <b>Date of occurence</b>
                            {" : " + complaint[1].date}
                          </li>
                          <li>
                            <b>Location of occurence</b>
                            {" : " + complaint[1].location}
                          </li>{" "}
                          <li>
                            {possibleStages[Object.keys(complaint[1].status)[0]]
                              .step < 2 ? (
                              <Badge bg="warning" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            ) : possibleStages[
                                Object.keys(complaint[1].status)[0]
                              ].step < 4 ? (
                              <Badge bg="info" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            ) : possibleStages[
                                Object.keys(complaint[1].status)[0]
                              ].badgeText == "Solved" ? (
                              <Badge bg="success" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            ) : (
                              <Badge bg="danger" text="dark">
                                {
                                  possibleStages[
                                    Object.keys(complaint[1].status)[0]
                                  ].badgeText
                                }
                              </Badge>
                            )}
                          </li>
                        </ul>                        
                      </div>
                      <button className="button-27 small-button" onClick={()=>{navigate(`/complaintview/${complaint[0]}`, {state: {userType: "police"}})}}>View details</button>
                    </div>
                  )}
                </>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliceDashboard;

/*
WORKING BACKUP:

      // const myPublicKey = await complaint_reg_v2_backend.getPublicKeyByPrincipal(principalId);
      // console.log("My public key : "+myPublicKey);
      // const aesSymmetricKey = Buffer.from(key);
      // const pubKey = eccryptoJS.utf8ToBuffer(myPublicKey);
      // var encAESKey = await eccryptoJS.encrypt(pubKey, aesSymmetricKey);
      // console.log(encAESKey.toString());
      // eccrypto.encrypt(pubKey, aesSymmetricKey).then(function(encrypted) {
      //   // B decrypting the message.
      //   console.log(encrypted);
      //   eccrypto.decrypt(privateKeyB, encrypted).then(function(plaintext) {
      //     console.log("Message to part B:", plaintext.toString());
      //   });
      // });
TRIED CODES:


<iframe src="/uploads/media/default/0001/01/540cb75550adf33f281f29132dddd14fded85bfc.pdf#toolbar=0" width="100%" height="500px">


  async function encryptEvidence(buff) {
    // const ciphertext = await eccryptoJS.aesCbcEncrypt(iv, key, file);  -> does not work
    // const wordArray = CryptoJS.lib.WordArray.create(file);
    // const str = CryptoJS.enc.Base64.stringify(wordArray); // -> passing base64 encoded string to encrypt
    // const ciphertext = CryptoJS.AES.encrypt(str, key).toString(CryptoJS.format.OpenSSL); // decrypted string in base64
    // console.log(ciphertext);
    // return ciphertext.toString(); // pass base64 encoded format to decryption function
    // let linearFile = Buffer.from(file).toString('latin1'); // change to utf8 encoding
    // let wordArray = CryptoJS.enc.Latin1.parse(linearFile);
    // let parsedKey = CryptoJS.enc.Latin1.stringify(CryptoJS.enc.Utf8.parse(key));
    // let encData = CryptoJS.AES.encrypt(wordArray, parsedKey).toString(CryptoJS.enc.Latin1);
    // let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(encJson))

    // return encData; // returns base64
     
    // using crypto library 
    // const key = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 chars
    // localStorage.setItem("AESkey", key);
    // const iv = crypto.randomBytes(8).toString('hex');   // 8 bytes -> 16 chars
    // localStorage.setItem("AESiv", iv);
    // const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    // const data = cipher.update(buff); // returns buffer
    // const encrypted = Buffer.concat([data, cipher.final()]);
    // return encrypted.toString('hex') // input is of format hex converted to 2-digit hex char

  }


  function uintToString(uintArray) {
    var decodedStr = new TextDecoder("utf-8").decode(uintArray);
    return decodedStr;
  }


  const wordArrayToByteArray = (hash) => {
    console.log("inside wordArrayToByteArray");
    return hash.words
      //map each word to an array of bytes
      .map(function(v){
        console.log("inside wordArrayToByteArray loop");
        // create an array of 4 bytes (less if sigBytes says we have run out)
        var bytes = [0,0,0,0].slice(0,Math.min(4,hash.sigBytes))
          // grab that section of the 4 byte word
          .map(function(d,i){ return (v >>> (8*i)) % 256; })
          // flip that
          .reverse()
          ;
        // remove the bytes we've processed 
        // from the bytes we need to process
        hash.sigBytes -= bytes.length;
        return bytes;
      })
      // concatinate all the arrays of bytes
      .reduce(function(a,d){ return a.concat(d);},[])
      // convert the 'bytes' to 'characters'
      // .map(function(d){return String.fromCharCode(d);})
      // create a single block of memory
      // .join('')
      ;
  }


  function wordToByteArray(word, length) {
    var ba = [],
      i,
      xFF = 0xFF;
    if (length > 0)
      ba.push(word >>> 24);
    if (length > 1)
      ba.push((word >>> 16) & xFF);
    if (length > 2)
      ba.push((word >>> 8) & xFF);
    if (length > 3)
      ba.push(word & xFF);
  
    return ba;
  }
  
  function wordArrayToByteArray(wordArray, length) {
    if (wordArray.hasOwnProperty("sigBytes") && wordArray.hasOwnProperty("words")) {
      length = wordArray.sigBytes;
      wordArray = wordArray.words;
    }
  
    var result = [],
      bytes,
      i = 0;
    while (length > 0) {
      bytes = wordToByteArray(wordArray[i], Math.min(4, length));
      length -= bytes.length;
      result.push(bytes);
      i++;
    }
    return result.flat();
  }
   
  async function decryptFileByCID(cid) {
  //   console.log("get ipfs");
  //   const file  = ipfs.get(cid); // file is a string
  //   const fileBufferArray = []
  //   for await (const chunk of file) {
  //     fileBufferArray.push(chunk)
  //   } 
  //  const buffer = Buffer.concat(fileBufferArray); // encrypted result from ipfs

   // get buffer from uploaded file
    const uploadedFile = uploadedFiles[0];
    let fr = new FileReader();
    let upBuffer;
    let upEncrypted;
    fr.onload = async function(e) {
    //   upBuffer = Buffer.from(e.target.result); // array buffer
    //   upEncrypted = await encryptEvidence(upBuffer) // returned in hex encoding
    //   // console.log(upEncrypted);
    // //   // // // // upload to IPFS
    //   const result = await ipfs.add(upEncrypted) // upload base64 encoding of encrypted data
    //   console.log(result.path);

      // // download file
      // console.log('--DOWNLOAD FILE FROM IPFS----');
      // const downFile = ipfs.get(result.path);
      // const key = localStorage.getItem("AESkey").toString("utf8")
      // const iv = localStorage.getItem("AESiv").toString("utf8");
      // const downFile = ipfs.get("QmU7GnXnJb6aLRXASsWTXFqWzEpYyvu8fcDKtdciKJT5Xh"); // uint8array[] -> base64 string -> decrypt -> utf8 -> json.parse -> buffer as uf8 -> blob -> save
      // var chunks = []
      // // var str = ""
      // for await (const chunk of downFile) {
      //   // str += decoder.decode(chunk, {stream: true});
      //   chunks.push(chunk);
      // } 
      // // // // // // str += decoder.decode();
      // // // // // // const str64 = Buffer.from(chunks).toString('base64');
      // const ebuf = Buffer.concat(chunks);// output data of format utf8

      // const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
      // const data = decipher.update(ebuf)
      // const decrpyted = Buffer.concat([data, decipher.final()]);

      // const outFile = new Blob([decrpyted], {type: "application/pdf"});
      // FileSaver.saveAs(outFile, "filename.pdf");
    
      // const parsedKey = CryptoJS.enc.Latin1.stringify(CryptoJS.enc.Utf8.parse(key));
      // // const decData = CryptoJS.enc.Latin1.parse(str64).toString(CryptoJS.enc.Latin1) // utf8 -> base64
      // const bytes = CryptoJS.AES.decrypt(strLatin, parsedKey);
      // const decJSON = CryptoJS.enc.Latin1.stringify(bytes); 
      // console.log(JSON.parse(decJSON.toString()));

      // let decData = CryptoJS.enc.Base64.parse(str64).toString(CryptoJS.enc.Utf8)
      // console.log("decData " + decData.toString('base64'))
      // let bytes = CryptoJS.AES.decrypt(decData, key).toString(CryptoJS.enc.Utf8)
      // const fileBufferArray = JSON.parse(bytes)
      // console.log(fileBufferArray.file);
      // const outFile = new Blob(fileBufferArray.file, {type: "application/pdf"});
      // FileSaver.saveAs(outFile, "filename.pdf");

     
      // // console.log(typeof(strBase64));
      // // // // // // decrypt
      // // // // console.log(str);
      // const strBase64 = CryptoJS.enc.Base64.parse(str64);
      // const decrypted = CryptoJS.AES.decrypt(strBase64, key); // fileBlob in utf8 encoding
      // const decStr = decrypted.toString(CryptoJS.enc.Utf8)
      // const outFile = new Blob([decStr], {type: "application/pdf"});
      // FileSaver.saveAs(outFile, "filename.pdf");

      // const wordArray = CryptoJS.enc.Hex.parse(decStr);
      // const BaText = wordArrayToByteArray(wordArray, wordArray.length);
      // var arrayBufferView = new Uint8Array(BaText);
      // var blob = new Blob( [ arrayBufferView ], { type: "application/pdf" } );
      // FileSaver.saveAs(blob, "filename.pdf");
    }
    fr.readAsArrayBuffer(uploadedFile);


    // console.log(iv);
    // console.log(key);
    // console.log(buffer.toString());
    // try {
      // const decrypted = await eccryptoJS.aesCbcDecrypt(iv, key, downArrayBuffer);
    //   console.log("File decrypted" + decrypted.toString());
    //   // console.log(decrypted.toString());
    //   // const fileObject = new File([decrypted]);
    //   // console.log('File object : ' + fileObject)
    // } catch(err) {
    //   console.log(err);
    // }
  }

  
  */
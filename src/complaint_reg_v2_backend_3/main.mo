import Array "mo:base/Array";
import Bool "mo:base/Bool";
import Deque "mo:base/Deque";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Prelude "mo:base/Prelude";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import TrieSet "mo:base/TrieSet";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Error "mo:base/Error";
import Time "mo:base/Time";
import VebTree "vebtree";


let vebTree = VebTree.VebTree.construct();


actor Actor3 {
  
  type StatusText = {
    #firregisteration; // requires /*complaint basic*/ info
    #investigation; // requires /*fir*/ to be filed -> adding evidence
    #finalreportfiling; // requires atleast one /*evidence*/ -> filing chargesheet
    #solved; // requires /*chargesheet*/ to be filed -> creating verdict
    #unsolved; // /*closure*/ report
  };

  type Complaint = {
    title : Text;
    summary : Text;
    date : Text;
    location : Text;
    typee : Text;
    evidence : [Text]; // CIDs
    status : StatusText;
    FIR : Text; // CID - step1
    chargesheet : Text; // CID
    closureReport : Text; // CID
    complainantPrincipal: Principal;
    updatedOn: Time.Time;
    investigatorPrincipal: Principal;
    FIRDate : Time.Time;
    chargesheetDate: Time.Time;
    closureReportDate : Time.Time;
  };

  public type Role = {
    #administrator; // establish accounts for each user setMember()
    #investigator; // current custodian of documents, tranferOwnership(), modifyEvidence()
    #complainant; // getEvidence(), createEvidence()
    #general;
  };

  // stats like number of complaints,
  type User = {
    name : Text;
    address : Text;
    mobileNum: Text;
    emailID: Text;
    complaints : [Nat];
  };
  // TODO: add stats, complaints solved, complaints pending, assigned, active, unsolved&inactive
  type Police = {
    name : Text;
    designation : Text;
    stationCode: Text;
    stationAddress: Text;
    mobileNum: Text;
    activeComplaints : [Nat];
    numSolvedCases : Nat;
    numUnsolvedCases : Nat;
  };
  type EncKey = {
    principal: Principal; 
    aesKey: Text;
    aesIV: Text;
  };
  type UserCIDKey = {
    cid: Text;
    aesKey: Text;
    aesIV: Text;
  };

  type ComplaintViewModel = {
    title : Text;
    summary : Text;
    date : Text;
    location : Text;
    typee : Text;
    evidence : [Text]; // CIDs
    status : StatusText;
    FIR : Text; // CID - step1
    complainantPrincipal: Text;
    chargesheet : Text; // CID
    closureReport : Text; // CID
    assignedStation: Text;
    assignedStationCode: Text;
    investigatorPrincipal: Text;
    ownershipHistory: [Principal]; 
    complainantName: Text;
    updatedOn: Time.Time;
    complainantAddress: Text;  
    FIRDate : Time.Time;
    chargesheetDate: Time.Time;
    closureReportDate : Time.Time;
  };

  type FileRequestor = {
    category : Text; // police / complainant
    name: Text; 
  };

  public type AllData = {
    userList : [(Principal, User)];
    assignedRoles : [(Principal, Role)];
    policeList : [(Principal, Police)];
    roleRequests : [(Principal, (Role, Text))];
    complaintList : [(Nat, Complaint)];
    complaintOwnership : [(Nat, [Principal])];
    keysList: [(Principal, Text)];
    uploaderAESKeys: [(Text, EncKey)];
    userAESKeys: [(Principal, [UserCIDKey])];
    userFileAccessRequests : [(Text, [Principal])];
  };

  var numComplaints : Nat = 0;
  let assignedRoles : HashMap.HashMap<Principal, Role> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let userList : HashMap.HashMap<Principal, User> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let policeList : HashMap.HashMap<Principal, Police> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let roleRequests : HashMap.HashMap<Principal, (Role, Text)> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let complaintList : HashMap.HashMap<Nat, Complaint> = HashMap.HashMap(32, Nat.equal, Hash.hash);
  let complaintOwnership : HashMap.HashMap<Nat, [Principal]> = HashMap.HashMap(32, Nat.equal, Hash.hash);
  let keysList: HashMap.HashMap<Principal, Text> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let uploaderAESKeys: HashMap.HashMap<Text, EncKey> = HashMap.HashMap(32, Text.equal, Text.hash); // uploader's keys for a file
  let userAESKeys: HashMap.HashMap<Principal, [UserCIDKey]> = HashMap.HashMap(32, Principal.equal, Principal.hash); // keys for files user has access to
  let userFileAccessRequests : HashMap.HashMap<Text, [Principal]> = HashMap.HashMap(32, Text.equal, Text.hash); // requests for each cid

  /************ ROLES HELPERS START *************/
  private func getRole(principal : Principal) : ?Role {
    return assignedRoles.get(principal);
  };
  private func textToRole(role : Text) : Role {
    var actualRole : Role = #general;
    switch (role) {
      case ("user") {
        actualRole := #complainant;
      };
      case ("investigator") {
        actualRole := #investigator;
      };
      case ("owner") {
        actualRole := #investigator;
      };
      case ("admin") {
        actualRole := #administrator;
      };
      case ("administrator") {
        actualRole := #administrator;
      };
      case ("complainant") {
        actualRole := #complainant;
      };
      case (_) {
        actualRole := #general;
      };
    };
    return actualRole;
  };
  private func roleToText(role : Role) : Text {
    switch (role) {
      case (#administrator) {
        return "admin";
      };
      case (#investigator) {
        return "investigator";
      };
      case (#complainant) {
        return "complainant";
      };
      case (#general) {
        return "general";
      };
    };
  };
  private func requestRole(principal : Principal, role : Text, aadhaarNum: Text) : () {
    let actualRole = textToRole(role);
    roleRequests.put(principal, (actualRole, aadhaarNum));
    switch (roleRequests.get(principal)) {
      case (null) {
        Debug.print("No role requests");
      };
      case (?req) {
        Debug.print("Role requests " # roleToText(req.0));
      };
    };
  };
  private func assignRole(principal : Principal, role : Text) : () {
    roleRequests.delete(principal);
    let actualRole = textToRole(role);
    assignedRoles.put(principal, actualRole);
  };
  private func deferRole(principal : Principal, role : Text) : () {
    roleRequests.delete(principal);
  };
  /************** ROLES HELPERS END **************/

  /************* COMPLAINT HELPERS START ***************/
  private func transferActiveCases(oldPrincipal : ?Principal, newPrincipal : Principal, complaintId : Nat) : async Bool {
    try {
      var oldPolice : ?Police = null;
      switch (oldPrincipal) {
        case (?value) {
          oldPolice := policeList.get(value);
          switch (oldPolice) {
            case (?oldP) {
              var oldPoliceComplaints = oldP.activeComplaints;
              oldPoliceComplaints := Array.filter(oldPoliceComplaints, func(complaint : Nat) : Bool { complaint != complaintId });
              var newPolice : Police = {
                name = oldP.name;
                designation = oldP.designation;
                stationCode = oldP.stationCode;
                stationAddress = oldP.stationAddress;
                mobileNum = oldP.mobileNum;
                numSolvedCases = oldP.numSolvedCases;
                numUnsolvedCases = oldP.numUnsolvedCases;
                activeComplaints = oldPoliceComplaints;
              };
              policeList.put(value, newPolice);
            };
            case (null) {};
          };
        };
        case (null) {};
      };

      var newPolice = policeList.get(newPrincipal);
      switch (newPolice) {
        case (?newP) {
          var newPoliceComplaints = Array.append<Nat>(newP.activeComplaints, [complaintId]);
          var newPolice : Police = {
            name = newP.name;
            designation = newP.designation;
            numSolvedCases = newP.numSolvedCases;
            numUnsolvedCases = newP.numUnsolvedCases;
            stationCode = newP.stationCode;
            stationAddress = newP.stationAddress;
            mobileNum = newP.mobileNum;
            activeComplaints = newPoliceComplaints;
          };
          policeList.put(newPrincipal, newPolice);
        };
        case (null) {};
      };
    }
    catch(err){return false;};
    return true;
  };
  private func transferEvidenceOwnership(principal : Principal, complaintId : Nat) : async Bool {
    // principal of new investigator
    try {
      var complaint = complaintList.get(complaintId);
      switch(complaint) {
        case null { return false; };
        case (?oldComplaint) {
          var newComplaint = {
            title = oldComplaint.title;
            summary = oldComplaint.summary;
            FIR = oldComplaint.FIR;
            chargesheet = oldComplaint.chargesheet;
            closureReport = oldComplaint.closureReport;
            date = oldComplaint.date;
            evidence = oldComplaint.evidence;
            location = oldComplaint.location;
            status = oldComplaint.status;
            typee = "cognizable";
            complainantPrincipal = oldComplaint.complainantPrincipal;
            updatedOn = Time.now();
            investigatorPrincipal = principal;
            FIRDate = oldComplaint.FIRDate;
            chargesheetDate = oldComplaint.chargesheetDate;
            closureReportDate = oldComplaint.closureReportDate;
          };
          complaintList.put(complaintId, newComplaint);
        };
      };
      var pastOwners = complaintOwnership.get(complaintId);
      switch (pastOwners) {
        case (null) {
          complaintOwnership.put(complaintId, [principal]);
          Debug.print("assigned case ownership");
          return true;
          // return await transferActiveCases(null, principal, complaintId);
        };
        case (?arr) {
          var numOwners = arr.size();
          var latestOwner = arr[numOwners -1];
          // var result: Bool = await transferActiveCases(?latestOwner, principal, complaintId);
          // if(result!=false) return false;
          let newArray = Array.append<Principal>(arr, [principal]);
          complaintOwnership.put(complaintId, newArray);
          Debug.print("transferred case ownership");
          return true;
        };
      };
    } catch(err) {
      Debug.print("error while transfering ownership");
      return false;
    };
  };


  private func textToStatusVariant(status: Text): StatusText {
    switch(status) {
      case ("firregisteration") {
        return #firregisteration;
      };
      case ("investigation") {
        return #investigation;
      };
      case ("finalreportfiling") {
        return #finalreportfiling;
      };
      case ("solved") {
        return #solved;
      };
      case ("unsolved") {
        return #unsolved;
      };
      case (_) {
        return #firregisteration;
      };
    };
  };
  private func getCurrentIncharge(complaintId: Nat) : Police {
    var police = complaintOwnership.get(complaintId);
    switch(police) {
      case null {return getDummyPolice();};
      case (?policePrincipals) {
        let principal = policePrincipals[policePrincipals.size()-1];
        let currentPolice = policeList.get(principal);
        switch(currentPolice) {
          case null {return getDummyPolice();};
          case (?pol) {return pol;}
        }
      }
    }
  };
  private func getComplaintOwnershipHistoryPriv(complaintId: Nat) : [Police] {
    var owners = complaintOwnership.get(complaintId);
    switch (owners) {
      case null {
        return [getDummyPolice()];
      };
      case (?ownerPrincipals) {
        var ownersObjects = getPoliceFromPrincipals(ownerPrincipals);
        return ownersObjects;
      };
    };
  };
  /************** COMPLAINT HELPERS END ***********/

  /************** PERMISSION HELPERS START ***********/
  private func canAddComplaint(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#complainant or ?#administrator) return true;
      case (_) return false;
    };
  };
  private func canCreateEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#investigator or ?#administrator) return true;
      case (_) return false;
    };
  };
  private func canModifyEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#investigator or ?#administrator) return true;
      case (_) return false;
    };
  };
  private func canViewEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#complainant or ?#investigator or ?#administrator) return true;
      case (_) return false;
    };
  };
  private func canTransferEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#investigator or ?#administrator) return true;
      case (_) return false;
    };
  };
  private func canAssignRole(principal: Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#administrator) return true;
      case (_) return false;
    };
  };
  private func canQueryAllData(principal: Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#administrator) return true;
      case (_) return false;
    };
  };
  private func doesUserHaveFileAccess(caller: Principal, cid: Text): Bool {
    let allFilesWithAccess = userAESKeys.get(caller);
    switch(allFilesWithAccess) {
      case (null) {return false;};
      case (?files) {
        for (idx in Iter.range(0, files.size() -1)) {
          let currFile = files[idx];
          if(currFile.cid == cid) {
            return true;
          }
        };
        return false;
      };
    };
  };
  private func getFileAccessKeys(caller: Principal, cid: Text): UserCIDKey {
    let allFilesWithAccess = userAESKeys.get(caller);
    switch(allFilesWithAccess) {
      case (null) {return {cid = ""; aesKey = ""; aesIV = "";};};
      case (?files) {
        for (idx in Iter.range(0, files.size() -1)) {
          let currFile = files[idx];
          if(currFile.cid == cid) {
            return currFile;
          }
        };
        return {cid = ""; aesKey = ""; aesIV = "";};
      };
    };

  };
  private func isFileOwner(caller: Principal, cid: Text): Bool {
    var ownerPrincipal: ?EncKey = uploaderAESKeys.get(cid);
    switch(ownerPrincipal) {
      case(null) {return false;};
      case(?owner) {
        if(owner.principal == caller) {
          Debug.print(Principal.toText(caller) # "Is file owner");
          return true;
        } else {
          return false;
        }
      };
    }
  };
  /************** PERMISSION HELPERS END ***********/

  /************** RESPONSE HELPERS *****************/
  private func getDummyUser() : User {
    return {
      name = "no-data";
      address = "";
      complaints = [0];
      mobileNum = "";
      emailID = "";
    };
  };

  private func getDummyPolice(): Police {
    return {
      name = "no-police";
      designation = "na";
      activeComplaints = [0];
      numSolvedCases = 0;
      numUnsolvedCases = 0;
      stationCode = "";
      stationAddress = "";
      mobileNum = "";
    };
  };
  private func getPoliceFromPrincipals(principals: [Principal]) : [Police] {
    var polices: [Police] = [] ;
    for (idx in Iter.range(0, principals.size() -1)) {
      var police: ?Police = policeList.get(principals[idx]);
      switch(police) {
        case null {};
        case (?p) {
          polices := Array.append<Police>(polices, [p]);
        };
      };
    };
    return polices;
  };
  private func getUserFromPrincipals(principals: [Principal]) : [User] {
    var users : [User] = [];
    for (idx in Iter.range(0, principals.size() -1)) {
      var user : ?User = userList.get(principals[idx]);
      switch (user) {
        case null {};
        case (?u) {
          users := Array.append<User>(users, [u]);
        };
      };
    };
    return users;
  };
  private func getDummyComplaintView(): ComplaintViewModel {
    return {    
      title = "nodata";
      summary = "";
      date = "";
      location = "";
      typee = "";
      evidence = [""]; // CIDs
      status = #firregisteration;
      FIR = ""; // CID - step1
      chargesheet = ""; // CID
      closureReport = ""; // CID
      assignedStation = "";
      assignedStationCode = "";
      ownershipHistory = []; // TO
      complainantName = "";
      complainantPrincipal = "";
      investigatorPrincipal = "";
      complainantAddress = "";
      updatedOn = Time.now();
      FIRDate = Time.now();
      chargesheetDate= Time.now();
      closureReportDate = Time.now();
    };
  };
  private func convertPrincipalsToText(principals: [Principal]): [Text] {
    var textVariant:[Text] = [];
    for (idx in Iter.range(0, principals.size() -1)) {
      let currPrincipal = principals[idx];
      let textP = Principal.toText(principals[idx]);
      textVariant := Array.append<Text>(textVariant, [textP]);
    };

    return textVariant;
  };
  /*************************************************/

  /************** QUERY FUNCTIONS START ***********/
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
  public query ({ caller }) func isNewActor() : async (Bool, Text) {
    let isUser:?User = userList.get(caller);
    let isPolice:?Police = policeList.get(caller);

    switch(isUser) {
      case (null) {
        switch(isPolice) {
          case (null) {return (true, "");};
          case (?p) {return (false, "police");};
        };
      };
      case (?u) {
        return (false, "user");
      };
    };
  };
  public query ({ caller }) func getUserDetails() : async [(Text, User)] {
    let dummyUser: User = {
      name = "";
      address= "";
      complaints=[];
      mobileNum = "";
      emailID = "";
    };
    switch (userList.get(caller)) {
      case (null) {
        return [("", dummyUser)];
      };
      case (?user) { 
        let principalText = Principal.toText(caller);
        return [(principalText, user)];        
       };
    };
  };
  public query ({ caller }) func viewComplaints() : async Text {
    let complaint = complaintList.get(numComplaints -1);
    switch (complaint) {
      case (null) { return "None yet" };
      case (?comp) { return comp.title };
    };
  };
  public query func getUnassignedComplaints() : async [(Nat, Complaint)] {
    var complaints = Iter.toArray<(Nat, Complaint)>(complaintList.entries());
    // Debug.print(Nat.toText(complaints[0].0) # complaints[0].1.title);
    return complaints;
  };
  public query ({ caller }) func getUserComplaints() : async [(Nat, Complaint)] {
    let userComplaints : HashMap.HashMap<Nat, Complaint> = HashMap.HashMap(32, Nat.equal, Hash.hash);
    let userObj : ?User = userList.get(caller);
    let dummyComplaint: Complaint = {
      title = "";
      summary = "";
      location = "";
      date = "";
      status = #firregisteration;
      typee = "";
      evidence = [""];
      FIR = "NONE";
      chargesheet = "NONE";
      closureReport = "NONE";
      complainantPrincipal = caller;
      updatedOn=Time.now();
      investigatorPrincipal=caller;
      FIRDate = Time.now();
      chargesheetDate= Time.now();
      closureReportDate = Time.now();
    };
    let dummyComplaintId: Nat = 0;
    switch (userObj) {
      case (null) { return [(dummyComplaintId, dummyComplaint)] }; // 0 => unregistered user
      case (?user) {
        let userComplaintsIds : [Nat] = user.complaints;
        for (compId in Iter.range(0, userComplaintsIds.size() -1)) {
          let currComplaintId = userComplaintsIds[compId];
          let currComplaint = complaintList.get(currComplaintId);
          switch (currComplaint) {
            case (null) {};
            case (?currComplaint) {
              userComplaints.put(currComplaintId, currComplaint);
            };
          };
        };
        return Iter.toArray<(Nat, Complaint)>(userComplaints.entries());
      };
    };
  };
  public query func getRoleRequests() : async [(Principal, (Role, Text))] {
    return Iter.toArray<(Principal, (Role, Text))>(roleRequests.entries());
  };
  public query func getUsers() : async [User] {
    return Iter.toArray<User>(userList.vals());
  };
  public query func getPolice(): async [Police] {
    return Iter.toArray<Police>(policeList.vals());
  };
  public query func getComplaintOwnershipHistory(complaintId : Nat) : async [Police] {
    return getComplaintOwnershipHistoryPriv(complaintId);
  };
  public query func getPublicKeyByPrincipal(principalText: Text): async Text {
    let principal: Principal = Principal.fromText(principalText);
    let pubKey = keysList.get(principal);
    switch(pubKey) {
      case (null) {
        return "null";
      };
      case (?pKey) {
        return pKey;
      };
    };
  };
  public query func getDetailedComplaintInfoByComplaintId(complaintId: Nat) : async ComplaintViewModel {
    var complaintInfo: ?Complaint = complaintList.get(complaintId);
    bool isCaseStillActive = vebTree.isPartOf(complaintId);
    if (!isCaseStillActive) return;
    switch(complaintInfo) {
      case null {
        return getDummyComplaintView();
      };
      case (?info) {
        var ownershipHistory: [Principal] = [];
        var ownershipHistory1 = complaintOwnership.get(complaintId);
        switch(ownershipHistory1) {
          case null { };
          case (?oh) { ownershipHistory := oh; };
        };
        var complainant: ?User = userList.get(info.complainantPrincipal);
        var complainantName = "";
        var complainantAddress = "";
        switch(complainant) {
          case null {};
          case (?user) {
            complainantName := user.name;  
            complainantAddress := user.address;
          };
        };
        var complaintView: ComplaintViewModel  = {
          FIR = info.FIR;
          chargesheet = info.chargesheet;
          closureReport = info.closureReport;
          assignedStation = "";
          assignedStationCode = "";
          investigatorPrincipal = Principal.toText(info.investigatorPrincipal);
          date = info.date;
          evidence = info.evidence;
          location = info.location;
          status = info.status;
          ownershipHistory = ownershipHistory;
          summary = info.summary;
          typee = info.typee;
          title = info.title;
          complainantName = complainantName;
          complainantAddress = complainantAddress;
          complainantPrincipal = Principal.toText(info.complainantPrincipal);
          updatedOn = info.updatedOn;
          FIRDate = info.FIRDate;
          chargesheetDate= info.chargesheetDate;
          closureReportDate = info.closureReportDate;
        };    
        return complaintView;    
      };
    };
  };

public query func getDetailedComplaintInfoVebByComplaintId(complaintId: Nat) : async ComplaintViewModel {
    var complaintInfo: ?Complaint = complaintList.get(complaintId);
    switch(complaintInfo) {
      case null {
        return getDummyComplaintView();
      };
      case (?info) {
        var ownershipHistory: [Principal] = [];
        var ownershipHistory1 = complaintOwnership.get(complaintId);
        switch(ownershipHistory1) {
          case null { };
          case (?oh) { ownershipHistory := oh; };
        };
        var complainant: ?User = userList.get(info.complainantPrincipal);
        var complainantName = "";
        var complainantAddress = "";
        switch(complainant) {
          case null {};
          case (?user) {
            complainantName := user.name;  
            complainantAddress := user.address;
          };
        };
        var complaintView: ComplaintViewModel  = {
          FIR = info.FIR;
          chargesheet = info.chargesheet;
          closureReport = info.closureReport;
          assignedStation = "";
          assignedStationCode = "";
          investigatorPrincipal = Principal.toText(info.investigatorPrincipal);
          date = info.date;
          evidence = info.evidence;
          location = info.location;
          status = info.status;
          ownershipHistory = ownershipHistory;
          summary = info.summary;
          typee = info.typee;
          title = info.title;
          complainantName = complainantName;
          complainantAddress = complainantAddress;
          complainantPrincipal = Principal.toText(info.complainantPrincipal);
          updatedOn = info.updatedOn;
          FIRDate = info.FIRDate;
          chargesheetDate= info.chargesheetDate;
          closureReportDate = info.closureReportDate;
        };    
        return complaintView;    
      };
    };
  };
  public query ({caller}) func getEncAESKeyForDecryption(cid: Text): async UserCIDKey {
    let doesUserHaveKey = doesUserHaveFileAccess(caller, cid);
    if(doesUserHaveKey) {
      let userKeys = getFileAccessKeys(caller, cid);
      return userKeys;
    } else {
      return {cid = ""; aesKey = ""; aesIV = "";};
    }
  };
  public query ({ caller }) func hasRequestedAccessForCID(cid: Text) : async Bool {
    var requestsForCID = userFileAccessRequests.get(cid);
    switch(requestsForCID) {
      case null {
        return false;
      };
      case (?requestedUsers) {
        for (idx in Iter.range(0, requestedUsers.size() -1)) {
          let user = requestedUsers[idx];
          if(user == caller) {
            return true;
          }
        };
        return false;
      };
    };
  };
  public query ({ caller }) func getFileAccessRequests(cid: Text) : async [(Text, FileRequestor)] {
    var dummyUsers: [(Text, FileRequestor)] = [("", {category="";name=""})];
    // let isOwner = isFileOwner(caller, cid);
    // if(isOwner) {
      var requestsForCID: ?[Principal] = userFileAccessRequests.get(cid);
      switch(requestsForCID) {
        case(null) {
          Debug.print("No requests for file with cid "#cid);
          return [];
        };
        case(?requests) {
          var userPrincipalList: HashMap.HashMap<Text, FileRequestor> = HashMap.HashMap(32, Text.equal, Text.hash);
          Debug.print("Number of requests for "#cid#" : "#Nat.toText(requests.size()));
          for (idx in Iter.range(0, requests.size() -1)) {
            let userPrincipal: Principal = requests[idx];
            let userObj = userList.get(userPrincipal);
            let polObj = policeList.get(userPrincipal);
            let principalText = Principal.toText(userPrincipal);
            switch(userObj) {
              case null {
                switch(polObj) {
                  case null { Debug.print("User object is null"); };
                  case (?pol) { 
                    userPrincipalList.put(principalText, {category="police";name=pol.name});
                  };
                };
              };
              case(?user) {
                userPrincipalList.put(principalText, {category = "complainant"; name = user.name});
                Debug.print("Added user "#principalText#" to list");
              };
            };
          };

          return Iter.toArray<(Text, FileRequestor)>(userPrincipalList.entries()); // length == 0, no data but user is owner , len >= 1, owner and data exist
        };
      };
    // } else {
    //   return dummyUsers; // length == 1, not owner;
    // }
  };
  public query func getFileAccessRequestsToTest(cid: Text) : async [Text] {
    let principals = userFileAccessRequests.get(cid);
    switch(principals) {
      case null {return []};
      case (?p) {
        return convertPrincipalsToText(p);
      }
    }
  };
  public query ({ caller }) func isInvestigatorForComplaint(complaintId: Nat) : async Bool {
    var police = policeList.get(caller);
    switch(police) {
      case null { return false ;};
      case (?pol) {
        var ownershipHistory: ?[Principal] = complaintOwnership.get(complaintId);
        switch(ownershipHistory) {
          case (null) {return false;};
          case (?history) {
            var currentIncharge: Principal = history[history.size()-1];
            if(currentIncharge == caller) return true;
          };
        };        
        return false;
      };
    };
    return false;
  };
  public query ({ caller }) func getFileOwnerAsPrincipal(cid: Text): async Text {
    var fileOwner = uploaderAESKeys.get(cid);
    switch(fileOwner) {
      case null {
        return "";
      };
      case (?owner) {
        var principal = owner.principal;
        return Principal.toText(principal);
      };
    } 
  };

  public query ({caller}) func queryAllData() : async AllData {
    assert(canQueryAllData(caller));
    return {
      userList = Iter.toArray<(Principal, User)>(userList.entries());
      assignedRoles = Iter.toArray<(Principal, Role)>(assignedRoles.entries());
      policeList = Iter.toArray<(Principal, Police)>(policeList.entries());
      roleRequests = Iter.toArray<(Principal, (Role, Text))>(roleRequests.entries());
      complaintList = Iter.toArray<(Nat, Complaint)>(complaintList.entries());
      complaintOwnership = Iter.toArray<(Nat, [Principal])>(complaintOwnership.entries());
      keysList = Iter.toArray<(Principal, Text)>(keysList.entries());
      uploaderAESKeys = Iter.toArray<(Text, EncKey)>(uploaderAESKeys.entries());
      userAESKeys = Iter.toArray<(Principal, [UserCIDKey])>(userAESKeys.entries());
      userFileAccessRequests = Iter.toArray<(Text, [Principal])>(userFileAccessRequests.entries());
    };
  };
  /************** QUERY FUNCTIONS END ***********/

  /************** UPDATE FUNCTIONS END ***********/
  public shared ({ caller }) func addUser(name : Text, role : Text, address : Text, mobileNum: Text, emailID: Text, aadhaarNum: Text, publicKey: Text) : async Text {
    // requestRole(caller, role);
    keysList.put(caller, publicKey);
    let actualRole = textToRole(role);
    roleRequests.put(caller, (actualRole, aadhaarNum));    
    userList.put(caller, { name = name; complaints = []; address = address ; mobileNum = mobileNum ; emailID = emailID});
    switch (userList.get(caller)) {
      case (null) {
        return "Error while creating user";
      };
      case (_) {
        return "Hii " # name # ", User with principal " # Principal.toText(caller) # " has been created!";
      };
    };
  };
  public shared ({ caller }) func addPolice(name : Text, designation : Text, role : Text,stationAddress: Text, stationCode: Text, mobileNum :Text, publicKey: Text) : async Text {
    // requestRole(caller, role);
    keysList.put(caller, publicKey);
    let actualRole = textToRole(role);
    roleRequests.put(caller, (actualRole, ""));
    policeList.put(caller, { name = name; designation = designation; activeComplaints = []; numSolvedCases = 0; numUnsolvedCases = 0 ; stationAddress = stationAddress; stationCode = stationCode; mobileNum = mobileNum; });
    return "Hii " # name # ", Police with principal " # Principal.toText(caller) # " has been created!";
  };
  public shared ({ caller }) func addComplaint(compId: Nat, title : Text, summary : Text, location : Text, date : Text) : async Bool {
    let mlResult = "Cognizable";
    var finalResult : Bool = false;
    vebTree.add(compId);
    var user = userList.get(caller);
    switch (user) {
      case (null) { finalResult := false };
      case (?obj) {
        var oldComplaints : [Nat] = obj.complaints;
        var currTime = Time.now();
        numComplaints := numComplaints +1;
        complaintList.put(
          compId,
          {
            title = title;
            summary = summary;
            location = location;
            date = date;
            status = #firregisteration;
            typee = mlResult;
            evidence = [""];
            FIR = "NONE";
            chargesheet = "NONE";
            closureReport = "NONE";
            complainantPrincipal = caller;
            updatedOn = Time.now();
            investigatorPrincipal=caller;
            FIRDate = Time.now();
            chargesheetDate= Time.now();
            closureReportDate = Time.now();
          },
        );
        oldComplaints := Array.append(oldComplaints, [compId]);
        var newUser : User = {
          name = obj.name;
          address = obj.address;
          complaints = oldComplaints;
          mobileNum = obj.mobileNum;
          emailID = obj.emailID;
        };
        userList.put(caller, newUser);
        finalResult := true;
      };
    };
    return finalResult;
  };
  public shared ({ caller }) func setRole(principal: Principal, role: Text) {
    roleRequests.delete(principal);
    let actualRole = textToRole(role);
    assignedRoles.put(principal, actualRole);
  };
  public shared ({ caller }) func transferOwnershipTo(complaintId : Nat, newPolice: Text) : async Bool {
    if(canTransferEvidence(caller)) {
    return await transferEvidenceOwnership(Principal.fromText(newPolice), complaintId);
    };
    // return false;
    // try {
    //   var pastOwners = complaintOwnership.get(complaintId);
    //   switch (pastOwners) {
    //     case (null) {
    //       complaintOwnership.put(complaintId, [Principal.fromText(newPolice)]);
    //       Debug.print("assigned case ownership");
    //       return true;
    //       // return await transferActiveCases(null, principal, complaintId);
    //     };
    //     case (?arr) {
    //       // var result: Bool = await transferActiveCases(?latestOwner, principal, complaintId);
    //       // if(result!=false) return false;
    //       let newArray = Array.append<Principal>(arr, [Principal.fromText(newPolice)]);
    //       complaintOwnership.put(complaintId, newArray);
    //       Debug.print("transferred case ownership");
    //       return true;
    //     };
    //   };
    // } catch(err) {
    //   Debug.print("error while transfering ownership");
    //   return false;
    // };

  };
  public shared ({ caller }) func updateComplaintStatus(complaintId: Nat, status: Text) : async Bool {
    var variantStatus = status;
    var reqComplaint = complaintList.get(complaintId);
    switch(reqComplaint) {
      case null {
        return false;
      };
      case (?oldComplaint) {
        try {
          var newComplaint:Complaint = {
            title = oldComplaint.title;
            summary = oldComplaint.summary;
            FIR = oldComplaint.FIR;
            chargesheet = oldComplaint.chargesheet;
            closureReport = oldComplaint.closureReport;
            date = oldComplaint.date;
            evidence = oldComplaint.evidence;
            location = oldComplaint.location;
            status = textToStatusVariant(status);
            typee = "cognizable";
            complainantPrincipal = oldComplaint.complainantPrincipal;
            updatedOn = Time.now();
            investigatorPrincipal=oldComplaint.investigatorPrincipal;
            FIRDate = oldComplaint.FIRDate;
            chargesheetDate= oldComplaint.chargesheetDate;
            closureReportDate = oldComplaint.closureReportDate;
          };
          complaintList.put(complaintId, newComplaint);
          return true;
        }
        catch(err) { return false ; }
      };
    }
  };
  public shared ({ caller }) func addEvidence(complaintId: Nat, fileCID: Text, encAESKey: Text, AESiv: Text): async Bool {
    // add CID to complaint
    // add uploader, aes key, aes iv to uploaderAESKeys
    // add key to uploaders access keys
    var complaintObj = complaintList.get(complaintId);
    switch(complaintObj) {
      case(null) { return false; };
      case(?oldComplaint) { 
        try {
          var evidences = oldComplaint.evidence;
          evidences := Array.append<Text>(evidences, [fileCID]);
          var newComplaint: Complaint = {
            title = oldComplaint.title;
            summary = oldComplaint.summary;
            date = oldComplaint.date;
            location = oldComplaint.location ;
            typee = oldComplaint.typee ;
            evidence = evidences; // CIDs
            status = oldComplaint.status;
            FIR = oldComplaint.FIR ;// CID - step1
            chargesheet = oldComplaint.chargesheet; // CID
            closureReport = oldComplaint.closureReport; // CID
            complainantPrincipal = oldComplaint.complainantPrincipal;
            updatedOn = Time.now();
            investigatorPrincipal = oldComplaint.investigatorPrincipal;
            FIRDate = oldComplaint.FIRDate;
            chargesheetDate= oldComplaint.chargesheetDate;
            closureReportDate = oldComplaint.closureReportDate;
          };
          complaintList.put(complaintId, newComplaint);
          // OPTIMIZE : STORE ONLY UPLOADER PRINCIPAL AND GET CID FROM userKeys DS
          var uploadersKeys = uploaderAESKeys.put(fileCID, {
            principal = caller;
            aesKey = encAESKey;
            aesIV = AESiv;
          });

          var userKeys  = userAESKeys.get(caller);
          switch(userKeys) {
            case null {
              userAESKeys.put(caller, [{
                cid = fileCID;
                aesKey = encAESKey;
                aesIV = AESiv;
              }]);
            };
            case(?oldKeys) {
                var newKeys = Array.append<UserCIDKey>(oldKeys, [{
                  cid = fileCID;
                  aesKey = encAESKey;
                  aesIV = AESiv;
                }]);
                userAESKeys.put(caller, newKeys);
            }; 
          };
          return true;
        } catch(err) {
          Debug.print("Error occured while saving evidence for complaint " # Nat.toText(complaintId));
          return false;
        }
      };
    };
    return false;
  };
  public shared ({ caller }) func sendRequestAccessForCID(cid: Text) : async Bool {
    var existingRequests = userFileAccessRequests.get(cid);
    switch(existingRequests) {
      case null {
        userFileAccessRequests.put(cid, [caller]);
        return true;
      };
      case (?oldRequests) {
        var newRequests = Array.append<Principal>(oldRequests, [caller]);
        userFileAccessRequests.put(cid, newRequests);
        return true;
      };
    };
  };
  public shared ({ caller }) func provideAccessToFile(principalText: Text, cid: Text, newKey: Text) : async Bool {
    let principal = Principal.fromText(principalText);
    
    // let isOwner:Bool = isFileOwner(caller, cid);
    // if(isOwner) {
        var oldRequests = userFileAccessRequests.get(cid);
        switch (oldRequests) {
          case (?oldR) {
            var oldRequestorPrincipals:[Principal] = oldR;
            oldRequestorPrincipals := Array.filter(oldRequestorPrincipals, func(reqPrincipal : Principal) : Bool { reqPrincipal != principal });
            userFileAccessRequests.put(cid, oldRequestorPrincipals);
            let currKeys = userAESKeys.get(principal);
            switch(currKeys) {
              case null {
                userAESKeys.put(principal, [ {cid=cid ; aesKey=newKey ; aesIV="";} ]);
              };
              case (?keys) {
                var oldKeys:[UserCIDKey] = keys;
                oldKeys := Array.append<UserCIDKey>(oldKeys, [ {cid=cid ; aesKey=newKey ; aesIV="";} ]);
                userAESKeys.put(principal, oldKeys);
              };
            };
            return true;
          };
          case (null) {return false;};
        };
    // } else {
    //   return false;
    // }
  };
  public shared ({ caller }) func addFIR(complaintId: Nat, fileCID: Text, encAESKey: Text, AESiv: Text): async Bool {
    var complaintObj = complaintList.get(complaintId);
    switch(complaintObj) {
      case(null) { return false; };
      case(?oldComplaint) { 
        try {
          var newComplaint: Complaint = {
            title = oldComplaint.title;
            summary = oldComplaint.summary;
            date = oldComplaint.date;
            location = oldComplaint.location ;
            typee = oldComplaint.typee ;
            evidence = oldComplaint.evidence; // CIDs
            status = oldComplaint.status;
            FIR = fileCID ;// CID - step1
            chargesheet = oldComplaint.chargesheet; // CID
            closureReport = oldComplaint.closureReport; // CID
            FIRDate = Time.now();
            chargesheetDate = oldComplaint.chargesheetDate;
            closureReportDate = oldComplaint.closureReportDate;
            complainantPrincipal = oldComplaint.complainantPrincipal;
            updatedOn = Time.now();
            investigatorPrincipal = oldComplaint.investigatorPrincipal;
          };
          complaintList.put(complaintId, newComplaint);
          // OPTIMIZE : STORE ONLY UPLOADER PRINCIPAL AND GET CID FROM userKeys DS
          var uploadersKeys = uploaderAESKeys.put(fileCID, {
            principal = caller;
            aesKey = encAESKey;
            aesIV = AESiv;
          });

          var userKeys  = userAESKeys.get(caller);
          switch(userKeys) {
            case null {
              userAESKeys.put(caller, [{
                cid = fileCID;
                aesKey = encAESKey;
                aesIV = AESiv;
              }]);
            };
            case(?oldKeys) {
                var newKeys = Array.append<UserCIDKey>(oldKeys, [{
                  cid = fileCID;
                  aesKey = encAESKey;
                  aesIV = AESiv;
                }]);
                userAESKeys.put(caller, newKeys);
            }; 
          };
          return true;
        } catch(err) {
          Debug.print("Error occured while saving FIR for complaint " # Nat.toText(complaintId));
          return false;
        }
      };
    };
    return false;
  };
  public shared ({ caller }) func addChargesheet(complaintId: Nat, fileCID: Text, encAESKey: Text, AESiv: Text): async Bool {
    var complaintObj = complaintList.get(complaintId);
    switch(complaintObj) {
      case(null) { return false; };
      case(?oldComplaint) { 
        try {
          var newComplaint: Complaint = {
            title = oldComplaint.title;
            summary = oldComplaint.summary;
            date = oldComplaint.date;
            location = oldComplaint.location ;
            typee = oldComplaint.typee ;
            evidence = oldComplaint.evidence; // CIDs
            status = oldComplaint.status;
            FIR = oldComplaint.FIR ;// CID - step1
            chargesheet = fileCID; // CID
            closureReport = oldComplaint.closureReport; // CID
            complainantPrincipal = oldComplaint.complainantPrincipal;
            updatedOn = Time.now();
            FIRDate = oldComplaint.FIRDate;
            chargesheetDate = Time.now();
            closureReportDate = oldComplaint.closureReportDate;
            investigatorPrincipal = oldComplaint.investigatorPrincipal;
          };
          complaintList.put(complaintId, newComplaint);
          // OPTIMIZE : STORE ONLY UPLOADER PRINCIPAL AND GET CID FROM userKeys DS
          var uploadersKeys = uploaderAESKeys.put(fileCID, {
            principal = caller;
            aesKey = encAESKey;
            aesIV = AESiv;
          });

          var userKeys  = userAESKeys.get(caller);
          switch(userKeys) {
            case null {
              userAESKeys.put(caller, [{
                cid = fileCID;
                aesKey = encAESKey;
                aesIV = AESiv;
              }]);
            };
            case(?oldKeys) {
                var newKeys = Array.append<UserCIDKey>(oldKeys, [{
                  cid = fileCID;
                  aesKey = encAESKey;
                  aesIV = AESiv;
                }]);
                userAESKeys.put(caller, newKeys);
            }; 
          };
          return true;
        } catch(err) {
          Debug.print("Error occured while saving chargesheet for complaint " # Nat.toText(complaintId));
          return false;
        }
      };
    };
    return false;
  };
  public shared ({ caller }) func addClosureReport(complaintId: Nat, fileCID: Text, encAESKey: Text, AESiv: Text): async Bool {
    var complaintObj = complaintList.get(complaintId);
    switch(complaintObj) {
      case(null) { return false; };
      case(?oldComplaint) { 
        try {
          var newComplaint: Complaint = {
            title = oldComplaint.title;
            summary = oldComplaint.summary;
            date = oldComplaint.date;
            location = oldComplaint.location ;
            typee = oldComplaint.typee ;
            evidence = oldComplaint.evidence; // CIDs
            status = oldComplaint.status;
            FIR = oldComplaint.FIR ;// CID - step1
            chargesheet = oldComplaint.chargesheet; // CID
            closureReport = fileCID; // CID
            complainantPrincipal = oldComplaint.complainantPrincipal;
            updatedOn = Time.now();
            FIRDate = oldComplaint.FIRDate;
            chargesheetDate = oldComplaint.chargesheetDate;
            closureReportDate = Time.now();
            investigatorPrincipal = oldComplaint.investigatorPrincipal;
          };
          complaintList.put(complaintId, newComplaint);
          // OPTIMIZE : STORE ONLY UPLOADER PRINCIPAL AND GET CID FROM userKeys DS
          var uploadersKeys = uploaderAESKeys.put(fileCID, {
            principal = caller;
            aesKey = encAESKey;
            aesIV = AESiv;
          });

          var userKeys  = userAESKeys.get(caller);
          switch(userKeys) {
            case null {
              userAESKeys.put(caller, [{
                cid = fileCID;
                aesKey = encAESKey;
                aesIV = AESiv;
              }]);
            };
            case(?oldKeys) {
                var newKeys = Array.append<UserCIDKey>(oldKeys, [{
                  cid = fileCID;
                  aesKey = encAESKey;
                  aesIV = AESiv;
                }]);
                userAESKeys.put(caller, newKeys);
            }; 
          };
          return true;
        } catch(err) {
          Debug.print("Error occured while saving closure report for complaint " # Nat.toText(complaintId));
          return false;
        }
      };
    };
    return false;
  };
  




  /************** UPDATE FUNCTIONS END ***********/
};

/*(
  vec {
    record {
      0 : nat;
      record {
        FIR = "NONE";
        status = variant { firregisteration };
        title = "Tiger kills";
        typee = "Cognizable";
        date = "12/12/12 00:00:00z";
        closureReport = "NONE";
        summary = "Tiger kills 20 yr old in village";
        evidence = vec { "" };
        location = "firozabad";
        chargesheet = "NONE";
      };
    };
  },
)
*/

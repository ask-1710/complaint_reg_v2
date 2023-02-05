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

actor {
  
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
    complaints : [Nat];
  };
  // TODO: add stats, complaints solved, complaints pending, assigned, active, unsolved&inactive
  type Police = {
    name : Text;
    designation : Text;
    activeComplaints : [Nat];
    numSolvedCases : Nat;
    numUnsolvedCases : Nat;
  };
  // type PrincipalHistory = [Principal];
  var numComplaints : Nat = 0;
  let assignedRoles : HashMap.HashMap<Principal, Role> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let userList : HashMap.HashMap<Principal, User> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let policeList : HashMap.HashMap<Principal, Police> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let roleRequests : HashMap.HashMap<Principal, Role> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let complaintList : HashMap.HashMap<Nat, Complaint> = HashMap.HashMap(32, Nat.equal, Hash.hash);

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
  private func requestRole(principal : Principal, role : Text) : () {
    let actualRole = textToRole(role);
    roleRequests.put(principal, actualRole);
    switch (roleRequests.get(principal)) {
      case (null) {
        Debug.print("No role requests");
      };
      case (?req) {
        Debug.print("Role requests " # roleToText(req));
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

  /************** COMPLAINT HELPERS END ***********/

  /************** PERMISSION HELPERS START ***********/
  private func canAddComplaint(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#complainant) return true;
      case (_) return false;
    };
  };
  private func canCreateEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#investigator) return true;
      case (_) return false;
    };
  };
  private func canModifyEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#investigator) return true;
      case (_) return false;
    };
  };
  private func canViewEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#complainant or ?#investigator) return true;
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
  /************** PERMISSION HELPERS END ***********/

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
    let dummyComplaint = {
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
  public query func getRoleRequests() : async [(Principal, Role)] {
    return Iter.toArray<(Principal, Role)>(roleRequests.entries());
  };
  public query func getUsers() : async [User] {
    return Iter.toArray<User>(userList.vals());
  };
  public query func getPolice(): async [Police] {
    return Iter.toArray<Police>(policeList.vals());
  };
  /************** QUERY FUNCTIONS END ***********/

  /************** UPDATE FUNCTIONS END ***********/
  public shared ({ caller }) func addUser(name : Text, role : Text, address : Text) : async Text {
    // requestRole(caller, role);
    let actualRole = textToRole(role);
    roleRequests.put(caller, actualRole);    
    userList.put(caller, { name = name; complaints = []; address = address });
    switch (userList.get(caller)) {
      case (null) {
        return "Error while creating user";
      };
      case (_) {
        return "Hii " # name # ", User with principal " # Principal.toText(caller) # " has been created!";
      };
    };
  };
  public shared ({ caller }) func addPolice(name : Text, designation : Text, role : Text) : async Text {
    // requestRole(caller, role);
    let actualRole = textToRole(role);
    roleRequests.put(caller, actualRole);
    policeList.put(caller, { name = name; designation = designation; activeComplaints = []; numSolvedCases = 0; numUnsolvedCases = 0 });
    return "Hii " # name # ", Police with principal " # Principal.toText(caller) # " has been created!";
  };
  public shared ({ caller }) func addComplaint(title : Text, summary : Text, location : Text, date : Text) : async Bool {
    let mlResult = "Cognizable";
    var finalResult : Bool = false;
    var user = userList.get(caller);
    switch (user) {
      case (null) { finalResult := false };
      case (?obj) {
        var oldComplaints : [Nat] = obj.complaints;
        numComplaints := numComplaints +1;
        complaintList.put(
          numComplaints,
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
          },
        );
        oldComplaints := Array.append(oldComplaints, [numComplaints]);
        var newUser : User = {
          name = obj.name;
          address = obj.address;
          complaints = oldComplaints;
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

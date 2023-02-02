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
    date: Text;
    location: Text;
    typee : Text;
    evidence: [Text]; // CIDs
    status: StatusText;
    FIR: Text; // CID - step1
    chargesheet: Text; // CID
    closureReport: Text; // CID
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
    address: Text;
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
  private func roleToText(role: Role) : Text {
    switch(role) {
      case(#administrator) {
        return "admin";
      };
      case(#investigator) {
        return "investigator";
      };
      case(#complainant) {
        return "complainant";
      };
      case(#general) {
        return "general";
      };
    };
  };
  private func requestRole(principal : Principal, role : Text) : () {
    let actualRole = textToRole(role);
    roleRequests.put(principal, actualRole);
    switch(roleRequests.get(principal)) {
      case(null) {
        Debug.print("No role requests");
      };
      case(?req) {
        Debug.print("Role requests " # roleToText(req));
      };
    }
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
  /************** PERMISSION HELPERS END ***********/

  /************** QUERY FUNCTIONS START ***********/
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
  public query ({ caller }) func isNewActor() : async Bool {
    let isUser = userList.get(caller);
    let isPolice = policeList.get(caller);
    if (isUser != null or isPolice != null) {
      return false;
    } else {
      return true;
    };
  };
  public query ({ caller }) func getUserDetails() : async Text {
    switch(userList.get(caller)) {
      case(null) { return "No user with principal id " # Principal.toText(caller) ; };
      case(?user) { return user.name # " has PID " #  Principal.toText(caller) ; };
    };
  };
  public query ({ caller }) func viewComplaints(): async Text {
    let complaint =  complaintList.get(numComplaints-1) ;
    switch(complaint) {
      case(null) { return "None yet"  };
      case(?comp) {  return comp.title };
    };
  };
  public query func getUnassignedComplaints(): async [(Nat, Complaint)] {
    var complaints = Iter.toArray<(Nat, Complaint)>(complaintList.entries());
    // Debug.print(Nat.toText(complaints[0].0) # complaints[0].1.title);
    return complaints;
  };
  /************** QUERY FUNCTIONS END ***********/

  /************** UPDATE FUNCTIONS END ***********/
  public shared ({ caller }) func addUser(name : Text, role : Text, address: Text) : async Text {
    requestRole(caller, role);
    userList.put(caller, { name = name; complaints = [] ; address = address ;});
    switch(userList.get(caller)) {
      case(null) {
        return "Error while creating user";
      };
      case(_) {
        return "Hii " # name # ", User with principal " # Principal.toText(caller) # " has been created!";
      };
    };
  };
  public shared ({ caller }) func addPolice(name : Text, designation : Text, role : Text) : async Text {
    requestRole(caller, role);
    policeList.put(caller, { name = name; designation = designation; activeComplaints = []; numSolvedCases = 0; numUnsolvedCases = 0 });
    return "Hii " # name # ", Police with principal " # Principal.toText(caller) # " has been created!";
  };
  public shared ({ caller }) func addComplaint(title: Text, summary: Text, location: Text, date: Text): async Bool {
    let mlResult = "Cognizable";
    var finalResult: Bool = false;
    var user = userList.get(caller);
    switch(user) {
      case(null) { finalResult := false; };
      case(?obj) {
            var oldComplaints:[Nat] = obj.complaints;
            complaintList.put(numComplaints, {
              title = title;
              summary = summary;
              location = location ;
              date = date ;
              status = #firregisteration;
              typee = mlResult;
              evidence = [""];
              FIR = "NONE";
              chargesheet = "NONE";
              closureReport = "NONE";
            });
            oldComplaints := Array.append(oldComplaints, [numComplaints]);
            numComplaints := numComplaints+1;
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
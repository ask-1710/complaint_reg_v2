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

actor {

  type Complaint = {
    title : Text;
    description : Text;
    typee : Text;
  };

  public type Role = {
    #administrator; // establish accounts for each user setMember()
    #owner; // current custodian of documents, tranferOwnership(), modifyEvidence()
    #creator;
    #complainant; // getEvidence(), createEvidence()
    #general;
  };

  type ComplaintQueue = [Nat];
  // stats like number of complaints,
  type User = {
    name : Text;
    complaints : ComplaintQueue;
  };
  // TODO: add stats, complaints solved, complaints pending, assigned, active, unsolved&inactive
  type Police = {
    name : Text;
    designation : Text;
    activeComplaints : ComplaintQueue;
    numSolvedCases : Nat32;
    numUnsolvedCases : Nat32;
  };
  // type PrincipalHistory = [Principal];
  var numComplaints : Nat32 = 0;
  let assignedRoles : HashMap.HashMap<Principal, Role> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let userList : HashMap.HashMap<Principal, User> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let policeList : HashMap.HashMap<Principal, Police> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let roleRequests : HashMap.HashMap<Principal, Role> = HashMap.HashMap(32, Principal.equal, Principal.hash);

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
        actualRole := #creator;
      };
      case ("owner") {
        actualRole := #owner;
      };
      case (_) {
        actualRole := #general;
      };
    };
    return actualRole;
  };
  private func requestRole(principal : Principal, role : Text) : () {
    let actualRole = textToRole(role);
    roleRequests.put(principal, actualRole);
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
      case (?#complainant or ?#creator) return true;
      case (_) return false;
    };
  };
  private func canModifyEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#owner) return true;
      case (_) return false;
    };
  };
  private func canViewEvidence(principal : Principal) : Bool {
    let role = getRole(principal);
    switch (role) {
      case (?#complainant or ?#owner or ?#creator) return true;
      case (_) return false;
    };
  };
  private func canTransferEvidence(principal : Principal) : Bool {
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
  public query ({ caller }) func isNewActor() : async Bool {
    let isUser = userList.get(caller);
    let isPolice = policeList.get(caller);
    if (isUser != null or isPolice != null) {
      return false;
    } else {
      return true;
    };
  };
  public query ({ caller }) func addUser(name : Text, role : Text) : async Text {
    requestRole(caller, role);
    userList.put(caller, { name = name; complaints = [] });
    return "Hii " # name # ", User with principal " # Principal.toText(caller) # " has been created!";
  };
  public query ({ caller }) func addPolice(name : Text, designation : Text, role : Text) : async Text {
    requestRole(caller, role);
    policeList.put(caller, { name = name; designation = designation; activeComplaints = []; numSolvedCases = 0; numUnsolvedCases = 0 });
    return "Hii " # name # ", Police with principal " # Principal.toText(caller) # " has been created!";
  };
  public query ({ caller }) func getUserDetails() : async () {};

  /************** QUERY FUNCTIONS END ***********/

  /************** DATA TRANSFER FUNCTIONS END ***********/

  /************** DATA TRANSFER FUNCTIONS END ***********/

};

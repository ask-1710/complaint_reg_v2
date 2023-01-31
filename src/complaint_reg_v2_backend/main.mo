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
  
  let userList : HashMap.HashMap<Principal, User> = HashMap.HashMap(32, Principal.equal, Principal.hash);
  let policeList : HashMap.HashMap<Principal, Police> = HashMap.HashMap(32, Principal.equal, Principal.hash);

  /************ ROLES HELPERS START *************/
  
  /************** ROLES HELPERS END **************/

  /************* COMPLAINT HELPERS START ***************/
  
  /************** COMPLAINT HELPERS END ***********/

  /************** PERMISSION HELPERS START ***********/
  
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
  
  /************** QUERY FUNCTIONS END ***********/

  /************** DATA TRANSFER FUNCTIONS END ***********/
  public shared ({ caller }) func addUser(name : Text, role : Text) : async Text {
    userList.put(caller, { name = name; complaints = [] });
    return "Hii " # name # ", User with principal " # Principal.toText(caller) # " has been created!";
  };

  public shared ({ caller }) func addPolice(name : Text, designation : Text, role : Text) : async Text {
    policeList.put(caller, { name = name; designation = designation; activeComplaints = []; numSolvedCases = 0; numUnsolvedCases = 0 });
    return "Hii " # name # ", Police with principal " # Principal.toText(caller) # " has been created!";
  };

  public shared ({ caller }) func getUserDetails() : async () {};
  /************** DATA TRANSFER FUNCTIONS END ***********/

};

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


actor {
  
  let userCanisterMapping : HashMap.HashMap<Principal, (Nat, Text)> = HashMap.HashMap(32, Principal.equal, Principal.hash); // maps user principal to canister num
  var canisterNum = 0;
  

    /*************************** HASHED CANISTER CALL ****************************/

    // QUERY CALLS
    public query func isNewActor(caller: Text) : async (Bool, Text) {
        // get which canister and  call their function
        let canister = userCanisterMapping.get(Principal.fromText(caller));

        switch(canister) {
          case (null) {
              return (true, "");
          };
          case (?canister) {
            return  (false, canister.1);
          };
        };
    };

    public shared func mapUserToCanister(caller: Text, userType: Text): async Nat {
      canisterNum := (canisterNum+1) % 3;
      userCanisterMapping.put(Principal.fromText(caller), (canisterNum, userType));
      return canisterNum;
    };

    public query func getCanisterByUserPrincipal(principal: Text): async Nat {
      let num = userCanisterMapping.get(Principal.fromText(principal));
      switch(num) {
        case(null) {
          return 0;
        };
        case (?n) {
          return n.0;
        };
      }

      
    }

    /*************************** HASHED CANISTER CALL ****************************/
};
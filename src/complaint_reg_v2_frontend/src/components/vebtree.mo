module VebTree {

    public class VebTree {

        private var min : ?Nat;
        private var max : ?Nat;
        private var sqrtSize : Nat;
        private var summary : ?VebTree;
        private var clusters : [?VebTree];

        public func construct() : VebTree {
            return {
                min = null;
                max = null;
                sqrtSize = 0;
                summary = null;
                clusters = [];
            };
        };

        public func isPartOf(x : Nat) : Bool {
            if (x == min or x == max) {
                return true;
            } else if (sqrtSize == 0) {
                return false;
            } else {
                let i = x / sqrtSize;
                let j = x % sqrtSize;
                if (clusters[i] == null) {
                    return false;
                } else {
                    return clusters[i].isPartOf(j);
                };
            };
        };

        public func add(x : Nat) : VebTree {
            if (min == null) {
                min = max = x;
            } else {
                if (x < min) {
                    let tmp = x;
                    x = min;
                    min = tmp;
                };
                if (sqrtSize > 0) {
                    let i = x / sqrtSize;
                    let j = x % sqrtSize;
                    if (clusters[i] == null) {
                        clusters[i] = VebTree.construct();
                        summary = summary.add(i);
                    };
                    clusters[i] = clusters[i].add(j);
                };
                if (x > max) {
                    max = x;
                };
            };
            return this;
        };

        public func delete(x : Nat) : ?VebTree {
            if (min == max) {
                if (x == min) {
                    min = max = null;
                    return null;
                } else {
                    return this;
                };
            } else if (sqrtSize == 0) {
                if (x == min) {
                    min = max;
                } else {
                    max = min;
                };
                return this;
            } else {
                if (x == min) {
                    let firstCluster = summary!.min!;
                    x = firstCluster * sqrtSize + clusters[firstCluster]!.min!;
                    min = x;
                };
                let i = x / sqrtSize;
                let j = x % sqrtSize;
                if (clusters[i] != null) {
                    clusters[i] = clusters[i].delete(j);
                    if (clusters[i] == null) {
                        summary = summary!.delete(i);
                    };
                };
                if (x == max and summary != null) {
                    let maxCluster = summary!.max!;
                    if (maxCluster != null) {
                        max = maxCluster * sqrtSize + clusters[maxCluster]!.max!;
                    } else {
                        max = min;
                    };
                };
                return this;
            };
        };

        public func successor(x : Nat) : ?Nat {
            if (sqrtSize == 0) {
                if (x == 0 and max == 1) {
                    return 1;
                } else {
                    return null;
                };
            } else if (min != null and x < min!) {
                return min;
            } else {
                let i = x / sqrtSize;
                let j = x % sqrtSize;
                if (clusters[i] != null and j < clusters[i]!.max!) {
                    let k = clusters[i]!.successor(j)!;
                    return i * sqrtSize + k;
                } else {
                    if (summary == null) {
                        return null;
                    } else {
                        let i = summary!.successor(i)!;
                        return i * sqrtSize + clusters[i]!.min!;
                    };
                };
            };
        };

        public func predecessor(x : Nat) : ?Nat {
            if (sqrtSize == 0) {
                if (x == 1 and min == 0) {
                    return 0;
                } else {
                    return null;
                };
            } else if (max != null and x > max!) {
                return max;
            } else {
                let i = x / sqrtSize;
                let j = x % sqrtSize;
                if (clusters[i] != null and j > clusters[i]!.min!) {
                    let k = clusters[i]!.predecessor(j)!;
                    return i * sqrtSize + k;
                } else {
                    if (summary == null) {
                        if (x > min!) {
                            return min;
                        } else {
                            return null;
                        };
                    } else {
                        let i = summary!.predecessor(i)!;
                        if (i == null) {
                            if (x > min!) {
                                return min;
                            } else {
                                return null;
                            };
                        } else {
                            return i * sqrtSize + clusters[i]!.max!;
                        };
                    };
                };
            };
        };
    };
};

// this is how you use it
import VebTree "mo:veb-tree";
import VebTree "mo:veb-tree";

actor {
  public func main() : async {
    let vebTree = VebTree.VebTree.construct();
    vebTree.add(5);
    vebTree.add(1);
    vebTree.add(7);
    vebTree.add(9);
    vebTree.add(3);
    vebTree.delete(7);
    let isPartOf1 = vebTree.isPartOf(5); // true
    let isPartOf2 = vebTree.isPartOf(7); // false
    let successor1 = vebTree.successor(3); // 5
    let successor2 = vebTree.successor(9); // null
    let predecessor1 = vebTree.predecessor(5); // 3
    let predecessor2 = vebTree.predecessor(1); // null
    // ...
  }
}
actor {
  public func main() : async {
    let vebTree = VebTree.VebTree.construct();
    vebTree.add(5);
    vebTree.add(1);
    vebTree.add(7);
    vebTree.add(9);
    vebTree.add(3);
    vebTree.delete(7);
    let isPartOf1 = vebTree.isPartOf(5); // true
    let isPartOf2 = vebTree.isPartOf(7); // false
    let successor1 = vebTree.successor(3); // 5
    let successor2 = vebTree.successor(9); // null
    let predecessor1 = vebTree.predecessor(5); // 3
    let predecessor2 = vebTree.predecessor(1); // null
    // ...
  }
}
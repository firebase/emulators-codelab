// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
const fs = require('fs');
const path = require("path");

const TEST_FIREBASE_PROJECT_ID = "test-firestore-rules-project";

// TODO: Change this to your real Firebase Project ID
const REAL_FIREBASE_PROJECT_ID = "changeme";

const firebase = require("@firebase/testing");

const seedItems = {
  "chocolate": 4.99,
  "coffee beans": 12.99,
  "milk": 5.99
};

const aliceAuth = {
  uid: "alice",
  email: "alice@example.com"
};

const bobAuth = {
  uid: "bob",
  email: "bob@example.com"
};

before(async () => {
  // Load the content of the "firestore.rules" file into the emulator before running the
  // test suite. This is necessary because we are using a fake Project ID in the tests,
  // so the rules "hot reloading" behavior which works in the Web App does not apply here.
  const rulesContent = fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8");
  await firebase.loadFirestoreRules({
    projectId: TEST_FIREBASE_PROJECT_ID,
    rules: rulesContent
  });
});

after(() => {
  firebase.apps().forEach(app => app.delete());
});

// Unit test the security rules
describe("shopping carts", () => {

  const aliceDb = firebase.initializeTestApp({
    projectId: TEST_FIREBASE_PROJECT_ID,
    auth: aliceAuth
  }).firestore();

  const bobDb = firebase.initializeTestApp({
    projectId: TEST_FIREBASE_PROJECT_ID,
    auth: bobAuth
  }).firestore();

  const admin = firebase.initializeAdminApp({
    projectId: TEST_FIREBASE_PROJECT_ID
  }).firestore();

  after(async () => {
    await clearCartsAndCartItems(admin);
  });

  it('can be created and updated by the cart owner', async () => {
    // Alice can create her own cart
    await firebase.assertSucceeds(aliceDb.doc("carts/alicesCart").set({
      ownerUID: "alice",
      total: 0
    }));

    // Bob can't create Alice's cart
    await firebase.assertFails(bobDb.doc("carts/alicesCart").set({
      ownerUID: "alice",
      total: 0
    }));

    // Alice can update her own cart with a new total
    await firebase.assertSucceeds(aliceDb.doc("carts/alicesCart").update({
      total: 1
    }));

    // Bob can't update Alice's cart with a new total
    await firebase.assertFails(bobDb.doc("carts/alicesCart").update({
      total: 1
    }));
  });

  it("can be read only by the cart owner", async () => {
    // Setup: Create Alice's cart as admin
    await admin.doc("carts/alicesCart").set({
      ownerUID: "alice",
      total: 0
    });

    // Alice can read her own cart
    await firebase.assertSucceeds(aliceDb.doc("carts/alicesCart").get());

    // Bob can't read Alice's cart
    await firebase.assertFails(bobDb.doc("carts/alicesCart").get());
  });
});

describe("shopping cart items", async () => {
  const admin = firebase.initializeAdminApp({
    projectId: TEST_FIREBASE_PROJECT_ID
  }).firestore();

  const aliceDb = firebase.initializeTestApp({
    projectId: TEST_FIREBASE_PROJECT_ID,
    auth: aliceAuth
  }).firestore();

  const bobDb = firebase.initializeTestApp({
    projectId: TEST_FIREBASE_PROJECT_ID,
    auth: bobAuth
  }).firestore();

  before(async () => {
    // Create Alice's cart
    const aliceCartRef = admin.doc("carts/alicesCart");
    await aliceCartRef.set({
      ownerUID: "alice",
      total: 0
    });

    // Create items subcollection in Alice's Cart
    const alicesItemsRef = aliceCartRef.collection("items");
    for (const name of Object.keys(seedItems)) {
      await alicesItemsRef.doc(name).set({ value: seedItems[name] });
    }
  });

  after(async () => {
    await clearCartsAndCartItems(admin);
  });

  it("can be read only by the cart owner", async () => {
    // Alice can read items in her own cart
    await firebase.assertSucceeds(aliceDb.doc("carts/alicesCart/items/milk").get());

    // Bob can't read items in alice's cart
    await firebase.assertFails(bobDb.doc("carts/alicesCart/items/milk").get())
  });

  it("can be added only by the cart owner",  async () => {
    // Alice can add an item to her own cart
    await firebase.assertSucceeds(aliceDb.doc("carts/alicesCart/items/lemon").set({
      name: "lemon",
      price: 0.99
    }));

    // Bob can't add an item to alice's cart
    await firebase.assertFails(bobDb.doc("carts/alicesCart/items/lemon").set({
      name: "lemon",
      price: 0.99
    }));
  });
});

describe.skip("adding an item to the cart recalculates the cart total. ", () => {
  let unsubscribe;

  const admin = firebase.initializeAdminApp({
    projectId: REAL_FIREBASE_PROJECT_ID
  }).firestore();

  after(async () => {
    await clearCartsAndCartItems(admin);

    // Call the function returned by `onSnapshot` to unsubscribe from updates
    if (unsubscribe) {
      unsubscribe();
    }
  });

  it("should sum the cost of their items", (done) => {
    if (REAL_FIREBASE_PROJECT_ID == "changeme") {
      throw new Error("Please change the REAL_FIREBASE_PROJECT_ID at the top of the test file");
    }

    const db = firebase
        .initializeAdminApp({ projectId: REAL_FIREBASE_PROJECT_ID })
        .firestore();

    // Setup: Initialize cart
    const aliceCartRef = db.doc("carts/alice")
    aliceCartRef.set({ ownerUID: "alice", totalPrice: 0 });

    //  Trigger `calculateCart` by adding items to the cart
    const aliceItemsRef = aliceCartRef.collection("items");
    aliceItemsRef.doc("doc1").set({name: "nectarine", price: 2.99});
    aliceItemsRef.doc("doc2").set({ name: "grapefruit", price: 6.99 });

    // Listen for every update to the cart. Every time an item is added to
    // the cart's subcollection of items, the function updates `totalPrice`
    // and `itemCount` attributes on the cart.
    // Returns a function that can be called to unsubscribe the listener.
    unsubscribe = aliceCartRef.onSnapshot(snap => {
      // If the function worked, these will be cart's final attributes.
      const expectedCount = 2;
      const expectedTotal = 9.98;

      // When the `itemCount`and `totalPrice` match the expectations for the
      // two items added, the promise resolves, and the test passes.
      if (snap.data().itemCount === expectedCount && snap.data().totalPrice == expectedTotal) {
        done();
      };
    });
  });
});

/**
 * Clear all test data.
 * @param {firebase.firestore.Firestore} db 
 */
async function clearCartsAndCartItems(db) {
  // Note: normally we could call "firebase.clearFirestoreData()" from the testing library but
  // we don't want to clear the whole database, we want to leave the "items" collection intact
  const deleteBatch = db.batch();
  const carts = await db.collection('carts').get();
  for (const cart of carts.docs) {
    deleteBatch.delete(cart.ref);
    const cartItems = await cart.ref.collection('items').get();
    for (const item of cartItems.docs) {
      deleteBatch.delete(item.ref)
    }
  }

  await deleteBatch.commit();
}

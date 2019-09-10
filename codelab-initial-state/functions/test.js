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

const firebase = require("@firebase/testing");

const seedItems = {
  "chocolate": 4.99,
  "coffee beans": 12.99,
  "milk": 5.99
};
const newItem = {
  "strawberries": 6.99
};
const aliceAuth = {
  uid: "alice",
  email: "alice@example.com"
};

before(async () => {
  // Load the content of the "firestore.rules" file into the emulator before running the
  // test suite. This is necessary because we are using a fake Project ID in the tests,
  // so the rules "hot reloading" behavior which works in the Web App does not apply here.
  const rulesContent = fs.readFileSync(path.resolve(__dirname, "../firestore.rules"));
  await firebase.loadFirestoreRules({
    projectId: TEST_FIREBASE_PROJECT_ID,
    rules: rulesContent
  });
});

after(() => {
  firebase.apps().forEach(app => app.delete());
});

// Unit test the security rules
describe("shopping cart creation", () => {

  const db = firebase.initializeTestApp({
    projectId: TEST_FIREBASE_PROJECT_ID,
    auth: aliceAuth
  }).firestore();

  after(() => {
    firebase.clearFirestoreData({ projectId: TEST_FIREBASE_PROJECT_ID });
  });

  it('can be created by the cart owner', async () => {
    await firebase.assertSucceeds(db.doc("carts/alicesCart").set({
      ownerUID: "alice",
      total: 0
    }));
  }).timeout(1000);

  it('items can be added to a cart by the cart owner', async () => {
    // Relies on the cart being created in the previous test.
    await firebase.assertSucceeds(db.doc("carts/alicesCart/items/coffee").set({
      name: "Decaf Coffee Beans",
      price: 12.99,
    }));
  }).timeout(1000);

  it("cannot be created by user other than the cart owner", async () => {
    // All requests are being made by Alice; testing that she cannot create
    // a cart owned by a different user.
    await firebase.assertFails(db.doc("carts/adamsCart").set({
      ownerUID: "adam",
      items: seedItems
    }));
  }).timeout(1000);

  it('items cannot be added to a cart by a non-owner', async () => {
    // Relies on the cart in the previous example being created.
    await firebase.assertFails(db.doc("carts/adamsCart/items/coffee").set({
      name: "Decaf Coffee Beans",
      price: 12.99,
    }));
  }).timeout(1000);
});

describe("shopping cart reads, updates, and deletes", async () => {

  const db = firebase.initializeTestApp({
    projectId: TEST_FIREBASE_PROJECT_ID,
    auth: aliceAuth
  }).firestore();
    
  before(async () => {
    const admin = firebase.initializeAdminApp({ 
      projectId: TEST_FIREBASE_PROJECT_ID 
    }).firestore();

    // Create Alice's cart
    await admin.doc("carts/alicesCart").set({
      ownerUID: "alice",
      total: 0
    });

    // Iterate through `seedItems`, and create a document for each one in the
    // `items` subcollection
    const alicesItemsRef = admin.doc("carts/alicesCart").collection("items");
    for (const name of Object.keys(seedItems)) {
      await alicesItemsRef.doc(name).set({ value: seedItems[name] });
    }

    // Create Bart's cart
    await admin.doc("carts/bartsCart").set({
      ownerUID: "bart",
      total: 0
    });

    const bartsItemsRef = admin.doc("carts/bartsCart").collection("items");
    // Iterate through `seedItems`, and create a document for each one in the
    // `items` subcollection
    for (const name of Object.keys(seedItems)) {
      await bartsItemsRef.doc(name).set({ name: name, value: seedItems[name] });
    }
  });

  after(() => {
    firebase.clearFirestoreData({ projectId: TEST_FIREBASE_PROJECT_ID });
  });

  it("cart can be read by the cart owner", async () => {
    await firebase.assertSucceeds(db.doc("carts/alicesCart").get());
  }).timeout(1000);

  it("items can be read by the cart owner", async () => {
    await firebase.assertSucceeds(db.doc("carts/alicesCart/items/milk").get());
  }).timeout(1000);

  it("cart cannot be read by a user other than the cart owner", async () => {
    await firebase.assertFails(db.doc("carts/bartsCart").get());
  }).timeout(1000);

  it("items cannot be read by a user other than the cart owner", async () => {
    await firebase.assertFails(db.doc("carts/bartsCart/items/milk").get());
  }).timeout(1000);

  it("items can be added by the cart owner",  async () => {
    await firebase.assertSucceeds(db.doc("carts/alicesCart/items/lemon").set({
      name: "lemon",
      price: .99
    }));
  }).timeout(1000);

  it("items cannot be updated by a user other than the cart owner", async () => {
    await firebase.assertFails(db.doc("carts/bartsCart/items/lemon").set({
      name: "lemon",
      price: .99
    }));
  }).timeout(1000);

  // The order matters here. Check other reads and writes before deleting a
  // cart. Delete items before deleting a cart.

  it("items can be deleted by the cart owner", async () => {
    await firebase.assertSucceeds(
      db.doc("carts/alicesCart/items/milk").delete()
    );
  }).timeout(1000);

  it("cart can be deleted by the cart owner", async () => {
    await firebase.assertSucceeds(db.doc("carts/alicesCart").delete());
  }).timeout(1000);

  it("cart cannot be deleted by a user other than the cart owner", async () => {
    await firebase.assertFails(
      db.doc("carts/bartsCart").delete()
    );
  }).timeout(1000);

  it("items cannot be deleted by a user other than the cart owner", async () => {
    await firebase.assertFails(
      db.doc("carts/bartsCart/items/milk").delete()
    );
  }).timeout(1000);
});

// describe("adding an item to the cart recalculates the cart total. ", () => {
//   after(() => {
//     firebase.clearFirestoreData({projectId: TEST_FIREBASE_PROJECT_ID });
//   });
//
//   it("should sum the cost of their items", async () => {
//     const admin = firebase.initializeAdminApp({ projectId: TEST_FIREBASE_PROJECT_ID }).firestore();
//     const aliceCartRef = admin.doc("carts/alice")
//
//     // Setup: Create cart
//     await aliceCartRef.set({
//       ownerUID: "alice",
//       total: 0
//     });
//
//     // Setup: Add items to cart
//     const aliceItemsRef = aliceCartRef.collection("items");
//     await aliceItemsRef.doc("doc1").set({name: "nectarine", price: 2.99});
//     const items = await aliceItemsRef.get();
//
//     // Expectations
//     const expectedCount = 2;
//     const expectedTotal = 9.98;
//
//     const done = new Promise((resolve, reject) => {
//       aliceCartRef.onSnapshot(snap => {
//         if (snap.data().itemCount === expectedCount && snap.data().totalPrice == expectedTotal) {
//           resolve();
//         }
//       })
//     });
//
//     //  Trigger `calculateCart` function
//     await aliceItemsRef.doc("doc2").set({ name: "grapefuit", price: 6.99 });
//     await done;
//   }).timeout(1000);
// });

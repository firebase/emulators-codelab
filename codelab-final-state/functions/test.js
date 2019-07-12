const firebase = require("@firebase/testing");
const projectId = "cart-test";

const admin = firebase.initializeAdminApp({ projectId}).firestore();
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
const db = firebase.initializeTestApp({
  projectId: projectId,
  auth: aliceAuth
}).firestore();

after(() => {
  firebase.apps().forEach(app => app.delete());
});

// Unit test the security rules
describe("shopping cart creation", () => {
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

describe("shopping cart reads, update and deletes", () => {
  before(() => {
    // Create Alice's cart
    admin.doc("carts/alicesCart").set({
      ownerUID: "alice",
      total: 0
    });

    const aliceItemsRef = admin.doc("carts/alicesCart").collection("items");
    // Iterate through `seedItems`, and create a document for each one in the
    // `items` subcollection
    Object.keys(seedItems).forEach(name => {
      aliceItemsRef.doc(name).set({ value: seedItems[name] });
    });

    // Create Bart's cart
    admin.doc("carts/bartsCart").set({
      ownerUID: "bart",
      total: 0
    });

    const bartsItemsRef = admin.doc("carts/bartsCart").collection("items");
    // Iterate through `seedItems`, and create a document for each one in the
    // `items` subcollection
    Object.keys(seedItems).forEach(name => {
      bartsItemsRef.doc(name).set({ value: seedItems[name] });
    });
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
      price: ".99"
    }));
  }).timeout(1000);

  it("items cannot be updated by a user other than the cart owner", async () => {
    await firebase.assertFails(db.doc("carts/bartsCart/items/lemon").set({
      name: "lemon",
      price: ".99"
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

const firebase = require("@firebase/testing");
const projectId = "cart-test";

const admin = firebase.initializeAdminApp({ projectId}).firestore();
const seedItems = {
  "chocolate": 4.99,
  "coffee beans": 12.99,
  "almond milk": 5.99
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
  before(() => {

  });

  it('can be created by the cart owner', async () => {
  await firebase.assertSucceeds(db.doc("carts/alicesCart").set({
    ownerUID: "alice",
    items: seedItems
  }));
}).timeout(1000);

  it("cannot be created by user other than the cart owner", async () => {
    await firebase.assertFails(db.collection("carts").doc("adamsCart").set({
      ownerUID: "adam",
      items: seedItems
    }));
  }).timeout(1000);
});

describe("shopping cart reads, update and deletes", () => {
  before(() => {
    admin.collection("carts").doc("alicesCart").set({
      ownerUID: "alice",
      items: seedItems
    });
    admin.collection("carts").doc("bartsCart").set({
      ownerUID: "bart",
      items: seedItems
    });
  });

  it("can be read by the cart owner", async () => {
    await firebase.assertSucceeds(db.collection("carts").doc("alicesCart").get());
  }).timeout(1000);

  it("cannot be read by a user other than the cart owner", async () => {
    await firebase.assertFails(db.collection("carts").doc("bartsCart").get());
  }).timeout(1000);

  it("can be updated by the cart owner",  async () => {
    await firebase.assertSucceeds(db.collection("carts").doc("alicesCart").update({
      "items": newItem
    }));
  }).timeout(1000);

  it("cannot be updated by a user other than the cart owner", async () => {
    await firebase.assertFails(db.collection("carts").doc("bartsCart").update({
      "items": newItem
    }));
  }).timeout(1000);

  // The order matters here; check `get` and `update` before deleting the carts.
  it("can be deleted by the cart owner", async () => {
    await firebase.assertSucceeds(db.collection("carts").doc("alicesCart").delete());
  }).timeout(1000);

  it("cannot be deleted by a user other than the cart owner", async () => {
    await firebase.assertFails(db.collection("carts").doc("bartsCart").delete());
  }).timeout(1000);
});

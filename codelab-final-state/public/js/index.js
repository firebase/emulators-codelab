const { el, mount } = redom;

import { createItems } from "./data.js";
import {
  ItemCardList,
  HeaderIcon,
  HeaderBar,
  ModalDialog,
  CartList
} from "./view.js";

class HomePage {
  db;
  auth;

  headerBar;
  itemCardList;
  modalDialog;

  cart = {};
  cartUnsubscribe;

  constructor(db, auth) {
    this.db = db;
    this.auth = auth;

    this.headerBar = new HeaderBar([
      new HeaderIcon("sign_in", "account_circle", "Sign In", () => {
        this.onSignInClicked();
      }),
      new HeaderIcon("cart", "shopping_cart", "Cart (0)", () => {
        this.showCart();
      })
    ]);

    this.itemCardList = new ItemCardList((id, data) => {
      this.addToCart(id, data);
    });

    this.modalDialog = new ModalDialog("Cart", "Nothing here.");

    this.el = el("div.header-page", [
      this.headerBar,
      this.itemCardList,
      this.modalDialog
    ]);

    this.listenForAuth();
    this.listenForItems();
  }

  listenForAuth() {
    this.auth.onAuthStateChanged(user => {
      console.log(`auth.currentUser = ${JSON.stringify(user)}`);
      const signedIn = user !== null;
      this.setSignedIn(signedIn);
    });
  }

  listenForItems() {
    this.db
      .collection("items")
      // .limit(9)
      .onSnapshot(items => {
        if (items.size === 0) {
          createItems(this.db);
          return;
        }

        this.itemCardList.setItems(items);
      });
  }

  listenForCart(uid) {
    // If we were previously listening to the cart for
    // a different user, unsubscribe.
    if (this.cartUnsubscribe) {
      this.cartUnsubscribe();
      this.cartUnsubscribe = null;
    }

    this.cartUnsubscribe = this.db
      .collection("carts")
      .doc(uid)
      .collection("items")
      .onSnapshot(cart => {
        this.setCart(cart);
      });
  }

  onSignInClicked() {
    if (this.auth.currentUser !== null) {
      this.auth.signOut();
    } else {
      this.auth.signInAnonymously();
    }
  }

  setSignedIn(signedIn) {
    this.headerBar.setIconEnabled("cart", signedIn);
    this.headerBar.setIconText("sign_in", signedIn ? "Sign Out" : "Sign In");

    if (signedIn) {
      this.listenForCart(this.auth.currentUser.uid);
    } else {
      this.setCart(null);
    }
  }

  setCart(cart) {
    let itemIds;

    if (cart) {
      this.cart = cart.docs.map(doc => doc.data());
      itemIds = cart.docs.map(doc => doc.id);
    } else {
      this.cart = [];
      itemIds = [];
    }

    // For any item in the cart, we disable the add button
    this.itemCardList.getAll().forEach(itemCard => {
      const inCart = itemIds.indexOf(itemCard.id) >= 0;
      itemCard.setAddEnabled(!inCart);
    });

    this.headerBar.setIconText("cart", `Cart (${this.cart.length})`);
  }

  addToCart(id, itemData) {
    if (this.auth.currentUser === null) {
      alert("You must be signed in!");
      return;
    }

    console.log("addToCart", id, JSON.stringify(itemData));
    return this.db
      .collection("carts")
      .doc(this.auth.currentUser.uid)
      .collection("items")
      .doc(id)
      .set(itemData);
  }

  showCart() {
    if (this.auth.currentUser === null) {
      return;
    }

    const items = this.cart.map(doc => `${doc.name} - ${doc.price}`);
    this.modalDialog.setContent(new CartList(items));
    this.modalDialog.show();
  }
}

export async function onDocumentReady(fbApp) {
  console.log("Firebase Config", JSON.stringify(fbApp.options));

  const db = fbApp.firestore();
  const auth = fbApp.auth();

  // TODO: Figure out some sort of emulator toggle.
  // db.settings({
  //   host: "localhost:8081",
  //   ssl: false
  // });

  const homePage = new HomePage(db, auth);
  mount(document.body, homePage);
}

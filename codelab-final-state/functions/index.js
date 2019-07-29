const admin = require('firebase-admin');
const functions = require('firebase-functions');

const db = admin.initializeApp().firestore();

// Recalculates the total cost of a cart; triggered when there's a change
// to any items in a cart.
exports.calculateCart = functions.firestore.document("carts/{cartId}/items/{itemId}")
  .onWrite(async (change, context) => {
    try {
      const cartRef = db.collection("carts").doc(context.params.cartId);
      const itemsSnap = await cartRef.collection("items").get();
      let total = 0;
      let count = 0;

      await itemsSnap.docs.forEach(item => {
        let itemData = item.data();
        if (itemData.price) {
          let price = itemData.price;
          // If not specified, the quantity is 1
          let quantity = (itemData.quantity) ? itemData.quantity : 1;
          total += (price * quantity);
          count += quantity;
          console.log(`Adding ${itemData.name}, which costs ${price} to the total, which is now ${total}.`);
        }
      console.log("Cart total successfully recaclulated: ", total);
      return cartRef.set({
        total: total,
        count: count
      }, {merge: true});
    })
  } catch(err) {
    console.log("Cart could not be recalculated. ", err);
  }
});

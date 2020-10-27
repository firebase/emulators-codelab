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

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const db = admin.initializeApp().firestore();

// Recalculates the total cost of a cart; triggered when there's a change
// to any items in a cart.
exports.calculateCart = functions
    .firestore.document("carts/{cartId}/items/{itemId}")
    .onWrite(async (change, context) => {
      console.log(`onWrite: ${change.after.ref.path}`);
      if (!change.after.exists) {
        // Ignore deletes
        return;
      }

      let totalPrice = 0;
      let itemCount = 0;
      try {
        const cartRef = db.collection("carts").doc(context.params.cartId);
        const itemsSnap = await cartRef.collection("items").get();

        itemsSnap.docs.forEach(item => {
          const itemData = item.data();
          if (itemData.price) {
            // If not specified, the quantity is 1
            const quantity = itemData.quantity ? itemData.quantity : 1;
            itemCount += quantity;
            totalPrice += (itemData.price * quantity);
          }
        });

        await cartRef.update({
          totalPrice,
          itemCount
        });

        console.log("updated successfully!");
      } catch(err) {
        console.warn("update error", err);
      }
    });

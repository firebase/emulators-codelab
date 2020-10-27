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

const NAMES = [
  "Computer",
  "Backpack",
  "Wallet",
  "Dog Toy",
  "Coffee Cup",
  "Fountain Pen",
  "Phone Case",
  "Shoes",
  "Mystery Box",
  "Gadget",
  "Multi-tool"
];

const ADJECTIVES = [
  "Sleek",
  "Durable",
  "Hip",
  "Futuristic",
  "Revolutionary",
  "All-New",
  "Handmade",
  "Hipster",
  "Practical",
  "Refined",
  "Rustic",
  "Ergonomic",
  "Intelligent"
];

const DESCRIPTIONS = [
  "This best-in-class product will improve your life in ways you can't imagine.",
  "I consume, therefore I am.",
  "What are you waiting for? Everybody else already bought this!",
  "Three MIT Grads invented this thing so you know it's good ... right?",
  "From the makers of 'The Smurfs Movie' comes this exciting new purchasing opportunity",
  "The perfect gift for Dads, Grads, or people named Chad!",
  "As seen on Shark Tank, this will change the way you think!",
  "Step down sliced bread, there is a new greatest thing! And it's available with just one click."
];

const PRICES = [
  "0.99",
  "4.99",
  "9.99",
  "12.99",
  "14.99",
  "19.99",
  "26.99",
  "29.99",
  "99.99"
];

const IMG_SIZES = ["640", "600", "480", "800", "640", "700", "720"];

const IMG_CATEGORIES = ["arch", "tech", "nature"];

/**
 * This function can be used to create random items in the database,
 * although it should not be necessary because the codelab includes
 * a Firestore export for seed data.
 */
export async function createItems(db) {
  console.log("createItems()");

  const batch = db.batch();
  for (let i = 0; i < 9; i++) {
    const data = {
      name: _getProductName(),
      price: _getProductPrice(),
      description: _getProductDescription(),
      imageUrl: _getProductImageUrl()
    };

    const ref = db.collection("items").doc();
    batch.set(ref, data);
  }

  await batch.commit();
}

function _getProductName() {
  return _randomElement(ADJECTIVES) + " " + _randomElement(NAMES);
}

function _getProductDescription() {
  return _randomElement(DESCRIPTIONS);
}

function _getProductPrice() {
  return _randomElement(PRICES);
}

function _getProductImageUrl() {
  return (
    "https://placeimg.com/" +
    _randomElement(IMG_SIZES) +
    "/" +
    _randomElement(IMG_SIZES) +
    "/" +
    _randomElement(IMG_CATEGORIES)
  );
}

function _randomElement(arr) {
  const ind = Math.floor(Math.random() * arr.length);
  return arr[ind];
}

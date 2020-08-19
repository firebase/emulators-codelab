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


/**
 * RE:DOM is a simple library for constructing HTML elements.
 * https://redom.js.org/
 */
const { el, mount, setChildren, setAttr, setStyle } = redom;

export class FlatButton {
  el;

  constructor(text, callback) {
    this.el = el(
      "button.mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--primary",
      {
        onclick: callback
      },
      text
    );
  }

  setEnabled(enabled) {
    setAttr(this.el, { disabled: !enabled });
  }
}

export class ItemCard {
  id;
  data;
  callback;
  el;
  addButtonEl;

  constructor(doc, callback) {
    this.id = doc.id;
    this.data = doc.data();
    this.callback = callback;

    const { name, price, description, imageUrl } = doc.data();

    this.addButtonEl = new FlatButton(`ADD TO CART (\$${price})`, () => {
      this.callback(this.id, this.data);
    });

    const textEl = el("div.item-text", [
      el("p.title mdl-card__title-text", name),
      el("p.text mdl-card__supporting-text", description)
    ]);
    const imageEl = el("div.item-image", [el("img.img", { src: imageUrl })]);
    const footerEl = el("div.item-footer", [this.addButtonEl]);

    const contentEl = el("div.content", [textEl, imageEl, footerEl]);

    this.el = el("div.card mdl-card mdl-shadow--2dp", contentEl);
  }

  setAddEnabled(enabled) {
    this.addButtonEl.setEnabled(enabled);
  }
}

export class ItemCardList {
  el;
  callback;
  itemCards = [];

  constructor(callback) {
    this.el = el("div#items");
    this.callback = callback;
  }

  setItems(items) {
    this.itemCards = items.docs.map(item => {
      return new ItemCard(item, this.callback);
    });

    if (this.itemCards.length > 0) {
      setChildren(this.el, this.itemCards);
    } else {
      setChildren(this.el, el("div", "There's nothing here ... did you remember to start the emulators with --import?"));
    }
  }

  getAll() {
    return this.itemCards;
  }

  getCard(itemId) {
    return this.itemCards.find(card => card.id === itemId);
  }
}

export class HeaderIcon {
  el;
  id;
  textEl;
  iconEl;

  constructor(id, icon, text, callback) {
    this.id = id;
    this.textEl = el("p", text);
    this.iconEl = el("i.material-icons", icon);

    this.el = el(
      "div.labeled-icon mdl-js-ripple-effect ripple-container",
      {
        onclick: callback
      },
      [this.iconEl, this.textEl, el("span.mdl-ripple")]
    );
  }

  setText(text) {
    this.textEl.textContent = text;
  }

  setEnabled(enabled) {
    const opacity = enabled ? 1.0 : 0.5;
    setStyle(this.el, { opacity });
  }
}

export class HeaderBar {
  el;
  icons = {};

  constructor(icons) {
    icons = icons || [];

    const logoEl = el("div.logo", [el("img", { src: "img/sparky.png" })]);

    const textEl = el("div.text", [
      el("p.title", "The Fire Store"),
      el("p.subtitle", "Your one-stop shop for fire sales!")
    ]);

    for (const icon of icons) {
      this.icons[icon.id] = icon;
    }

    const iconsEl = el("div.icons ", icons);
    this.el = el("div#header", [logoEl, textEl, iconsEl]);
  }

  setIconEnabled(id, enabled) {
    this.icons[id].setEnabled(enabled);
  }

  setIconText(id, text) {
    this.icons[id].setText(text);
  }
}

export class CartList {
  constructor(items) {
    const children = items.map(i => {
      return el("li", i);
    });

    this.el = el("ul", children);
  }
}

export class ModalDialog {
  constructor(title) {
    this.titleEl = el("h4.mdl-dialog__title", title);
    this.contentEl = el("div.mdl-dialog__content");
    this.actionsEl = el("div.mdl-dialog__actions", [
      el("button.mdl-button", { type: "button", onclick: this.hide }, "Close")
    ]);

    this.el = el("dialog#modal.mdl-dialog", [
      this.titleEl,
      this.contentEl,
      this.actionsEl
    ]);
  }

  setContent(element) {
    setChildren(this.contentEl, element);
  }

  show() {
    document.querySelector("#modal").showModal();
  }

  hide() {
    document.querySelector("#modal").close();
  }
}

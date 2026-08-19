// ---------- menu data ----------
const ITEMS = [
  {
    id: "buttermilk",
    name: "Classic Buttermilk Stack",
    price: 14,
    desc: "Four fluffy buttermilk pancakes with pure maple syrup and whipped butter.",
    tag: "Sweet", tagClass: "",
    kcal: 680, protein: 14, prep: "10–12 min",
    img: "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=800&q=75",
  },
  {
    id: "berry",
    name: "Berry Bliss",
    price: 17,
    desc: "Blueberries and strawberries piled high with berry compote and vanilla cream.",
    tag: "Sweet", tagClass: "",
    kcal: 720, protein: 15, prep: "12–14 min",
    img: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=75",
  },
  {
    id: "choc",
    name: "Choc Overload",
    price: 18,
    desc: "Chocolate pancakes, hazelnut spread, brownie bits and a warm chocolate drizzle.",
    tag: "Choc Loaded", tagClass: "hot",
    kcal: 890, protein: 16, prep: "12–14 min",
    img: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=75",
  },
  {
    id: "banana",
    name: "Banana Caramel",
    price: 16,
    desc: "Caramelised banana, salted caramel sauce and crushed roasted pecans.",
    tag: "Sweet", tagClass: "",
    kcal: 780, protein: 13, prep: "12–14 min",
    img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=75",
  },
  {
    id: "lemon",
    name: "Lemon Ricotta",
    price: 16,
    desc: "Cloud-light ricotta pancakes with lemon curd and a snowfall of icing sugar.",
    tag: "Sweet", tagClass: "",
    kcal: 640, protein: 18, prep: "12–15 min",
    img: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=75",
  },
  {
    id: "brekkie",
    name: "Big Brekkie Stack",
    price: 19,
    desc: "Savoury stack with crispy bacon, fried eggs and maple butter. Sweet meets salty.",
    tag: "Savoury", tagClass: "medium",
    kcal: 840, protein: 32, prep: "14–16 min",
    img: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=75",
  },
];

// ---------- render menu ----------
const menuGrid = document.getElementById("menuGrid");
menuGrid.innerHTML = ITEMS.map(
  (b) => `
  <article class="menu-card reveal">
    <div class="thumb">
      <img src="${b.img}" alt="${b.name} pancakes" loading="lazy" />
      <span class="spice-tag ${b.tagClass}">🥞 ${b.tag}</span>
    </div>
    <div class="body">
      <div class="row1">
        <h3>${b.name}</h3>
        <span class="price">$${b.price}</span>
      </div>
      <p class="desc">${b.desc}</p>
      <div class="chips">
        <span class="chip">🔥 ${b.kcal} kcal</span>
        <span class="chip">💪 ${b.protein}g protein</span>
        <span class="chip">⏱ ${b.prep}</span>
      </div>
      <button class="btn btn-primary" data-add="${b.id}">Add to Order +</button>
    </div>
  </article>`
).join("");

document.querySelectorAll(".menu-card.reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  observer.observe(el);
});

// ---------- cart state ----------
const CART_KEY = "krush-cart-v2";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
// drop any ids that no longer exist on the menu
Object.keys(cart).forEach((id) => {
  if (!ITEMS.some((b) => b.id === id)) delete cart[id];
});

const cartFab = document.getElementById("cartFab");
const cartCount = document.getElementById("cartCount");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const toast = document.getElementById("toast");

function save() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function itemCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function renderCart() {
  const entries = Object.entries(cart);
  cartCount.textContent = itemCount();

  if (!entries.length) {
    cartItems.innerHTML = `<p class="cart-empty">Your order is empty.<br/>Go stack something. 🥞</p>`;
    cartTotal.textContent = "$0.00";
    return;
  }

  let total = 0;
  cartItems.innerHTML = entries
    .map(([id, qty]) => {
      const b = ITEMS.find((x) => x.id === id);
      total += b.price * qty;
      return `
      <div class="cart-item">
        <img src="${b.img}" alt="${b.name}" />
        <div>
          <div class="n">${b.name}</div>
          <div class="p">$${b.price} × ${qty} = $${(b.price * qty).toFixed(2)}</div>
        </div>
        <div class="qty">
          <button data-dec="${id}" aria-label="Remove one">−</button>
          <span>${qty}</span>
          <button data-inc="${id}" aria-label="Add one">+</button>
        </div>
      </div>`;
    })
    .join("");
  cartTotal.textContent = `$${total.toFixed(2)}`;
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  save();
  renderCart();
  cartCount.classList.remove("pop");
  void cartCount.offsetWidth;
  cartCount.classList.add("pop");
  const b = ITEMS.find((x) => x.id === id);
  showToast(`${b.name} added to your order 🥞`);
}

// ---------- events ----------
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) return addToCart(add.dataset.add);

  const inc = e.target.closest("[data-inc]");
  if (inc) {
    cart[inc.dataset.inc]++;
    save();
    renderCart();
    return;
  }

  const dec = e.target.closest("[data-dec]");
  if (dec) {
    const id = dec.dataset.dec;
    cart[id]--;
    if (cart[id] <= 0) delete cart[id];
    save();
    renderCart();
  }
});

function openCart() {
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("show");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("show");
}

cartFab.addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (!itemCount()) return showToast("Your order is empty!");
  const total = cartTotal.textContent;
  cart = {};
  save();
  renderCart();
  closeCart();
  showToast(`Order placed — ${total}. Thank you! 🎉`);
});

renderCart();

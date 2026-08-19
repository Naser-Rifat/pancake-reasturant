// Album filtering
const tabs = document.querySelectorAll(".album-tab");
const items = Array.from(document.querySelectorAll("#galleryGrid a"));

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const album = tab.dataset.album;
    items.forEach((item) => {
      item.style.display = album === "all" || item.dataset.album === album ? "" : "none";
    });
  });
});

// Lightbox
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbCaption = document.getElementById("lbCaption");
let current = 0;

function visibleItems() {
  return items.filter((i) => i.style.display !== "none");
}

function show(index) {
  const list = visibleItems();
  current = (index + list.length) % list.length;
  const item = list[current];
  lbImg.src = item.querySelector("img").src.replace("w=700", "w=1400");
  lbImg.alt = item.querySelector("img").alt;
  lbCaption.textContent = item.dataset.caption || "";
  lightbox.classList.add("open");
}

items.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    show(visibleItems().indexOf(item));
  });
});

document.getElementById("lbClose").addEventListener("click", () => lightbox.classList.remove("open"));
document.getElementById("lbPrev").addEventListener("click", () => show(current - 1));
document.getElementById("lbNext").addEventListener("click", () => show(current + 1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") lightbox.classList.remove("open");
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});

// touch swipe on mobile
let touchX = null;
lightbox.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
lightbox.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

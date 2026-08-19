// Navbar background on scroll
const navbar = document.getElementById("navbar");
const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 30);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Mobile menu toggle
const burgerToggle = document.getElementById("burgerToggle");
const navLinks = document.getElementById("navLinks");
burgerToggle.addEventListener("click", () => {
  burgerToggle.classList.toggle("open");
  navLinks.classList.toggle("open");
});
navLinks.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    burgerToggle.classList.remove("open");
    navLinks.classList.remove("open");
  }
});

// Scroll reveal animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Announcement bar (dismiss persists for the session)
const announceBar = document.getElementById("announceBar");
if (announceBar) {
  if (sessionStorage.getItem("krush-announce-closed")) {
    announceBar.remove();
    document.body.classList.remove("has-announce");
  } else {
    document.getElementById("announceClose").addEventListener("click", () => {
      announceBar.remove();
      document.body.classList.remove("has-announce");
      sessionStorage.setItem("krush-announce-closed", "1");
    });
  }
}

// Reviews carousel
const revTrack = document.getElementById("revTrack");
if (revTrack) {
  const step = () => revTrack.querySelector(".rev-card").offsetWidth + 22;
  document.getElementById("revPrev").addEventListener("click", () => {
    revTrack.scrollBy({ left: -step(), behavior: "smooth" });
  });
  document.getElementById("revNext").addEventListener("click", () => {
    revTrack.scrollBy({ left: step(), behavior: "smooth" });
  });

  // gentle auto-advance, pauses while hovered
  let paused = false;
  revTrack.addEventListener("mouseenter", () => (paused = true));
  revTrack.addEventListener("mouseleave", () => (paused = false));
  setInterval(() => {
    if (paused || document.hidden) return;
    const atEnd = revTrack.scrollLeft + revTrack.clientWidth >= revTrack.scrollWidth - 10;
    if (atEnd) revTrack.scrollTo({ left: 0, behavior: "smooth" });
    else revTrack.scrollBy({ left: step(), behavior: "smooth" });
  }, 4500);
}

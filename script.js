const revealItems = document.querySelectorAll(".reveal");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const reveal = (item) => item.classList.add("is-visible");

if ("IntersectionObserver" in window && !motionQuery.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach(reveal);
}

document.querySelectorAll(".story-card").forEach((card) => {
  const video = card.querySelector("video");

  if (video) {
    const play = () => video.play().catch(() => {});
    card.addEventListener("mouseenter", play);
    card.addEventListener("focusin", play);
  }

  card.addEventListener("pointermove", (event) => {
    if (motionQuery.matches) return;

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    card.style.setProperty("--tilt-x", (x * 7).toFixed(2));
    card.style.setProperty("--tilt-y", (y * 7).toFixed(2));
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0");
    card.style.setProperty("--tilt-y", "0");
  });
});

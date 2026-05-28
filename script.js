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
    video.pause();

    const play = () => video.play().catch(() => {});
    const pause = () => {
      if (!card.matches(":hover, :focus-within")) {
        video.pause();
      }
    };

    card.addEventListener("mouseenter", play);
    card.addEventListener("mouseleave", pause);
    card.addEventListener("focusin", play);
    card.addEventListener("focusout", () => requestAnimationFrame(pause));
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

const cropTool = document.querySelector("[data-crop-tool]");

if (cropTool) {
  const editParam = new URLSearchParams(window.location.search).get("edit");
  const isLocalPreview =
    window.location.protocol === "file:" ||
    ["localhost", "127.0.0.1", ""].includes(window.location.hostname) ||
    editParam !== null;

  if (isLocalPreview) {
    const cropTargets = {
      industrial: document.querySelector('[data-crop-target="industrial"]'),
      business: document.querySelector('[data-crop-target="business"]'),
    };

    const availableTargets = Object.fromEntries(
      Object.entries(cropTargets).filter(([, card]) => Boolean(card))
    );
    const targetNames = Object.keys(availableTargets);

    if (targetNames.length) {
      const toggle = cropTool.querySelector("[data-crop-toggle]");
      const panel = cropTool.querySelector("[data-crop-panel]");
      const choices = cropTool.querySelectorAll("[data-crop-select]");
      const zoomInput = cropTool.querySelector("[data-crop-zoom]");
      const xInput = cropTool.querySelector("[data-crop-x]");
      const yInput = cropTool.querySelector("[data-crop-y]");
      const readout = cropTool.querySelector("[data-crop-readout]");
      const copyButton = cropTool.querySelector("[data-crop-copy]");
      const stateKey = "forgettable-versals-crop-tool";
      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
      const readNumber = (card, name, fallback) => {
        const value = parseFloat(card.style.getPropertyValue(name));
        return Number.isFinite(value) ? value : fallback;
      };
      const savedState = (() => {
        try {
          return JSON.parse(window.localStorage.getItem(stateKey) || "{}");
        } catch {
          return {};
        }
      })();
      const cropState = {};

      targetNames.forEach((name) => {
        const card = availableTargets[name];
        cropState[name] = {
          x: savedState[name]?.x ?? readNumber(card, "--x", 50),
          y: savedState[name]?.y ?? readNumber(card, "--y", 50),
          zoom: savedState[name]?.zoom ?? readNumber(card, "--zoom", 1),
        };
      });

      let selectedName = targetNames.includes(editParam) ? editParam : targetNames[0];
      let dragState = null;

      const saveState = () => {
        window.localStorage.setItem(stateKey, JSON.stringify(cropState));
      };

      const valueText = (name) => {
        const values = cropState[name];
        return `--x: ${Math.round(values.x)}%; --y: ${Math.round(values.y)}%; --zoom: ${values.zoom.toFixed(2)}`;
      };

      const applyCrop = (name) => {
        const card = availableTargets[name];
        const values = cropState[name];
        card.style.setProperty("--x", `${Math.round(values.x)}%`);
        card.style.setProperty("--y", `${Math.round(values.y)}%`);
        card.style.setProperty("--zoom", values.zoom.toFixed(2));
      };

      const syncControls = () => {
        const values = cropState[selectedName];
        choices.forEach((choice) => {
          choice.classList.toggle("is-active", choice.dataset.cropSelect === selectedName);
        });
        targetNames.forEach((name) => {
          availableTargets[name].classList.toggle("is-crop-selected", name === selectedName);
        });
        zoomInput.value = values.zoom.toFixed(2);
        xInput.value = Math.round(values.x);
        yInput.value = Math.round(values.y);
        readout.value = valueText(selectedName);
      };

      const updateSelectedCrop = (updates) => {
        const values = cropState[selectedName];
        cropState[selectedName] = {
          x: clamp(updates.x ?? values.x, 0, 100),
          y: clamp(updates.y ?? values.y, 0, 100),
          zoom: clamp(updates.zoom ?? values.zoom, 1, 2.2),
        };
        applyCrop(selectedName);
        saveState();
        syncControls();
      };

      const setOpen = (isOpen) => {
        panel.hidden = !isOpen;
        document.body.classList.toggle("is-crop-editing", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
          syncControls();
        } else {
          targetNames.forEach((name) => availableTargets[name].classList.remove("is-crop-selected"));
        }
      };

      targetNames.forEach((name) => applyCrop(name));
      cropTool.hidden = false;

      toggle.addEventListener("click", () => {
        setOpen(panel.hidden);
      });

      choices.forEach((choice) => {
        choice.addEventListener("click", () => {
          selectedName = choice.dataset.cropSelect;
          syncControls();
        });
      });

      zoomInput.addEventListener("input", () => {
        updateSelectedCrop({ zoom: Number(zoomInput.value) });
      });
      xInput.addEventListener("input", () => {
        updateSelectedCrop({ x: Number(xInput.value) });
      });
      yInput.addEventListener("input", () => {
        updateSelectedCrop({ y: Number(yInput.value) });
      });

      copyButton.addEventListener("click", async () => {
        const text = valueText(selectedName);
        await navigator.clipboard?.writeText(text);
        copyButton.textContent = "Copied";
        window.setTimeout(() => {
          copyButton.textContent = "Copy values";
        }, 1200);
      });

      Object.entries(availableTargets).forEach(([name, card]) => {
        card.addEventListener("pointerdown", (event) => {
          if (panel.hidden || selectedName !== name || event.button !== 0) return;
          event.preventDefault();
          card.setPointerCapture(event.pointerId);
          dragState = {
            name,
            startX: event.clientX,
            startY: event.clientY,
            x: cropState[name].x,
            y: cropState[name].y,
          };
        });

        card.addEventListener("pointermove", (event) => {
          if (!dragState || dragState.name !== name) return;
          const bounds = card.getBoundingClientRect();
          updateSelectedCrop({
            x: dragState.x - ((event.clientX - dragState.startX) / bounds.width) * 100,
            y: dragState.y - ((event.clientY - dragState.startY) / bounds.height) * 100,
          });
        });

        card.addEventListener("pointerup", () => {
          dragState = null;
        });
        card.addEventListener("pointercancel", () => {
          dragState = null;
        });
      });

      if (editParam) {
        setOpen(true);
      }
    }
  }
}

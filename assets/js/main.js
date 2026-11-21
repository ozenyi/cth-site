(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var toggle = document.querySelector(".menu-toggle");
  var panel = document.querySelector(".nav-panel");

  function closeMenu() {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }

  function openMenu() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    var first = panel.querySelector("a");
    if (first) first.focus();
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      if (panel.hidden) openMenu();
      else closeMenu();
    });
    document.querySelectorAll("[data-close-menu]").forEach(function (button) {
      button.addEventListener("click", closeMenu);
    });
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
      if (event.key !== "Tab" || panel.hidden) return;
      var items = panel.querySelectorAll("a, button");
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  var params = new URLSearchParams(window.location.search);
  var projet = params.get("projet");
  var select = document.querySelector("#projet");
  if (projet && select) {
    Array.prototype.forEach.call(select.options, function (option) {
      if (option.value === projet) select.value = projet;
    });
  }

  document.querySelectorAll("[data-ba]").forEach(function (ba) {
    var input = ba.querySelector('input[type="range"]');
    var clip = ba.querySelector(".ba-clip");
    var img = clip && clip.querySelector("img");
    if (!input || !clip || !img) return;

    function paint() {
      var value = Math.min(100, Math.max(0, Number(input.value)));
      ba.style.setProperty("--pos", value + "%");
      if (value <= 0) {
        clip.style.width = "0%";
      } else {
        clip.style.width = value + "%";
        img.style.width = 10000 / value + "%";
      }
      input.setAttribute("aria-valuetext", "Avant visible à " + Math.round(value) + " pour cent");
    }

    input.addEventListener("input", paint);
    paint();
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();

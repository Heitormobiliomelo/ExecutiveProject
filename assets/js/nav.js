/* nav.js — highlights the active section in the main navigation */

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  document.querySelectorAll(".site-nav a[data-page]").forEach((link) => {
    if (link.dataset.page === currentPage) link.classList.add("is-active");
  });
});

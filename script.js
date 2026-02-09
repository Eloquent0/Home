const btn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (!btn) return;
  btn.classList.toggle('show', window.scrollY > 200);
});

if (btn) {
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// showResults(...) — keep the rest of your function, replace the focus/scroll block with this:

  results.classList.remove('hidden');

  // Focus results for accessibility, but avoid forcing a viewport scroll.
  // Use preventScroll when supported; if not supported, skip the scrollIntoView fallback
  // so older browsers don't force a jump that prevents returning to the top.
  if (results && typeof results.focus === 'function') {
    try {
      results.focus({ preventScroll: true });
    } catch (err) {
      // Older browsers: don't call scrollIntoView here (it forces the viewport).
      // Ensure the element is focusable so keyboard users can reach it.
      results.setAttribute('tabindex', '-1');
      // Intentionally do not call results.scrollIntoView(...)
    }
  }
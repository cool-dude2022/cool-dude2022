// Modified showResults focus logic to avoid forcing page scroll on older browsers.
// Replace the existing showResults focus/fallback block with the code below.

function showResults(current, target, totalClosed, sumDetails, details) {
  summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${totalClosed.toLocaleString()} XP (closed-form)`;

  // Show note if rounded per-level sum differs
  if (sumDetails !== totalClosed) {
    note.textContent = `Per-level rounded sum = ${sumDetails.toLocaleString()} XP. Difference vs closed-form: ${(sumDetails - totalClosed).toLocaleString()} XP.`;
    note.classList.remove('hidden');
  } else {
    note.textContent = '';
    note.classList.add('hidden');
  }

  // If too many levels, suppress breakdown to avoid freezing the browser
  const MAX_BREAKDOWN = 500;
  breakdown.innerHTML = '';
  if (details.length > MAX_BREAKDOWN) {
    const li = document.createElement('li');
    li.textContent = `Breakdown suppressed for ranges > ${MAX_BREAKDOWN} levels. (${details.length} levels requested)`;
    breakdown.appendChild(li);
    detailsBlock.open = false;
  } else {
    details.forEach(d => {
      const li = document.createElement('li');
      li.innerHTML = `<span>Level ${d.from} → ${d.to}</span><strong>${d.xp.toLocaleString()} XP</strong>`;
      breakdown.appendChild(li);
    });
  }

  results.classList.remove('hidden');

  // Focus results for accessibility, but avoid forcing the browser to scroll.
  // Use preventScroll when supported; if not supported, do NOT call scrollIntoView (avoids jarring forced scroll).
  if (results && typeof results.focus === 'function') {
    try {
      // modern browsers: focus without scroll
      results.focus({ preventScroll: true });
    } catch (err) {
      // older browsers: skip forcing a scroll. Keep results focusable so user can tab to it manually.
      if (!results.hasAttribute('tabindex')) {
        results.setAttribute('tabindex', '-1');
      }
      // intentionally do NOT call scrollIntoView here to avoid moving the viewport
    }
  }
}
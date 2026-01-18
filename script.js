// ... same top of file ...

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

    // Focus results for accessibility but avoid forcing the browser to scroll to it if possible
    if (results && typeof results.focus === 'function') {
      try {
        // modern browsers: focus without scroll
        results.focus({ preventScroll: true });
      } catch (err) {
        // fallback for older browsers: scroll results into view to top then focus
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        results.focus();
      }
    }
  }

// ... rest of file ...
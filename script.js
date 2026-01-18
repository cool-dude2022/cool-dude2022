// XP Calculator - redesigned for predictable scrolling and accessibility

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const modeTo = document.getElementById('modeTo');
  const modeBy = document.getElementById('modeBy');
  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const note = document.getElementById('note');
  const breakdown = document.getElementById('breakdown');
  const detailsBlock = document.getElementById('detailsBlock');
  const resetBtn = document.getElementById('resetBtn');
  const topBtn = document.getElementById('topBtn');

  const MAX_BREAKDOWN = 1000; // safety limit to avoid generating absurd lists

  // formulas
  const A = 3.44883;
  const P = 1.70006;
  const CLOSED_P = P + 1; // 2.70006

  function perLevelXp(l) {
    return A * Math.pow(l, P);
  }

  function closedForm(l1, l2) {
    // XP required to go from level l1 to l2 (closed form)
    return A * (Math.pow(l2, CLOSED_P) - Math.pow(l1, CLOSED_P)) / CLOSED_P;
  }

  // UI helpers
  function showElement(el) { el.classList.remove('hidden'); }
  function hideElement(el) { el.classList.add('hidden'); }

  function updateModeUI() {
    if (modeTo.checked) {
      showElement(toLevelRow);
      hideElement(byLevelsRow);
    } else {
      hideElement(toLevelRow);
      showElement(byLevelsRow);
    }
  }

  modeTo.addEventListener('change', updateModeUI);
  modeBy.addEventListener('change', updateModeUI);
  updateModeUI();

  xpForm.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const current = Math.max(1, Math.floor(Number(currentLevelInput.value) || 1));

    let target;
    if (modeTo.checked) {
      target = Math.max(1, Math.floor(Number(targetLevelInput.value) || current));
    } else {
      const n = Math.max(1, Math.floor(Number(levelsUpInput.value) || 1));
      target = current + n;
    }

    if (target <= current) {
      summary.textContent = 'Target must be greater than current level.';
      showElement(results);
      hideElement(note);
      breakdown.innerHTML = '';
      return;
    }

    const totalClosed = closedForm(current, target);
    // build per-level details and a rounded sum
    const details = [];
    let sumDetails = 0;
    const range = target - current;
    if (range > MAX_BREAKDOWN) {
      // don't attempt to add thousands of items
      breakdown.innerHTML = '';
      const li = document.createElement('li');
      li.textContent = `Breakdown suppressed for ranges > ${MAX_BREAKDOWN} levels. (${range} levels requested)`;
      breakdown.appendChild(li);
      detailsBlock.open = false;
    } else {
      for (let l = current; l < target; l++) {
        const xp = perLevelXp(l);
        details.push({ from: l, to: l + 1, xp: xp });
        sumDetails += Math.round(xp);
      }
      // populate breakdown DOM
      breakdown.innerHTML = '';
      details.forEach(d => {
        const li = document.createElement('li');
        const left = document.createElement('span');
        left.textContent = `Level ${d.from} → ${d.to}`;
        const right = document.createElement('strong');
        right.textContent = `${Math.round(d.xp).toLocaleString()} XP`;
        li.appendChild(left);
        li.appendChild(right);
        breakdown.appendChild(li);
      });
    }

    summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${Math.round(totalClosed).toLocaleString()} XP (closed-form)`;
    if (Math.round(sumDetails) !== Math.round(totalClosed)) {
      note.textContent = `Per-level rounded sum = ${Math.round(sumDetails).toLocaleString()} XP. Difference vs closed-form: ${(Math.round(sumDetails) - Math.round(totalClosed)).toLocaleString()} XP.`;
      showElement(note);
    } else {
      note.textContent = '';
      hideElement(note);
    }

    // show results, but do NOT force focus/scroll
    showElement(results);
    // leave details closed by default; user can open if they want
    // ensure the breakdown is scrolled to top within its container
    if (breakdown) { breakdown.scrollTop = 0; }
  });

  resetBtn.addEventListener('click', () => {
    xpForm.reset();
    updateModeUI();
    hideElement(results);
    breakdown.innerHTML = '';
    note.textContent = '';
  });

  topBtn.addEventListener('click', () => {
    // explicit "back to top" to avoid automated scrolling behaviour
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Accessibility: allow Enter/Space on the details summary to open/close
  // (native behaviour works, we don't override scrolling)
});
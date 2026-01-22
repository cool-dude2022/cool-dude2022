// XP Calculator - redesigned for predictable scrolling and accessibility

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');

  const modeTo = document.getElementById('modeTo');
  const modeBy = document.getElementById('modeBy');
  const modeXp = document.getElementById('modeXp');

  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const byXpRow = document.getElementById('byXpRow');

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

  function levelAfterAddingXp(current, xp) {
    // closed-form inverse:
    // l2^CLOSED_P = current^CLOSED_P + (xp * CLOSED_P) / A
    const base = Math.pow(Math.max(1, current), CLOSED_P);
    const added = (xp * CLOSED_P) / A;
    const l2pow = base + added;
    // guard: l2pow should be >= base
    return Math.pow(Math.max(l2pow, base), 1 / CLOSED_P);
  }

  // UI helpers
  function showElement(el) { el.classList.remove('hidden'); }
  function hideElement(el) { el.classList.add('hidden'); }

  function updateModeUI() {
    if (modeTo.checked) {
      showElement(toLevelRow);
      hideElement(byLevelsRow);
      hideElement(byXpRow);
    } else if (modeBy.checked) {
      hideElement(toLevelRow);
      showElement(byLevelsRow);
      hideElement(byXpRow);
    } else if (modeXp.checked) {
      hideElement(toLevelRow);
      hideElement(byLevelsRow);
      showElement(byXpRow);
    }
  }

  modeTo.addEventListener('change', updateModeUI);
  modeBy.addEventListener('change', updateModeUI);
  modeXp.addEventListener('change', updateModeUI);
  updateModeUI();

  xpForm.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const current = Math.max(1, Math.floor(Number(currentLevelInput.value) || 1));

    let target;
    let usedXp = 0;
    let givenXp = 0;
    let fractionalLevel = null;

    if (modeTo.checked) {
      target = Math.max(1, Math.floor(Number(targetLevelInput.value) || current));
      if (target <= current) {
        summary.textContent = 'Target must be greater than current level.';
        showElement(results);
        hideElement(note);
        breakdown.innerHTML = '';
        return;
      }
      usedXp = closedForm(current, target);
      summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${Math.round(usedXp).toLocaleString()} XP (closed-form)`;
    } else if (modeBy.checked) {
      const n = Math.max(1, Math.floor(Number(levelsUpInput.value) || 1));
      target = current + n;
      usedXp = closedForm(current, target);
      summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${Math.round(usedXp).toLocaleString()} XP (closed-form)`;
    } else { // modeXp
      givenXp = Math.max(0, Number(xpAmountInput.value) || 0);
      fractionalLevel = levelAfterAddingXp(current, givenXp);
      const targetInt = Math.floor(fractionalLevel);
      target = Math.max(current, targetInt);
      // XP used to reach the integer target (not beyond)
      usedXp = closedForm(current, target);
      const leftover = givenXp - usedXp;
      // compute progress into next level as a percentage if fractional
      const nextLevelXp = perLevelXp(target);
      let progressText = '';
      if (fractionalLevel > target) {
        const fractionalPart = fractionalLevel - target;
        const percent = Math.min(100, Math.round((fractionalPart) * 100));
        progressText = ` (~${percent}% towards level ${target + 1})`;
      } else if (target === current && givenXp < perLevelXp(current)) {
        // no level gained, show percent towards next level
        const progress = Math.round((givenXp / perLevelXp(current)) * 100);
        progressText = ` (~${Math.max(0, Math.min(100, progress))}% towards level ${current + 1})`;
      }

      summary.textContent = `If you're level ${current} and you add ${Math.round(givenXp).toLocaleString()} XP you'll reach level ${Math.floor(fractionalLevel)}${progressText}. (Exact fractional level: ${fractionalLevel.toFixed(4)})`;
      // show used/leftover note
      if (leftover >= 0) {
        note.textContent = `XP consumed to reach level ${target}: ${Math.round(Math.max(0, usedXp)).toLocaleString()} XP. Leftover: ${Math.round(leftover).toLocaleString()} XP.`;
        showElement(note);
      } else {
        // this shouldn't happen but guard
        note.textContent = '';
        hideElement(note);
      }
    }

    // for non-XP mode we still offer per-level breakdown (if range reasonable)
    if (!modeXp.checked) {
      const range = target - current;
      if (range > MAX_BREAKDOWN) {
        breakdown.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = `Breakdown suppressed for ranges > ${MAX_BREAKDOWN} levels. (${range} levels requested)`;
        breakdown.appendChild(li);
        detailsBlock.open = false;
      } else {
        const details = [];
        let sumDetails = 0;
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

        // show note if sum differs from closed-form
        if (Math.round(sumDetails) !== Math.round(usedXp)) {
          note.textContent = `Per-level rounded sum = ${Math.round(sumDetails).toLocaleString()} XP. Difference vs closed-form: ${(Math.round(sumDetails) - Math.round(usedXp)).toLocaleString()} XP.`;
          showElement(note);
        } else {
          note.textContent = '';
          hideElement(note);
        }
      }
    } else {
      // in XP mode we can optionally show a compact breakdown:
      const range = Math.floor(fractionalLevel) - current;
      if (range <= 0) {
        breakdown.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = `No full levels gained.`;
        breakdown.appendChild(li);
      } else if (range > MAX_BREAKDOWN) {
        breakdown.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = `Breakdown suppressed for ranges > ${MAX_BREAKDOWN} levels. (${range} levels gained)`;
        breakdown.appendChild(li);
      } else {
        // show per-level XP for each gained level
        breakdown.innerHTML = '';
        for (let l = current; l < current + range; l++) {
          const xp = perLevelXp(l);
          const li = document.createElement('li');
          const left = document.createElement('span');
          left.textContent = `Level ${l} → ${l + 1}`;
          const right = document.createElement('strong');
          right.textContent = `${Math.round(xp).toLocaleString()} XP`;
          li.appendChild(left);
          li.appendChild(right);
          breakdown.appendChild(li);
        }
      }
      detailsBlock.open = false;
    }

    // show results
    showElement(results);

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
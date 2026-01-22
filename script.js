// XP Calculator - redesigned for predictable scrolling and accessibility

// Added XP cost + tax calculation feature

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');

  // NEW: cost + tax inputs (optional, guarded if not present)
  const pricePerMillionInput = document.getElementById('pricePerMillion'); // default 20000
  const taxPercentInput = document.getElementById('taxPercent'); // e.g. 25
  const costSummary = document.getElementById('costSummary');

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
    return A * (Math.pow(l2, CLOSED_P) - Math.pow(l1, CLOSED_P)) / CLOSED_P;
  }

  function levelAfterAddingXp(current, xp) {
    const base = Math.pow(Math.max(1, current), CLOSED_P);
    const added = (xp * CLOSED_P) / A;
    const l2pow = base + added;
    return Math.pow(Math.max(l2pow, base), 1 / CLOSED_P);
  }

  // UI helpers
  function showElement(el) { el && el.classList.remove('hidden'); }
  function hideElement(el) { el && el.classList.add('hidden'); }

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

  function calculateCost(xp) {
    if (!pricePerMillionInput || !costSummary) return;

    const pricePerMillion = Math.max(0, Number(pricePerMillionInput.value) || 20000);
    const taxPercent = Math.max(0, Number(taxPercentInput?.value) || 0);

    const baseCost = (xp / 1_000_000) * pricePerMillion;
    const taxAmount = baseCost * (taxPercent / 100);
    const totalCost = baseCost + taxAmount;

    costSummary.textContent = `XP Cost: ${baseCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Tax (${taxPercent}%): ${taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Total: ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    showElement(costSummary);
  }

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
      summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${Math.round(usedXp).toLocaleString()} XP`;
      calculateCost(usedXp);
    } else if (modeBy.checked) {
      const n = Math.max(1, Math.floor(Number(levelsUpInput.value) || 1));
      target = current + n;
      usedXp = closedForm(current, target);
      summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${Math.round(usedXp).toLocaleString()} XP`;
      calculateCost(usedXp);
    } else {
      givenXp = Math.max(0, Number(xpAmountInput.value) || 0);
      fractionalLevel = levelAfterAddingXp(current, givenXp);
      const targetInt = Math.floor(fractionalLevel);
      target = Math.max(current, targetInt);
      usedXp = closedForm(current, target);
      const leftover = givenXp - usedXp;

      summary.textContent = `If you're level ${current} and you add ${Math.round(givenXp).toLocaleString()} XP you'll reach level ${Math.floor(fractionalLevel)}.`;
      if (leftover >= 0) {
        note.textContent = `XP consumed: ${Math.round(usedXp).toLocaleString()} | Leftover: ${Math.round(leftover).toLocaleString()}`;
        showElement(note);
      }
      calculateCost(givenXp);
    }

    showElement(results);
  });

  resetBtn.addEventListener('click', () => {
    xpForm.reset();
    updateModeUI();
    hideElement(results);
    hideElement(costSummary);
    breakdown.innerHTML = '';
    note.textContent = '';
  });

  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

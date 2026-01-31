document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');

  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');

  const gemsAvailableInput = document.getElementById('gemsAvailable');
  const gemRateInput = document.getElementById('gemRate');
  const xpTaxInput = document.getElementById('xpTax');

  const modeTo = document.getElementById('modeTo');
  const modeBy = document.getElementById('modeBy');
  const modeXp = document.getElementById('modeXp');
  const modeCost = document.getElementById('modeCost');

  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const byXpRow = document.getElementById('byXpRow');
  const costRow = document.getElementById('costRow');
  const costRateRow = document.getElementById('costRateRow');
  const taxRow = document.getElementById('taxRow');

  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const note = document.getElementById('note');
  const breakdown = document.getElementById('breakdown');
  const detailsBlock = document.getElementById('detailsBlock');

  const resetBtn = document.getElementById('resetBtn');
  const topBtn = document.getElementById('topBtn');

  const A = 3.44883;
  const P = 1.70006;
  const CLOSED_P = P + 1;
  const MAX_BREAKDOWN = 100;

  function perLevelXp(l) {
    return A * Math.pow(l, P);
  }

  function closedForm(l1, l2) {
    return A * (Math.pow(l2, CLOSED_P) - Math.pow(l1, CLOSED_P)) / CLOSED_P;
  }

  function levelAfterAddingXp(start, xp) {
    let lvl = start;
    while (xp >= perLevelXp(lvl)) {
      xp -= perLevelXp(lvl);
      lvl++;
    }
    return lvl + xp / perLevelXp(lvl);
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function updateModeUI() {
    hide(toLevelRow);
    hide(byLevelsRow);
    hide(byXpRow);
    hide(costRow);
    hide(costRateRow);
    hide(taxRow);

    if (modeTo.checked) show(toLevelRow);
    if (modeBy.checked) show(byLevelsRow);
    if (modeXp.checked) show(byXpRow);

    if (modeCost.checked) {
      show(costRow);
      show(costRateRow);
      show(taxRow);
    }
  }

  modeTo.onchange =
  modeBy.onchange =
  modeXp.onchange =
  modeCost.onchange = updateModeUI;

  updateModeUI();

  xpForm.addEventListener('submit', e => {
    e.preventDefault();

    const current = Math.max(1, Number(currentLevelInput.value));
    breakdown.innerHTML = '';
    hide(note);

    if (modeCost.checked) {
      const gems = Number(gemsAvailableInput.value);
      const rate = Number(gemRateInput.value);
      const tax = Number(xpTaxInput.value) / 100;

      const rawXp = (gems / rate) * 1000;
      const effectiveXp = rawXp * (1 - tax);

      const finalLevel = Math.floor(levelAfterAddingXp(current, effectiveXp));
      const gained = finalLevel - current;

      summary.textContent =
        `With ${gems.toLocaleString()} gems you receive ` +
        `${Math.round(effectiveXp).toLocaleString()} XP after tax, ` +
        `reaching level ${finalLevel} (+${gained}).`;

      show(results);
      return;
    }

    // ORIGINAL LOGIC (unchanged)
    let target;
    let usedXp = 0;

    if (modeTo.checked) {
      target = Math.max(current, Number(targetLevelInput.value));
      usedXp = closedForm(current, target);
      summary.textContent =
        `XP needed from level ${current} → ${target}: ` +
        `${Math.round(usedXp).toLocaleString()} XP`;
    }

    if (modeBy.checked) {
      target = current + Number(levelsUpInput.value);
      usedXp = closedForm(current, target);
      summary.textContent =
        `XP needed to gain ${target - current} levels: ` +
        `${Math.round(usedXp).toLocaleString()} XP`;
    }

    if (modeXp.checked) {
      const xp = Number(xpAmountInput.value);
      const lvl = levelAfterAddingXp(current, xp);
      summary.textContent =
        `Adding ${xp.toLocaleString()} XP results in level ${lvl.toFixed(2)}`;
    }

    show(results);
  });

  resetBtn.onclick = () => {
    xpForm.reset();
    updateModeUI();
    hide(results);
    breakdown.innerHTML = '';
  };

  topBtn.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

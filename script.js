document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');
  const gemRateInput = document.getElementById('gemRate');

  const modeTo = document.getElementById('modeTo');
  const modeBy = document.getElementById('modeBy');
  const modeXp = document.getElementById('modeXp');

  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const byXpRow = document.getElementById('byXpRow');

  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const costSummary = document.getElementById('costSummary');
  const note = document.getElementById('note');
  const breakdown = document.getElementById('breakdown');

  const A = 3.44883;
  const P = 1.70006;
  const CLOSED_P = P + 1;

  function perLevelXp(l) {
    return A * Math.pow(l, P);
  }

  function closedForm(l1, l2) {
    return A * (Math.pow(l2, CLOSED_P) - Math.pow(l1, CLOSED_P)) / CLOSED_P;
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function updateModeUI() {
    show(toLevelRow); hide(byLevelsRow); hide(byXpRow);
    if (modeBy.checked) { hide(toLevelRow); show(byLevelsRow); }
    if (modeXp.checked) { hide(toLevelRow); hide(byLevelsRow); show(byXpRow); }
  }

  modeTo.onchange = modeBy.onchange = modeXp.onchange = updateModeUI;
  updateModeUI();

  xpForm.addEventListener('submit', e => {
    e.preventDefault();

    const current = Math.max(1, Number(currentLevelInput.value));
    const gemRate = Math.max(0, Number(gemRateInput.value));

    let xpNeeded = 0;
    let target = current;

    if (modeTo.checked) {
      target = Math.max(current, Number(targetLevelInput.value));
      xpNeeded = closedForm(current, target);
      summary.textContent = `XP needed from level ${current} → ${target}: ${Math.round(xpNeeded).toLocaleString()} XP`;
    } else if (modeBy.checked) {
      target = current + Math.max(1, Number(levelsUpInput.value));
      xpNeeded = closedForm(current, target);
      summary.textContent = `XP needed to gain ${target - current} levels: ${Math.round(xpNeeded).toLocaleString()} XP`;
    } else {
      xpNeeded = Math.max(0, Number(xpAmountInput.value));
      summary.textContent = `XP being added: ${Math.round(xpNeeded).toLocaleString()} XP`;
    }

    const thousands = xpNeeded / 1000;
    const totalCost = thousands * gemRate;

    costSummary.textContent = `Gem cost @ ${gemRate.toLocaleString()} per 1k XP: ${Math.round(totalCost).toLocaleString()} gems`;

    breakdown.innerHTML = '';
    for (let l = current; l < target && l - current < 100; l++) {
      const li = document.createElement('li');
      li.textContent = `Level ${l} → ${l + 1}: ${Math.round(perLevelXp(l)).toLocaleString()} XP`;
      breakdown.appendChild(li);
    }

    show(results);
  });
});

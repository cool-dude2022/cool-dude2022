// XP Calculator with Money Mode + Tax

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');

  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');
  const moneyAmountInput = document.getElementById('moneyAmount');

  const pricePerMillionInput = document.getElementById('pricePerMillion');
  const taxPercentInput = document.getElementById('taxPercent');

  const modeTo = document.getElementById('modeTo');
  const modeBy = document.getElementById('modeBy');
  const modeXp = document.getElementById('modeXp');
  const modeMoney = document.getElementById('modeMoney');

  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const byXpRow = document.getElementById('byXpRow');
  const byMoneyRow = document.getElementById('byMoneyRow');

  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const note = document.getElementById('note');
  const costSummary = document.getElementById('costSummary');
  const resetBtn = document.getElementById('resetBtn');

  // XP curve constants
  const A = 3.44883;
  const P = 1.70006;
  const CLOSED_P = P + 1;

  function closedForm(l1, l2) {
    return A * (Math.pow(l2, CLOSED_P) - Math.pow(l1, CLOSED_P)) / CLOSED_P;
  }

  function levelAfterAddingXp(current, xp) {
    const base = Math.pow(current, CLOSED_P);
    const added = (xp * CLOSED_P) / A;
    return Math.pow(base + added, 1 / CLOSED_P);
  }

  function updateModeUI() {
    toLevelRow.classList.toggle('hidden', !modeTo.checked);
    byLevelsRow.classList.toggle('hidden', !modeBy.checked);
    byXpRow.classList.toggle('hidden', !modeXp.checked);
    byMoneyRow.classList.toggle('hidden', !modeMoney.checked);
  }

  [modeTo, modeBy, modeXp, modeMoney].forEach(m =>
    m.addEventListener('change', updateModeUI)
  );
  updateModeUI();

  function showCost(xp) {
    const price = Number(pricePerMillionInput.value) || 20000;
    const tax = Number(taxPercentInput.value) || 0;

    const base = (xp / 1_000_000) * price;
    const taxAmount = base * (tax / 100);
    const total = base + taxAmount;

    costSummary.textContent =
      `Base cost: ${base.toLocaleString()} | ` +
      `Tax (${tax}%): ${taxAmount.toLocaleString()} | ` +
      `Total: ${total.toLocaleString()}`;
  }

  xpForm.addEventListener('submit', e => {
    e.preventDefault();

    const current = Math.max(1, Number(currentLevelInput.value) || 1);
    let xp = 0;

    note.textContent = '';

    if (modeTo.checked) {
      const target = Number(targetLevelInput.value);
      xp = closedForm(current, target);
      summary.textContent =
        `XP needed to reach level ${target}: ${Math.round(xp).toLocaleString()}`;
    }

    if (modeBy.checked) {
      const levels = Number(levelsUpInput.value);
      const target = current + levels;
      xp = closedForm(current, target);
      summary.textContent =
        `XP needed to gain ${levels} levels: ${Math.round(xp).toLocaleString()}`;
    }

    if (modeXp.checked) {
      xp = Number(xpAmountInput.value) || 0;
      const finalLevel = Math.floor(levelAfterAddingXp(current, xp));
      summary.textContent =
        `With ${xp.toLocaleString()} XP, you reach level ${finalLevel}`;
    }

    if (modeMoney.checked) {
      const money = Number(moneyAmountInput.value) || 0;
      const price = Number(pricePerMillionInput.value) || 20000;
      const tax = Number(taxPercentInput.value) || 0;

      const effectivePrice = price * (1 + tax / 100);
      xp = (money / effectivePrice) * 1_000_000;

      const finalLevel = Math.floor(levelAfterAddingXp(current, xp));
      const levelsGained = finalLevel - current;

      summary.textContent =
        `With ${money.toLocaleString()} money, you can gain ${levelsGained} levels ` +
        `(reaching level ${finalLevel})`;

      note.textContent =
        `XP received after tax: ${Math.round(xp).toLocaleString()}`;
    }

    showCost(xp);
    results.classList.remove('hidden');
  });

  resetBtn.addEventListener('click', () => {
    xpForm.reset();
    updateModeUI();
    results.classList.add('hidden');
  });
});

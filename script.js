// XP Calculator logic using your formulas:
// Per-level: XP(L -> L+1) = 3.44883 * L^1.70006
// Between-levels (closed form) = 3.44883 * (l2^2.70006 - l1^2.70006) / 2.70006

(function(){
  const K = 3.44883;
  const PER_LEVEL_EXP = 1.70006;
  const SUM_EXP = PER_LEVEL_EXP + 1; // 2.70006

  const form = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const note = document.getElementById('note');
  const breakdown = document.getElementById('breakdown');
  const detailsBlock = document.getElementById('detailsBlock');
  const calculateBtn = document.getElementById('calculateBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Compute per-level XP (rounded to integer)
  function xpForNext(level) {
    const xp = K * Math.pow(level, PER_LEVEL_EXP);
    return Math.round(xp);
  }

  // Closed-form total XP from l1 to l2 (sum of xpForNext for levels l1..l2-1)
  function totalXpClosedForm(l1, l2) {
    const val = K * (Math.pow(l2, SUM_EXP) - Math.pow(l1, SUM_EXP)) / SUM_EXP;
    return Math.round(val);
  }

  // Calculate details and totals
  function calcTotalXP(current, target) {
    // closed form total
    const totalClosed = totalXpClosedForm(current, target);

    // build per-level details (rounded)
    const details = [];
    let sumDetails = 0;
    for (let lvl = current; lvl < target; lvl++) {
      const xp = xpForNext(lvl);
      details.push({ from: lvl, to: lvl + 1, xp });
      sumDetails += xp;
    }

    return { totalClosed, sumDetails, details };
  }

  // UI mode toggle
  form.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'mode') {
      const mode = form.mode.value;
      if (mode === 'to') {
        toLevelRow.classList.remove('hidden');
        byLevelsRow.classList.add('hidden');
      } else {
        toLevelRow.classList.add('hidden');
        byLevelsRow.classList.remove('hidden');
      }
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const current = Math.floor(parseInt(currentLevelInput.value, 10));
    if (isNaN(current) || current < 1) return alert('Enter a valid current level (>= 1)');

    let target;
    const mode = form.mode.value;
    if (mode === 'to') {
      target = Math.floor(parseInt(targetLevelInput.value, 10));
      if (isNaN(target) || target <= current) return alert('Target level must be greater than current level');
    } else {
      const delta = Math.floor(parseInt(levelsUpInput.value, 10));
      if (isNaN(delta) || delta < 1) return alert('Enter a valid number of levels to gain (>=1)');
      target = current + delta;
    }

    const range = target - current;
    if (range <= 0) return alert('Target must be greater than current level');

    const { totalClosed, sumDetails, details } = calcTotalXP(current, target);
    showResults(current, target, totalClosed, sumDetails, details);
  });

  resetBtn.addEventListener('click', () => {
    currentLevelInput.value = 1;
    targetLevelInput.value = 2;
    levelsUpInput.value = 1;
    results.classList.add('hidden');
  });

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
    results.focus && results.focus();
  }

})();
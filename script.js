document.addEventListener('DOMContentLoaded', () => {

  const A = 3.44883;
  const P = 1.70006;
  const CP = P + 1;

  const $ = id => document.getElementById(id);

  function perLevelXp(level) {
    return A * Math.pow(level, P);
  }

  function xpBetween(l1, l2) {
    return A * (Math.pow(l2, CP) - Math.pow(l1, CP)) / CP;
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  // MODE UI SWITCHING
  function updateModeUI() {
    hide($('toLevelRow'));
    hide($('byLevelsRow'));
    hide($('byXpRow'));
    hide($('costRow'));
    hide($('costRateRow'));
    hide($('taxRow'));

    if ($('modeTo').checked) {
      show($('toLevelRow'));
    } else if ($('modeBy').checked) {
      show($('byLevelsRow'));
    } else if ($('modeXp').checked) {
      show($('byXpRow'));
    } else if ($('modeCost').checked) {
      show($('costRow'));
      show($('costRateRow'));
      show($('taxRow'));
    }
  }

  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', updateModeUI);
  });

  updateModeUI();

  // CALCULATE
  $('xpForm').addEventListener('submit', e => {
    e.preventDefault();

    const currentLevel = Math.max(1, Number($('currentLevel').value));
    const gemRate = Number($('gemRate')?.value || 0);
    const taxRate = Number($('xpTax')?.value || 0) / 100;

    let rawXp = 0;
    let gemCost = 0;

    if ($('modeTo').checked) {
      const targetLevel = Number($('targetLevel').value);
      rawXp = xpBetween(currentLevel, targetLevel);
      gemCost = (rawXp / 1000) * gemRate;

      $('summary').textContent =
        `XP needed from level ${currentLevel} → ${targetLevel}: ${Math.round(rawXp).toLocaleString()} XP`;
    }

    else if ($('modeBy').checked) {
      const levels = Number($('levelsUp').value);
      rawXp = xpBetween(currentLevel, currentLevel + levels);
      gemCost = (rawXp / 1000) * gemRate;

      $('summary').textContent =
        `XP needed to gain ${levels} levels: ${Math.round(rawXp).toLocaleString()} XP`;
    }

    else if ($('modeXp').checked) {
      rawXp = Number($('xpAmount').value);
      gemCost = (rawXp / 1000) * gemRate;

      $('summary').textContent =
        `XP selected: ${Math.round(rawXp).toLocaleString()} XP`;
    }

    else if ($('modeCost').checked) {
      const gems = Number($('gemsAvailable').value);
      rawXp = (gems / gemRate) * 1000;
      gemCost = gems;

      $('summary').textContent =
        `With ${gems.toLocaleString()} gems you can buy ${Math.round(rawXp).toLocaleString()} XP`;
    }

    const taxLost = rawXp * taxRate;
    const finalXp = rawXp - taxLost;

    $('summary').textContent +=
      ` (After tax: ${Math.round(finalXp).toLocaleString()} XP)`;

    show($('results'));
  });

});

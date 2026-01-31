document.addEventListener('DOMContentLoaded', () => {
  const A = 3.44883;
  const P = 1.70006;
  const CP = P + 1;

  const $ = id => document.getElementById(id);

  function perLevelXp(l) {
    return A * Math.pow(l, P);
  }

  function closedForm(l1, l2) {
    return A * (Math.pow(l2, CP) - Math.pow(l1, CP)) / CP;
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function updateModeUI() {
    hide($('toLevelRow'));
    hide($('byLevelsRow'));
    hide($('byXpRow'));
    hide($('costRow'));

    if ($('modeTo').checked) show($('toLevelRow'));
    else if ($('modeBy').checked) show($('byLevelsRow'));
    else if ($('modeXp').checked) show($('byXpRow'));
    else if ($('modeCost').checked) show($('costRow'));
  }

  document.querySelectorAll('input[name="mode"]').forEach(r =>
    r.addEventListener('change', updateModeUI)
  );

  updateModeUI();

  $('xpForm').addEventListener('submit', e => {
    e.preventDefault();

    const current = Math.max(1, Number($('currentLevel').value));
    const rate = Number($('gemRate').value);
    const taxRate = Number($('xpTax').value) / 100;

    let rawXp = 0;
    let cost = 0;

    if ($('modeTo').checked) {
      const target = Number($('targetLevel').value);
      rawXp = closedForm(current, target);
      cost = (rawXp / 1000) * rate;
      $('summary').textContent =
        `XP needed from level ${current} → ${target}: ${Math.round(rawXp).toLocaleString()} XP`;
    }

    else if ($('modeBy').checked) {
      const levels = Number($('levelsUp').value);
      rawXp = closedForm(current, current + levels);
      cost = (rawXp / 1000) * rate;
      $('summary').textContent =
        `XP needed to gain ${levels} levels: ${Math.round(rawXp).toLocaleString()} XP`;
    }

    else if ($('modeXp').checked) {
      rawXp = Number($('xpAmount').value);
      cost = (rawXp / 1000) * rate;
      $('summary').textContent =
        `XP selected: ${Math.round(rawXp).toLocaleString()} XP`;
    }

    else if ($('modeCost').checked) {
      const gems = Number($('availableGems').value);
      rawXp = (gems / rate) * 1000;
      cost = gems;
      $('summary').textContent =
        `With ${gems.toLocaleString()} gems you can buy:`;
    }

    const lostXp = rawXp * taxRate;
    const netXp = rawXp - lostXp;

    $('costSummary').textContent =
      `Cost: ${Math.round(cost).toLocaleString()} gems`;

    $('taxSummary').textContent =
      `XP after ${$('xpTax').value}% tax: ${Math.round(netXp).toLocaleString()} XP`;

    const progress = Math.min((netXp / perLevelXp(current)) * 100, 100);
    $('progressFill').style.width = `${progress}%`;
    $('progressText').textContent =
      `Progress toward next level: ${Math.round(progress)}%`;

    show($('results'));
  });
});

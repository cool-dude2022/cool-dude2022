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

  function applyTax(xp, tax) {
    const lost = xp * (tax / 100);
    return { net: xp - lost, lost };
  }

  function xpFromGems(gems, rate) {
    return (gems / rate) * 1000;
  }

  function updateMode() {
    $('toLevelRow').classList.toggle('hidden', !$('modeTo').checked);
    $('byLevelsRow').classList.toggle('hidden', !$('modeBy').checked);
    $('byXpRow').classList.toggle('hidden', !$('modeXp').checked);
  }

  document.querySelectorAll('input[name="mode"]').forEach(r => r.onchange = updateMode);
  updateMode();

  $('xpForm').onsubmit = e => {
    e.preventDefault();

    const current = Number($('currentLevel').value);
    const gemRate = Number($('gemRate').value);
    const gems = Number($('availableGems').value || 0);
    const tax = Number($('xpTax').value);

    let rawXp = 0;
    let target = current;

    if ($('modeTo').checked) {
      target = Number($('targetLevel').value);
      rawXp = closedForm(current, target);
    } else if ($('modeBy').checked) {
      target = current + Number($('levelsUp').value);
      rawXp = closedForm(current, target);
    } else {
      rawXp = Number($('xpAmount').value);
    }

    if (gems > 0) {
      rawXp = Math.min(rawXp, xpFromGems(gems, gemRate));
    }

    const taxed = applyTax(rawXp, tax);
    const cost = (rawXp / 1000) * gemRate;

    $('summary').textContent =
      `Raw XP: ${Math.round(rawXp).toLocaleString()} XP → Net XP: ${Math.round(taxed.net).toLocaleString()} XP`;

    $('cost').textContent =
      `Gem cost: ${Math.round(cost).toLocaleString()} gems`;

    $('tax').textContent =
      `XP tax (${tax}%): -${Math.round(taxed.lost).toLocaleString()} XP`;

    const progress = Math.min((taxed.net / perLevelXp(current)) * 100, 100);
    $('progressFill').style.width = `${progress}%`;
    $('progressText').textContent = `Progress to next level: ${Math.round(progress)}%`;

    $('results').classList.remove('hidden');
  };
});

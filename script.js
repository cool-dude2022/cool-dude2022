// XP Calculator - redesigned for predictable scrolling and accessibility

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const fromKillCheckbox = document.getElementById('fromKill');
  const xpAmountInput = document.getElementById('xpAmount');
  const moneyAmountInput = document.getElementById('moneyAmount');
  const levelsToSellInput = document.getElementById('levelsToSell');
  const levelsToBuyInput = document.getElementById('levelsToBuy');
  const costPerMillionInput = document.getElementById('costPerMillion');
  const taxRateInput = document.getElementById('taxRate');
  const applyTaxCheckbox = document.getElementById('applyTax');
  
  const gemModeBuyXp = document.getElementById('gemModeBuyXp');
  const gemModeBuyLevels = document.getElementById('gemModeBuyLevels');
  const gemModeSell = document.getElementById('gemModeSell');
  const gemBuyXpSection = document.getElementById('gemBuyXpSection');
  const gemBuyLevelsSection = document.getElementById('gemBuyLevelsSection');
  const gemSellSection = document.getElementById('gemSellSection');
  const moneyInputSection = document.getElementById('moneyInputSection');
  const moneyTargetSection = document.getElementById('moneyTargetSection');

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
  const breakdown = document.getElementById('breakdown');
  const detailsBlock = document.getElementById('detailsBlock');
  const resetBtn = document.getElementById('resetBtn');
  const topBtn = document.getElementById('topBtn');
  const exportBtn = document.getElementById('exportBtn');
  
  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const progressPercent = document.getElementById('progressPercent');
  const progressDetails = document.getElementById('progressDetails');

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

  // Gem conversion functions - using dynamic values from inputs
  function getGemSettings() {
    const costPerMillion = Math.max(1, Number(costPerMillionInput.value) || 20000);
    const taxRate = Math.max(0, Math.min(100, Number(taxRateInput.value) || 25)) / 100;
    const useTax = applyTaxCheckbox.checked;
    return { costPerMillion, taxRate, useTax };
  }

  function gemsToXp(gems) {
    const { costPerMillion, taxRate, useTax } = getGemSettings();
    // After tax deduction (if enabled), you get (1 - taxRate) of the XP
    const afterTax = useTax ? gems * (1 - taxRate) : gems;
    return (afterTax / costPerMillion) * 1000000;
  }

  function xpToGems(xp) {
    const { costPerMillion, taxRate, useTax } = getGemSettings();
    // Calculate gross gems before tax
    const grossGems = (xp / 1000000) * costPerMillion;
    // Add tax back to show what user needs to pay (if tax enabled)
    return useTax ? grossGems / (1 - taxRate) : grossGems;
  }

  function updateProgressBar(currentLevel, fractionalLevel) {
    const current = Math.floor(currentLevel);
    const next = current + 1;
    const fraction = fractionalLevel - current;
    const percent = Math.min(100, Math.max(0, fraction * 100));
    
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    progressLabel.textContent = `Progress to level ${next}`;
    
    const xpNeeded = perLevelXp(current);
    const xpGained = xpNeeded * fraction;
    progressDetails.textContent = `${Math.round(xpGained).toLocaleString()} / ${Math.round(xpNeeded).toLocaleString()} XP`;
    
    showElement(progressSection);
  }

  // UI helpers
  function showElement(el) { el.classList.remove('hidden'); }
  function hideElement(el) { el.classList.add('hidden'); }

  function updateModeUI() {
    if (modeTo.checked) {
      showElement(toLevelRow);
      hideElement(byLevelsRow);
      hideElement(byXpRow);
      hideElement(byMoneyRow);
    } else if (modeBy.checked) {
      hideElement(toLevelRow);
      showElement(byLevelsRow);
      hideElement(byXpRow);
      hideElement(byMoneyRow);
    } else if (modeXp.checked) {
      hideElement(toLevelRow);
      hideElement(byLevelsRow);
      showElement(byXpRow);
      hideElement(byMoneyRow);
    } else if (modeMoney.checked) {
      hideElement(toLevelRow);
      hideElement(byLevelsRow);
      hideElement(byXpRow);
      showElement(byMoneyRow);
    }
  }

  modeTo.addEventListener('change', updateModeUI);
  modeBy.addEventListener('change', updateModeUI);
  modeXp.addEventListener('change', updateModeUI);
  modeMoney.addEventListener('change', updateModeUI);
  updateModeUI();

  // Handle gem mode (buy XP vs buy levels vs sell) toggle
  gemModeBuyXp.addEventListener('change', () => {
    if (gemModeBuyXp.checked) {
      showElement(gemBuyXpSection);
      hideElement(gemBuyLevelsSection);
      hideElement(gemSellSection);
    }
  });
  
  gemModeBuyLevels.addEventListener('change', () => {
    if (gemModeBuyLevels.checked) {
      hideElement(gemBuyXpSection);
      showElement(gemBuyLevelsSection);
      hideElement(gemSellSection);
    }
  });
  
  gemModeSell.addEventListener('change', () => {
    if (gemModeSell.checked) {
      hideElement(gemBuyXpSection);
      hideElement(gemBuyLevelsSection);
      showElement(gemSellSection);
    }
  });

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
      hideElement(progressSection);
    } else if (modeBy.checked) {
      const n = Math.max(1, Math.floor(Number(levelsUpInput.value) || 1));
      target = current + n;
      usedXp = closedForm(current, target);
      
      let summaryText = `Total XP required to go from level ${current} to level ${target}: ${Math.round(usedXp).toLocaleString()} XP (closed-form)`;
      
      if (fromKillCheckbox.checked) {
        // If from kill, apply tax and show gem cost
        const { taxRate, costPerMillion, useTax } = getGemSettings();
        const effectiveTaxRate = useTax ? taxRate : 0;
        const xpAfterTax = usedXp * (1 - effectiveTaxRate);
        const gemCost = xpToGems(usedXp);
        
        if (useTax) {
          summaryText += `. After ${(effectiveTaxRate * 100).toFixed(1)}% kill tax, you receive ${Math.round(xpAfterTax).toLocaleString()} XP. Gem cost: ${Math.round(gemCost).toLocaleString()} gems.`;
        } else {
          summaryText += `. Gem cost: ${Math.round(gemCost).toLocaleString()} gems (no tax applied).`;
        }
      }
      
      summary.textContent = summaryText;
      hideElement(progressSection);
    } else if (modeXp.checked) {
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
      
      // Update progress bar
      updateProgressBar(target, fractionalLevel);
    } else if (modeMoney.checked) {
      // Gems mode
      const { taxRate, costPerMillion, useTax } = getGemSettings();
      
      if (gemModeSell.checked) {
        // Sell mode: calculate gem value of selling X levels (must be whole levels)
        const levelsToSell = Math.max(1, Math.floor(Number(levelsToSellInput.value) || 1));
        
        if (levelsToSell >= current) {
          summary.textContent = 'You cannot sell more levels than you currently have.';
          showElement(results);
          hideElement(note);
          hideElement(progressSection);
          breakdown.innerHTML = '';
          return;
        }
        
        // Calculate XP from current level down by levelsToSell (complete levels only)
        const newLevel = current - levelsToSell;
        target = newLevel;
        usedXp = closedForm(newLevel, current);
        const gemsValue = xpToGems(usedXp);
        
        let summaryText = `Selling ${levelsToSell} level${levelsToSell > 1 ? 's' : ''} (from level ${current} to level ${newLevel}) = ${Math.round(usedXp).toLocaleString()} XP worth ${Math.round(gemsValue).toLocaleString()} gems`;
        
        if (useTax) {
          const taxAmount = gemsValue * taxRate;
          const netGems = gemsValue * (1 - taxRate);
          summaryText += ` (tax: ${Math.round(taxAmount).toLocaleString()}, net: ${Math.round(netGems).toLocaleString()})`;
        }
        summaryText += '.';
        
        summary.textContent = summaryText;
        
        let noteText = `After selling, you'll be level ${newLevel}. Rate: ${costPerMillion.toLocaleString()} gems per 1M XP`;
        if (useTax) {
          noteText += ` with ${(taxRate * 100).toFixed(1)}% tax`;
        }
        noteText += '.';
        note.textContent = noteText;
        showElement(note);
        hideElement(progressSection);
        
      } else if (gemModeBuyLevels.checked) {
        // Buy levels mode: calculate gem cost to buy X levels
        const levelsToBuy = Math.max(1, Math.floor(Number(levelsToBuyInput.value) || 1));
        target = current + levelsToBuy;
        usedXp = closedForm(current, target);
        const gemCost = xpToGems(usedXp);
        
        let summaryText = `To buy ${levelsToBuy} level${levelsToBuy > 1 ? 's' : ''} (from level ${current} to level ${target}), you need ${Math.round(gemCost).toLocaleString()} gems for ${Math.round(usedXp).toLocaleString()} XP`;
        
        if (useTax) {
          const taxAmount = gemCost * taxRate;
          const netGems = gemCost * (1 - taxRate);
          summaryText += ` (tax: ${Math.round(taxAmount).toLocaleString()}, net: ${Math.round(netGems).toLocaleString()})`;
        }
        summaryText += '.';
        
        summary.textContent = summaryText;
        hideElement(note);
        hideElement(progressSection);
        
      } else {
        // Buy XP mode: calculate level from gems
        const gemsInput = Math.max(0, Number(moneyAmountInput.value) || 0);
        const xpFromGems = gemsToXp(gemsInput);
        
        fractionalLevel = levelAfterAddingXp(current, xpFromGems);
        const targetInt = Math.floor(fractionalLevel);
        target = Math.max(current, targetInt);
        usedXp = closedForm(current, target);
        const leftover = xpFromGems - usedXp;
        
        // Calculate progress
        let progressText = '';
        if (fractionalLevel > target) {
          const fractionalPart = fractionalLevel - target;
          const percent = Math.min(100, Math.round(fractionalPart * 100));
          progressText = ` (~${percent}% towards level ${target + 1})`;
        } else if (target === current && xpFromGems < perLevelXp(current)) {
          const progress = Math.round((xpFromGems / perLevelXp(current)) * 100);
          progressText = ` (~${Math.max(0, Math.min(100, progress))}% towards level ${current + 1})`;
        }
        
        let summaryText = `With ${gemsInput.toLocaleString()} gems`;
        if (useTax) {
          const taxAmount = gemsInput * taxRate;
          const netGems = gemsInput * (1 - taxRate);
          summaryText += ` (tax: ${taxAmount.toLocaleString()}, net: ${netGems.toLocaleString()})`;
        }
        summaryText += `, you can buy ${Math.round(xpFromGems).toLocaleString()} XP and reach level ${Math.floor(fractionalLevel)}${progressText}. (Exact fractional level: ${fractionalLevel.toFixed(4)})`;
        
        summary.textContent = summaryText;
        
        if (leftover >= 0) {
          let leftoverGems = (leftover / 1000000) * costPerMillion;
          if (useTax) {
            leftoverGems *= (1 - taxRate);
          }
          note.textContent = `XP consumed to reach level ${target}: ${Math.round(Math.max(0, usedXp)).toLocaleString()} XP. Leftover: ${Math.round(leftover).toLocaleString()} XP (worth ~${leftoverGems.toLocaleString()} gems${useTax ? ' after tax' : ''}).`;
          showElement(note);
        } else {
          note.textContent = '';
          hideElement(note);
        }
        
        // Update progress bar
        updateProgressBar(target, fractionalLevel);
      }
    }

    // for non-XP and non-Money mode we still offer per-level breakdown (if range reasonable)
    if (!modeXp.checked && !modeMoney.checked) {
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
      // in XP or Money mode we can optionally show a compact breakdown:
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

  exportBtn.addEventListener('click', () => {
    let exportText = '=== XP CALCULATOR RESULTS ===\n\n';
    exportText += summary.textContent + '\n\n';
    
    if (note.textContent && !note.classList.contains('hidden')) {
      exportText += note.textContent + '\n\n';
    }
    
    if (progressSection && !progressSection.classList.contains('hidden')) {
      exportText += `${progressLabel.textContent}: ${progressPercent.textContent}\n`;
      exportText += `${progressDetails.textContent}\n\n`;
    }
    
    if (breakdown.children.length > 0 && detailsBlock.open) {
      exportText += '--- Per-Level Breakdown ---\n';
      Array.from(breakdown.children).forEach(li => {
        exportText += li.textContent + '\n';
      });
      exportText += '\n';
    }
    
    exportText += '---\n';
    exportText += 'Generated by XP Calculator\n';
    exportText += `Date: ${new Date().toLocaleString()}\n`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(exportText).then(() => {
      const originalText = exportBtn.textContent;
      exportBtn.textContent = '✓ Copied to Clipboard!';
      setTimeout(() => {
        exportBtn.textContent = originalText;
      }, 2000);
    }).catch(err => {
      alert('Export text:\n\n' + exportText);
    });
  });

  resetBtn.addEventListener('click', () => {
    xpForm.reset();
    updateModeUI();
    hideElement(results);
    hideElement(progressSection);
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
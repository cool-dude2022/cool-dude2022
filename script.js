// XP Calculator - redesigned for predictable scrolling and accessibility

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');
  const moneyAmountInput = document.getElementById('moneyAmount');
  const buyXpAmountInput = document.getElementById('buyXpAmount');
  const sellCurrentLevelInput = document.getElementById('sellCurrentLevel');
  const sellToLevelInput = document.getElementById('sellToLevel');
  const costPerMillionInput = document.getElementById('costPerMillion');
  const taxRateInput = document.getElementById('taxRate');
  const applyTaxCheckbox = document.getElementById('applyTax');
  const taxRateBox = document.getElementById('taxRateBox');
  
  const gemModeBuyXp = document.getElementById('gemModeBuyXp');
  const gemModeSell = document.getElementById('gemModeSell');
  const buyWithGems = document.getElementById('buyWithGems');
  const buyWithXp = document.getElementById('buyWithXp');
  const gemBuyXpSection = document.getElementById('gemBuyXpSection');
  const buyGemsInput = document.getElementById('buyGemsInput');
  const buyXpInput = document.getElementById('buyXpInput');
  const gemSellSection = document.getElementById('gemSellSection');

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

  // Handle tax toggle - show/hide tax rate box
  applyTaxCheckbox.addEventListener('change', () => {
    if (applyTaxCheckbox.checked) {
      showElement(taxRateBox);
    } else {
      hideElement(taxRateBox);
    }
  });

  // Handle gem mode (buy vs sell) toggle
  gemModeBuyXp.addEventListener('change', () => {
    if (gemModeBuyXp.checked) {
      showElement(gemBuyXpSection);
      hideElement(gemSellSection);
    }
  });
  
  gemModeSell.addEventListener('change', () => {
    if (gemModeSell.checked) {
      hideElement(gemBuyXpSection);
      showElement(gemSellSection);
    }
  });
  
  // Handle buy with gems vs XP toggle
  buyWithGems.addEventListener('change', () => {
    if (buyWithGems.checked) {
      showElement(buyGemsInput);
      hideElement(buyXpInput);
    }
  });
  
  buyWithXp.addEventListener('change', () => {
    if (buyWithXp.checked) {
      hideElement(buyGemsInput);
      showElement(buyXpInput);
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
      
      summary.textContent = `Total XP required to go from level ${current} to level ${target}: ${Math.round(usedXp).toLocaleString()} XP (closed-form)`;
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
        // Sell mode: use dedicated sell inputs
        const actualCurrentLevel = Math.max(1, Math.floor(Number(sellCurrentLevelInput.value) || 50));
        const sellToLevel = Math.max(1, Math.floor(Number(sellToLevelInput.value) || 45));
        
        if (sellToLevel >= actualCurrentLevel) {
          summary.textContent = 'Sell-to level must be lower than your current level.';
          showElement(results);
          hideElement(note);
          hideElement(progressSection);
          breakdown.innerHTML = '';
          return;
        }
        
        const levelsToSell = actualCurrentLevel - sellToLevel;
        
        // Calculate XP from sellToLevel to actualCurrentLevel
        target = sellToLevel;
        usedXp = closedForm(sellToLevel, actualCurrentLevel);
        const gemsValue = xpToGems(usedXp);
        
        let summaryText = `Selling ${levelsToSell} level${levelsToSell > 1 ? 's' : ''} (from level ${actualCurrentLevel} down to level ${sellToLevel}) = ${Math.round(usedXp).toLocaleString()} XP worth ${Math.round(gemsValue).toLocaleString()} gems`;
        
        if (useTax) {
          const taxAmount = gemsValue * taxRate;
          const netGems = gemsValue * (1 - taxRate);
          summaryText += ` (tax: ${Math.round(taxAmount).toLocaleString()}, net: ${Math.round(netGems).toLocaleString()})`;
        }
        summaryText += '.';
        
        summary.textContent = summaryText;
        
        let noteText = `After selling, you'll be level ${sellToLevel}. Rate: ${costPerMillion.toLocaleString()} gems per 1M XP`;
        if (useTax) {
          noteText += ` with ${(taxRate * 100).toFixed(1)}% tax`;
        }
        noteText += '.';
        note.textContent = noteText;
        showElement(note);
        hideElement(progressSection);
        
      } else {
        // Buy mode: buy with gems or XP
        if (buyWithXp.checked) {
          // Buy with XP: show gem cost for that XP
          const xpInput = Math.max(0, Number(buyXpAmountInput.value) || 0);
          
          fractionalLevel = levelAfterAddingXp(current, xpInput);
          const targetInt = Math.floor(fractionalLevel);
          target = Math.max(current, targetInt);
          usedXp = closedForm(current, target);
          const leftover = xpInput - usedXp;
          const gemCost = xpToGems(xpInput);
          
          // Calculate progress
          let progressText = '';
          if (fractionalLevel > target) {
            const fractionalPart = fractionalLevel - target;
            const percent = Math.min(100, Math.round(fractionalPart * 100));
            progressText = ` (~${percent}% towards level ${target + 1})`;
          } else if (target === current && xpInput < perLevelXp(current)) {
            const progress = Math.round((xpInput / perLevelXp(current)) * 100);
            progressText = ` (~${Math.max(0, Math.min(100, progress))}% towards level ${current + 1})`;
          }
          
          let summaryText = `${Math.round(xpInput).toLocaleString()} XP costs ${Math.round(gemCost).toLocaleString()} gems`;
          if (useTax) {
            const taxAmount = gemCost * taxRate;
            const netGems = gemCost * (1 - taxRate);
            summaryText += ` (tax: ${Math.round(taxAmount).toLocaleString()}, net: ${Math.round(netGems).toLocaleString()})`;
          }
          summaryText += ` and will take you to level ${Math.floor(fractionalLevel)}${progressText}. (Exact fractional level: ${fractionalLevel.toFixed(4)})`;
          
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
          
          updateProgressBar(target, fractionalLevel);
          
        } else {
          // Buy with gems: calculate level from gems (original logic)
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
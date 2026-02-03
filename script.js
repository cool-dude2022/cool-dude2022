// XP Calculator - redesigned for predictable scrolling and accessibility

// Number parsing and formatting utilities
function parseNumberInput(value) {
  if (typeof value === 'number') return value;
  
  // Remove commas first
  let str = String(value).toLowerCase().replace(/,/g, '').trim();
  
  // Check for shorthand notation
  if (str.endsWith('k')) {
    return parseFloat(str) * 1000;
  } else if (str.endsWith('m')) {
    return parseFloat(str) * 1000000;
  } else if (str.endsWith('b')) {
    return parseFloat(str) * 1000000000;
  }
  
  // Regular number
  return parseFloat(str) || 0;
}

function formatNumberWithCommas(num) {
  return Math.round(num).toLocaleString();
}

document.addEventListener('DOMContentLoaded', () => {
  const xpForm = document.getElementById('xpForm');
  const currentLevelInput = document.getElementById('currentLevel');
  const targetLevelInput = document.getElementById('targetLevel');
  const levelsUpInput = document.getElementById('levelsUp');
  const xpAmountInput = document.getElementById('xpAmount');
  const victimLevelKillInput = document.getElementById('victimLevelKill');
  const killTaxRateInput = document.getElementById('killTaxRate');
  
  const moneyAmountInput = document.getElementById('moneyAmount');
  const buyXpAmountInput = document.getElementById('buyXpAmount');
  const sellCurrentLevelInput = document.getElementById('sellCurrentLevel');
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
  const modeKill = document.getElementById('modeKill');
  const modeMoney = document.getElementById('modeMoney');

  const toLevelRow = document.getElementById('toLevelRow');
  const byLevelsRow = document.getElementById('byLevelsRow');
  const byXpRow = document.getElementById('byXpRow');
  const byKillRow = document.getElementById('byKillRow');
  const byMoneyRow = document.getElementById('byMoneyRow');

  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const note = document.getElementById('note');
  const breakdown = document.getElementById('breakdown');
  const detailsBlock = document.getElementById('detailsBlock');
  const resetBtn = document.getElementById('resetBtn');
  const topBtn = document.getElementById('topBtn');
  const exportBtn = document.getElementById('exportBtn');
  const saveCalcBtn = document.getElementById('saveCalcBtn');
  
  const savedCalcs = document.getElementById('savedCalcs');
  const savedCalcsList = document.getElementById('savedCalcsList');
  const clearSavedBtn = document.getElementById('clearSavedBtn');
  
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
    const costPerMillion = Math.max(1, parseNumberInput(costPerMillionInput.value) || 20000);
    const taxRate = Math.max(0, Math.min(100, Number(taxRateInput.value) || 25)) / 100;
    const useTax = applyTaxCheckbox.checked;
    return { costPerMillion, taxRate, useTax };
  }

  function gemsToXp(gems) {
    const { costPerMillion, taxRate, useTax } = getGemSettings();
    // Calculate base XP from gems
    const baseXp = (gems / costPerMillion) * 1000000;
    // If tax is enabled, you only receive (1 - taxRate) of the XP
    return useTax ? baseXp * (1 - taxRate) : baseXp;
  }

  function xpToGems(xp) {
    const { costPerMillion, taxRate, useTax } = getGemSettings();
    // If tax is enabled, you need to buy more XP to account for the loss
    // To get X XP after tax, you need to buy X / (1 - taxRate) XP
    const requiredXp = useTax ? xp / (1 - taxRate) : xp;
    // Calculate gem cost based on required XP
    return (requiredXp / 1000000) * costPerMillion;
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
      hideElement(byKillRow);
      hideElement(byMoneyRow);
    } else if (modeBy.checked) {
      hideElement(toLevelRow);
      showElement(byLevelsRow);
      hideElement(byXpRow);
      hideElement(byKillRow);
      hideElement(byMoneyRow);
    } else if (modeXp.checked) {
      hideElement(toLevelRow);
      hideElement(byLevelsRow);
      showElement(byXpRow);
      hideElement(byKillRow);
      hideElement(byMoneyRow);
    } else if (modeKill.checked) {
      hideElement(toLevelRow);
      hideElement(byLevelsRow);
      hideElement(byXpRow);
      showElement(byKillRow);
      hideElement(byMoneyRow);
    } else if (modeMoney.checked) {
      hideElement(toLevelRow);
      hideElement(byLevelsRow);
      hideElement(byXpRow);
      hideElement(byKillRow);
      showElement(byMoneyRow);
    }
  }

  modeTo.addEventListener('change', updateModeUI);
  modeBy.addEventListener('change', updateModeUI);
  modeXp.addEventListener('change', updateModeUI);
  modeKill.addEventListener('change', updateModeUI);
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

  // Warn when changing kill tax from default
  let killTaxWarningShown = false;
  killTaxRateInput.addEventListener('change', () => {
    const value = parseFloat(killTaxRateInput.value);
    if (value !== 25 && !killTaxWarningShown) {
      if (!confirm('Are you sure? The default kill tax for Tank Game is 25%.')) {
        killTaxRateInput.value = 25;
      } else {
        killTaxWarningShown = true;
      }
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
    ev.stopPropagation();
    
    console.log('Form submitted - calculating...');

    // Clear previous results to avoid confusion
    summary.innerHTML = '';
    note.textContent = '';
    hideElement(note);
    hideElement(progressSection);
    breakdown.innerHTML = '';

    const current = Math.max(1, Math.floor(parseNumberInput(currentLevelInput.value) || 1));
    
    console.log('Current level:', current);

    let target;
    let usedXp = 0;
    let givenXp = 0;
    let fractionalLevel = null;

    if (modeTo.checked) {
      target = Math.max(1, Math.floor(parseNumberInput(targetLevelInput.value) || current));
      if (target <= current) {
        summary.textContent = 'Target must be greater than current level.';
        showElement(results);
        hideElement(note);
        breakdown.innerHTML = '';
        return;
      }
      usedXp = closedForm(current, target);
      
      let summaryText = `<div class="gem-highlight"><span class="gem-amount">${formatNumberWithCommas(usedXp)} XP</span><span class="gem-label">XP Required</span></div>`;
      summaryText += `To go from level ${current} to level ${target}`;
      
      summary.innerHTML = summaryText;
      hideElement(progressSection);
    } else if (modeBy.checked) {
      const n = Math.max(1, Math.floor(parseNumberInput(levelsUpInput.value) || 1));
      target = current + n;
      usedXp = closedForm(current, target);
      
      let summaryText = `<div class="gem-highlight"><span class="gem-amount">${formatNumberWithCommas(usedXp)} XP</span><span class="gem-label">XP Needed for ${n} Level${n > 1 ? 's' : ''}</span></div>`;
      summaryText += `To go from level ${current} to level ${target}, you need ${formatNumberWithCommas(usedXp)} XP`;
      
      summary.innerHTML = summaryText;
      hideElement(progressSection);
    } else if (modeXp.checked) {
      givenXp = Math.max(0, parseNumberInput(xpAmountInput.value) || 0);
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

      let summaryText = `<div class="gem-highlight"><span class="gem-amount">Level ${Math.floor(fractionalLevel)}</span><span class="gem-label">New Level After Adding XP</span></div>`;
      summaryText += `Adding ${formatNumberWithCommas(givenXp)} XP from level ${current}${progressText}. (Exact: ${fractionalLevel.toFixed(4)})`;
      
      summary.innerHTML = summaryText;
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
    } else if (modeKill.checked) {
      // Kill calculator mode - uses main "Current level" input
      const yourCurrentLevel = current; // Use the main current level
      const victimCurrentLevel = Math.max(1, Math.floor(parseNumberInput(victimLevelKillInput.value) || 50));
      
      // Calculate victim's total XP (from level 1 to their level)
      const victimTotalXp = closedForm(1, victimCurrentLevel);
      
      // Apply kill tax from the kill tax input
      const killTaxRate = Math.max(0, Math.min(100, Number(killTaxRateInput.value) || 25)) / 100;
      const xpGained = victimTotalXp * (1 - killTaxRate);
      
      // Calculate new level after gaining this XP
      fractionalLevel = levelAfterAddingXp(yourCurrentLevel, xpGained);
      const newLevel = Math.floor(fractionalLevel);
      target = newLevel;
      
      // Calculate progress
      let progressText = '';
      if (fractionalLevel > newLevel) {
        const fractionalPart = fractionalLevel - newLevel;
        const percent = Math.min(100, Math.round(fractionalPart * 100));
        progressText = ` (~${percent}% towards level ${newLevel + 1})`;
      }
      
      let summaryText = `<div class="gem-highlight"><span class="gem-amount">Level ${newLevel}</span><span class="gem-label">Your New Level After Kill</span></div>`;
      summaryText += `Eliminating level ${victimCurrentLevel} player (${formatNumberWithCommas(victimTotalXp)} XP total)`;
      summaryText += ` → After ${(killTaxRate * 100).toFixed(1)}% kill tax, you gain ${formatNumberWithCommas(xpGained)} XP`;
      summaryText += `. Your level: ${yourCurrentLevel} → ${newLevel}${progressText}. (Exact: ${fractionalLevel.toFixed(4)})`;
      
      summary.innerHTML = summaryText;
      
      const levelGain = newLevel - yourCurrentLevel;
      note.textContent = `You gained ${levelGain} level${levelGain !== 1 ? 's' : ''}. Your XP increased by ${formatNumberWithCommas(xpGained)}.`;
      showElement(note);
      
      // Update progress bar
      updateProgressBar(newLevel, fractionalLevel);
    } else if (modeMoney.checked) {
      // Gems mode
      const { taxRate, costPerMillion, useTax } = getGemSettings();
      
      if (gemModeSell.checked) {
        // Sell mode: sell ALL levels (down to level 1)
        const actualCurrentLevel = Math.max(1, Math.floor(parseNumberInput(sellCurrentLevelInput.value) || 50));
        
        if (actualCurrentLevel <= 1) {
          summary.textContent = 'You must be at least level 2 to sell levels.';
          showElement(results);
          hideElement(note);
          hideElement(progressSection);
          breakdown.innerHTML = '';
          return;
        }
        
        const sellToLevel = 1; // Always sell down to level 1
        const levelsToSell = actualCurrentLevel - 1;
        
        // Calculate XP from level 1 to actualCurrentLevel
        target = sellToLevel;
        usedXp = closedForm(sellToLevel, actualCurrentLevel);
        const gemsValue = xpToGems(usedXp);
        
        // Create gem highlight box
        let summaryText = `<div class="gem-highlight"><span class="gem-amount">${formatNumberWithCommas(gemsValue)} gems</span><span class="gem-label">Value of ALL ${levelsToSell} level${levelsToSell > 1 ? 's' : ''}</span></div>`;
        summaryText += `Selling ALL levels from level ${actualCurrentLevel} down to level 1 = ${formatNumberWithCommas(usedXp)} XP`;
        
        if (useTax) {
          const taxAmount = gemsValue * taxRate;
          const netGems = gemsValue * (1 - taxRate);
          summaryText += ` (tax: ${formatNumberWithCommas(taxAmount)}, net: ${formatNumberWithCommas(netGems)})`;
        }
        summaryText += '.';
        
        summary.innerHTML = summaryText;
        
        let noteText = `After selling, you'll be level 1. Rate: ${formatNumberWithCommas(costPerMillion)} gems per 1M XP`;
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
          const xpInput = Math.max(0, parseNumberInput(buyXpAmountInput.value) || 0);
          
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
          
          let summaryText = `<div class="gem-highlight"><span class="gem-amount">${formatNumberWithCommas(gemCost)} gems</span><span class="gem-label">Cost for ${formatNumberWithCommas(xpInput)} XP</span></div>`;
          if (useTax) {
            const taxAmount = gemCost * taxRate;
            const netGems = gemCost * (1 - taxRate);
            summaryText += `Tax: ${formatNumberWithCommas(taxAmount)}, Net: ${formatNumberWithCommas(netGems)} • `;
          }
          summaryText += `Takes you to level ${Math.floor(fractionalLevel)}${progressText}. (Exact: ${fractionalLevel.toFixed(4)})`;
          
          summary.innerHTML = summaryText;
          
          if (leftover >= 0) {
            let leftoverGems = (leftover / 1000000) * costPerMillion;
            if (useTax) {
              leftoverGems *= (1 - taxRate);
            }
            note.textContent = `XP consumed to reach level ${target}: ${formatNumberWithCommas(Math.max(0, usedXp))} XP. Leftover: ${formatNumberWithCommas(leftover)} XP (worth ~${formatNumberWithCommas(leftoverGems)} gems${useTax ? ' after tax' : ''}).`;
            showElement(note);
          } else {
            note.textContent = '';
            hideElement(note);
          }
          
          updateProgressBar(target, fractionalLevel);
          
        } else {
          // Buy with gems: calculate level from gems (original logic)
        const gemsInput = Math.max(0, parseNumberInput(moneyAmountInput.value) || 0);
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
        
        let summaryText = `<div class="gem-highlight"><span class="gem-amount">${formatNumberWithCommas(xpFromGems)} XP → Level ${Math.floor(fractionalLevel)}</span><span class="gem-label">XP Purchased & Level Reached</span></div>`;
        summaryText += `With ${formatNumberWithCommas(gemsInput)} gems`;
        if (useTax) {
          const taxAmount = gemsInput * taxRate;
          const netGems = gemsInput * (1 - taxRate);
          summaryText += ` (${(taxRate * 100).toFixed(1)}% tax)`;
        }
        summaryText += `${progressText}. (Exact: ${fractionalLevel.toFixed(4)})`;
        
        summary.innerHTML = summaryText;
        
        if (leftover >= 0) {
          let leftoverGems = (leftover / 1000000) * costPerMillion;
          if (useTax) {
            leftoverGems *= (1 - taxRate);
          }
          note.textContent = `XP consumed to reach level ${target}: ${formatNumberWithCommas(Math.max(0, usedXp))} XP. Leftover: ${formatNumberWithCommas(leftover)} XP (worth ~${formatNumberWithCommas(leftoverGems)} gems${useTax ? ' after tax' : ''}).`;
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

  // Saved calculations functionality
  let savedCalculations = JSON.parse(localStorage.getItem('savedCalcs') || '[]');
  
  function renderSavedCalcs() {
    if (savedCalculations.length === 0) {
      hideElement(savedCalcs);
      return;
    }
    
    showElement(savedCalcs);
    savedCalcsList.innerHTML = '';
    
    savedCalculations.forEach((calc, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="saved-title">${calc.title}</div>
        <div class="saved-details">${calc.details}</div>
        <button class="delete-saved" data-index="${index}">Delete</button>
      `;
      
      li.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-saved')) {
          // Load this calculation
          summary.innerHTML = calc.summary;
          if (calc.note) {
            note.textContent = calc.note;
            showElement(note);
          }
          showElement(results);
          window.scrollTo({ top: document.getElementById('results').offsetTop - 20, behavior: 'smooth' });
        }
      });
      
      savedCalcsList.appendChild(li);
    });
    
    // Add delete handlers
    document.querySelectorAll('.delete-saved').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        savedCalculations.splice(index, 1);
        localStorage.setItem('savedCalcs', JSON.stringify(savedCalculations));
        renderSavedCalcs();
      });
    });
  }
  
  saveCalcBtn.addEventListener('click', () => {
    const summaryText = summary.textContent || summary.innerText;
    const noteText = note.textContent;
    
    // Determine mode for title
    let mode = 'Calculation';
    if (modeTo.checked) mode = 'To Level';
    else if (modeBy.checked) mode = 'By Levels';
    else if (modeXp.checked) mode = 'By XP';
    else if (modeKill.checked) mode = 'By Elimination';
    else if (modeMoney.checked) mode = 'By Gems';
    
    const calc = {
      title: `${mode} - ${new Date().toLocaleTimeString()}`,
      details: summaryText.substring(0, 80) + '...',
      summary: summary.innerHTML,
      note: noteText,
      timestamp: Date.now()
    };
    
    savedCalculations.unshift(calc);
    if (savedCalculations.length > 10) savedCalculations.pop(); // Keep only 10
    localStorage.setItem('savedCalcs', JSON.stringify(savedCalculations));
    
    renderSavedCalcs();
    
    const originalText = saveCalcBtn.textContent;
    saveCalcBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      saveCalcBtn.textContent = originalText;
    }, 2000);
  });
  
  clearSavedBtn.addEventListener('click', () => {
    if (confirm('Clear all saved calculations?')) {
      savedCalculations = [];
      localStorage.setItem('savedCalcs', JSON.stringify(savedCalculations));
      renderSavedCalcs();
    }
  });
  
  // Load saved calcs on page load
  renderSavedCalcs();

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
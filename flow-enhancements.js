/* Recipe shot-time helpers. Adds a data-informed, adjustable espresso target and records actual shot time per bean. */
(function () {
  const baseStarterRecipe = starterRecipe;
  const flowNotes = {
    bright: ["citrus", "lemon", "lime", "berry", "grape", "apple", "peach", "floral", "jasmine", "bergamot", "zitrus", "beere", "blüte"],
    cocoa: ["chocolate", "cocoa", "cacao", "caramel", "toffee", "nut", "hazelnut", "almond", "chocolade", "kakao", "karamell", "nuss", "haselnuss", "mandel"],
    roasty: ["bitter", "roasty", "smoky", "tobacco", "rauchig", "bitterkeit"]
  };

  function estimateEspressoWindow(bean, dose, output) {
    const noteText = (bean.profile || []).join(" ").toLowerCase();
    const roast = (bean.roastLevel || "medium").toLowerCase();
    const has = (words) => words.some((word) => noteText.includes(word));
    const ratio = Number(dose) > 0 ? Number(output) / Number(dose) : 2.2;

    // A practical dialing-in estimate, not a sensory guarantee. Start from a medium-roast
    // 1:2.2 espresso at 18g in, then gently adjust for ratio, roast and official flavor notes.
    let midpoint = 29 + (ratio - 2.2) * 4;
    if (roast.includes("light") || roast.includes("hell") || has(flowNotes.bright)) midpoint += 2;
    if (roast.includes("dark") || roast.includes("dunkel") || has(flowNotes.roasty)) midpoint -= 2;
    if (has(flowNotes.cocoa) && !has(flowNotes.bright)) midpoint -= 1;
    if (Number(dose) > 0 && Math.abs(Number(dose) - 18) >= 1) midpoint += (Number(dose) - 18) * 0.35;
    midpoint = Math.max(20, Math.min(42, midpoint));

    const low = Math.max(18, Math.round(midpoint - 2));
    const high = Math.min(45, Math.round(midpoint + 2));
    return `${low}–${high}`;
  }

  starterRecipe = function (bean) {
    const recipe = baseStarterRecipe(bean);
    const method = String(recipe.method || bean.method || "Espresso").toLowerCase();
    if (!/(pour over|v60|aeropress|aero press|filter|french press|clever)/.test(method)) {
      recipe.targetFlowTime = estimateEspressoWindow(bean, recipe.dose || 18, recipe.output || 40);
      recipe.guidance = `${recipe.guidance || "Suggested starting point."} Target shot time ${recipe.targetFlowTime}s from pump start to target yield, including pre-infusion. Treat this as a dial-in window; grinder, basket, machine and coffee age change flow.`;
    } else {
      recipe.targetFlowTime = recipe.targetFlowTime || (method.includes("french") ? "240" : method.includes("aero") ? "90–150" : "150–210");
    }
    return recipe;
  };

  // Keep the four requested demo coffees out of the user's collection, including older local saves.
  const removedNames = new Set(["monsoon reserve", "velvet cherry", "yirgacheffe sunrise", "yirgaffe sunrise", "maya estate"]);
  function removeRequestedSamples() {
    const keys = ["daily-pour-coffee-journal-v4", "daily-pour-coffee-journal-v3", "daily-pour-coffee-journal-v2", "daily-pour-coffee-journal-v1"];
    for (const key of keys) {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        const items = JSON.parse(stored);
        if (!Array.isArray(items)) continue;
        const clean = items.filter((bean) => !removedNames.has(String(bean.name || "").trim().toLowerCase()));
        if (clean.length !== items.length) localStorage.setItem(key, JSON.stringify(clean));
      } catch (error) {
        console.warn(`Could not clean sample coffees from ${key}`, error);
      }
    }
  }
  removeRequestedSamples();

  // Existing starter recipes get a target only if they do not have one already;
  // preserve a user's previously adjusted recipe and all brew history.
  for (const bean of beans) {
    const recipe = bean.recipe || {};
    if (recipe.targetFlowTime) continue;
    const suggestion = starterRecipe(bean);
    bean.recipe = { ...suggestion, ...recipe, targetFlowTime: suggestion.targetFlowTime };
  }
  saveBeans();

  const actualTimeLabel = () => {
    const form = document.querySelector("#brewForm .form-grid");
    if (!form || form.querySelector('[name="actualFlowTime"]')) return;
    const target = form.querySelector('[name="targetFlowTime"]')?.closest("label");
    if (!target) return;
    const label = document.createElement("label");
    label.innerHTML = 'Actual shot time (s)<input name="actualFlowTime" type="number" min="1" max="180" step="0.1" placeholder="Log after brewing"><small class="field-help">Use the same pump-start-to-target convention as the target.</small>';
    target.insertAdjacentElement("afterend", label);
  };
  actualTimeLabel();

  const originalOpenBrewDialog = openBrewDialog;
  openBrewDialog = function (id) {
    originalOpenBrewDialog(id);
    actualTimeLabel();
    const bean = beans.find((item) => String(item.id) === String(id));
    const form = document.querySelector("#brewForm");
    if (!bean || !form) return;
    const latest = bean.recipe || starterRecipe(bean);
    const target = form.elements.targetFlowTime;
    if (target) target.value = latest.targetFlowTime || starterRecipe(bean).targetFlowTime || "";
    if (form.elements.actualFlowTime) form.elements.actualFlowTime.value = "";
    updateFlowGuidance(bean);
  };

  function updateFlowGuidance(bean) {
    const form = document.querySelector("#brewForm");
    const note = document.querySelector("#recipeSuggestion");
    if (!form || !bean || !note) return;
    const dose = Number(form.elements.dose.value || 18);
    const output = Number(form.elements.output.value || 40);
    const method = String(form.elements.method.value || bean.method || "Espresso").toLowerCase();
    if (/(pour over|v60|aeropress|aero press|filter|french press|clever)/.test(method)) {
      note.textContent = "Filter brew time depends on your recipe and pouring technique. Use the displayed time as a starting range, not a fixed espresso shot target.";
      return;
    }
    const window = estimateEspressoWindow(bean, dose, output);
    form.elements.targetFlowTime.value = window;
    note.textContent = `Suggested target: ${dose}g in → ${output}g out (${(output / dose).toFixed(1)} ratio) in about ${window}s, timed from pump start including pre-infusion. Estimate uses roast, tasting notes and ratio; adjust to your grinder and taste. A sour/thin shot often benefits from a finer grind or slightly longer yield; a harsh/bitter shot may need a coarser grind or shorter yield. Change one thing at a time.`;
  }

  const brewForm = document.querySelector("#brewForm");
  if (brewForm) {
    ["dose", "output", "method"].forEach((name) => brewForm.elements[name]?.addEventListener("input", () => {
      const bean = beans.find((item) => String(item.id) === String(activeBrewBeanId));
      if (bean) updateFlowGuidance(bean);
    }));

    // This listener runs after the original brew handler has appended the brew record.
    brewForm.addEventListener("submit", () => {
      const bean = beans.find((item) => String(item.id) === String(activeBrewBeanId));
      if (!bean || !bean.brews?.length) return;
      const values = new FormData(brewForm);
      const latestBrew = bean.brews[bean.brews.length - 1];
      const actual = values.get("actualFlowTime");
      latestBrew.actualFlowTime = actual === "" ? null : Number(actual);
      latestBrew.targetFlowTime = String(values.get("targetFlowTime") || "");
      bean.recipe.actualFlowTime = latestBrew.actualFlowTime;
      bean.recipe.targetFlowTime = latestBrew.targetFlowTime;
      saveBeans();
      render();
    });
  }

  const originalRenderDetail = renderDetail;
  renderDetail = function () {
    originalRenderDetail();
    const bean = beans.find((item) => String(item.id) === String(selectedBeanId));
    const metrics = document.querySelector("#detailPanel .recipe-metrics");
    if (!bean || !metrics) return;
    const recipe = bean.recipe || {};
    const actual = recipe.actualFlowTime ?? [...(bean.brews || [])].reverse().find((brew) => brew.actualFlowTime !== null && brew.actualFlowTime !== undefined)?.actualFlowTime;
    const items = [
      ["Target flow time", recipe.targetFlowTime ? `${recipe.targetFlowTime}s` : "—"],
      ["Last shot time", actual !== null && actual !== undefined && actual !== "" ? `${actual}s` : "Not logged"]
    ];
    for (const [label, value] of items) {
      if ([...metrics.querySelectorAll("small")].some((small) => small.textContent === label)) continue;
      const metric = document.createElement("div");
      metric.className = "recipe-metric";
      const small = document.createElement("small");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      metric.append(small, strong);
      metrics.append(metric);
    }
  };

  const originalRender = render;
  render = function () {
    originalRender();
    renderDetail();
  };

  // Keep requested example coffees removed from any saved collection and refresh UI.
  beans = beans.filter((bean) => !removedNames.has(String(bean.name || "").trim().toLowerCase()));
  if (!beans.some((bean) => String(bean.id) === String(selectedBeanId))) selectedBeanId = beans[0]?.id ?? null;
  saveBeans();
  render();
})();

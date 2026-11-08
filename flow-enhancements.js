/* Recipe shot-time helpers. Updates the espresso flow-time target live and records actual shot time per bean. */
(function () {
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
    updateFlowGuidance(bean, true);
  };

  function updateFlowGuidance(bean, keepTarget = false) {
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
    const window = espressoTimeWindow(bean, dose, output);
    if (keepTarget) return;
    form.elements.targetFlowTime.value = window;
    note.textContent = `${dose}g in → ${output}g out (1:${(output / dose).toFixed(1)}) in about ${window}s, timed from pump start including pre-infusion. This is a starting range, not a target to force. Main pressure and temperature are fixed on your Meraki; taste and change one variable at a time.`;
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

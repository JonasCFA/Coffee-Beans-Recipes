(function () {
  const styles = { black: "Espresso", americano: "Americano", milk: "Dairy milk", oat: "Oat milk", icedmilk: "Iced latte · dairy", icedoat: "Iced latte · oat" };
  const esc = escapeHTML;

  function summary(bean, style) {
    const result = RecipeAdvice.advice(bean, style);
    const cup = result.latest;
    const fields = cup ? [
      cup.dose ? `${cup.dose}g in` : "",
      cup.output ? `${cup.output}g out` : "",
      cup.grind ? `grind ${cup.grind}` : "",
      cup.actualFlowTime ? `${cup.actualFlowTime}s actual` : "",
      cup.targetFlowTime ? `${cup.targetFlowTime}s target` : "",
      cup.preInfusion ? `pre-infusion ${cup.preInfusion}` : "",
      cup.preInfusionPressure ? `${cup.preInfusionPressure} bar pre-infusion` : "",
      cup.rating !== null && cup.rating !== undefined && cup.rating !== "" ? `${cup.rating}/10` : ""
    ].filter(Boolean).join(" · ") : "";
    const best = result.best;
    return `<p class="coach-label">For ${esc(styles[style] || style)} · last logged cup</p>
      ${fields ? `<p>${esc(fields)}</p>` : ""}
      ${cup?.notes ? `<p>Your note: “${esc(cup.notes)}”</p>` : ""}
      <p><strong>Next experiment:</strong> ${esc(result.tip)}</p>
      ${cup ? "<p>The form may contain a different, more recent recipe. Compare its settings with this cup before applying the suggestion.</p>" : ""}
      ${result.reason ? `<p>${esc(result.reason)}</p>` : ""}
      ${result.roaster ? `<p>${esc(result.roaster)}</p>` : ""}
      ${safeUrl(bean.roasterRecipe?.source || "") ? `<p><a href="${esc(safeUrl(bean.roasterRecipe.source))}" target="_blank" rel="noopener noreferrer">Roaster reference source ↗</a></p>` : ""}
      ${best ? `<p>Earlier well-rated cup: ${esc(best.rating)}/10${best.dose && best.output ? ` · ${esc(best.dose)}g in / ${esc(best.output)}g out` : ""}${best.grind ? ` · grind ${esc(best.grind)}` : ""}. Compare before changing more than one variable.</p>` : ""}
      ${cup && style !== "black" && style !== "americano" ? "<p>Milk, ice and dilution can change the taste. Compare the espresso on its own if the cause is unclear.</p>" : ""}
      <p>Keep main pressure and group temperature fixed. Change one thing, taste, and record the result. <a href="https://www.baristahustle.com/wp-content/uploads/2021/09/Espresso-Compass.pdf" target="_blank" rel="noopener noreferrer">Espresso Compass ↗</a></p>`;
  }

  function referenceForm(bean) {
    const ref = bean.roasterRecipe || {};
    return `<details class="coach-reference"><summary>Roaster recipe reference (optional)</summary>
      <p>Copy the espresso recipe from the roaster's product page. It is not fetched or verified automatically.</p>
      <form class="coach-form" data-id="${esc(bean.id)}">
        <label>Dose (g)<input name="dose" type="number" min="1" max="100" step="0.1" value="${esc(ref.dose ?? "")}"></label>
        <label>Yield (g)<input name="output" type="number" min="1" max="500" step="0.1" value="${esc(ref.output ?? "")}"></label>
        <label>Time / conditions<input name="time" maxlength="100" value="${esc(ref.time || "")}" placeholder="e.g. 25–30s"></label>
        <label>Source URL<input name="source" type="url" maxlength="500" value="${esc(ref.source || bean.productUrl || "")}" placeholder="https://…"></label>
        <button class="button button-light" type="submit">Save roaster reference</button>
      </form><p>Clear dose and yield to remove the reference. Values are stored with this coffee.</p></details>`;
  }

  function refreshDialog() {
    const bean = beans.find((item) => String(item.id) === String(activeBrewBeanId));
    const panel = document.getElementById("recipeCoachDialog");
    if (bean && panel) panel.innerHTML = summary(bean, document.querySelector("#brewForm").elements.drinkStyle.value);
  }

  const baseRenderDetail = renderDetail;
  renderDetail = function () {
    baseRenderDetail();
    const bean = beans.find((item) => String(item.id) === String(selectedBeanId));
    if (!bean) return;
    const last = (bean.brews || []).at(-1);
    const style = last?.drinkStyle || "black";
    const section = document.createElement("section");
    section.className = "detail-section recipe-coach-section";
    section.innerHTML = `<h4>Next shot suggestion</h4><div class="recipe-coach">${summary(bean, style)}</div>${referenceForm(bean)}`;
    detailPanel.querySelector(".detail-footer").before(section);
  };

  detailPanel.addEventListener("submit", (event) => {
    const form = event.target.closest(".coach-form");
    if (!form) return;
    event.preventDefault();
    const bean = beans.find((item) => String(item.id) === String(form.dataset.id));
    if (!bean || !form.reportValidity()) return;
    const values = new FormData(form);
    const dose = String(values.get("dose")).trim();
    const output = String(values.get("output")).trim();
    const source = String(values.get("source")).trim();
    if (Boolean(dose) !== Boolean(output)) { showToast("Enter both roaster dose and yield, or clear both."); return; }
    if (source && !safeUrl(source)) { showToast("Use an http or https source URL."); return; }
    const previous = bean.roasterRecipe;
    if (dose) bean.roasterRecipe = { dose: Number(dose), output: Number(output), time: String(values.get("time")).trim(), source };
    else delete bean.roasterRecipe;
    if (!saveBeans()) { if (previous) bean.roasterRecipe = previous; else delete bean.roasterRecipe; return; }
    render();
    showToast(dose ? "Roaster reference saved." : "Roaster reference removed.");
  });

  const originalOpen = openBrewDialog;
  openBrewDialog = function (id) {
    originalOpen(id);
    const bean = beans.find((item) => String(item.id) === String(id));
    if (!bean) return;
    const form = document.querySelector("#brewForm");
    const style = (bean.brews || []).at(-1)?.drinkStyle;
    if (styles[style]) form.elements.drinkStyle.value = style;
    if (!bean.brews?.length) document.getElementById("recipeSuggestion").textContent = "This is your saved starting recipe. Brew and record a cup before making adjustments.";
    refreshDialog();
  };
  const form = document.querySelector("#brewForm");
  const panel = document.createElement("div");
  panel.id = "recipeCoachDialog";
  panel.className = "recipe-coach";
  panel.setAttribute("aria-live", "polite");
  form.querySelector("#recipeSuggestion").after(panel);
  form.elements.drinkStyle.addEventListener("change", refreshDialog);
  render();
})();

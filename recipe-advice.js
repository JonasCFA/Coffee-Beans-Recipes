(function (root) {
  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function containsPositive(text, pattern) {
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(Math.max(0, match.index - 35), match.index).split(/[,;.!?]/).pop();
      if (!/(?:nicht|kein(?:e|en|er|es)?|ohne|not|no|without)\s+(?:(?:zu|sehr|mehr|too|very|at all)\s+)?$/iu.test(before)) return true;
    }
    return false;
  }

  function diagnose(notes) {
    const text = String(notes || "").toLowerCase();
    return {
      sour: containsPositive(text, /\b(?:sauer|säuerlich|säure|sour|tart|acidic|acidity)\b/giu),
      bitter: containsPositive(text, /\b(?:bitter|bitterkeit|bitterer|bitterness|astringent|adstringierend)\b/giu),
      channeling: containsPositive(text, /\b(?:channel(?:ing)?|kanalbildung|spritz(?:t|en)|spray(?:ing)?)\b/giu)
    };
  }

  function advice(bean, style) {
    const brews = Array.isArray(bean.brews) ? bean.brews : [];
    const same = brews.filter((brew) => brew.drinkStyle === style);
    const latest = same[same.length - 1];
    if (!latest) return { tip: "No cup logged for this drink yet. Brew the current recipe and record its taste and rating before changing it.", latest: null };
    const method = String(latest.method || "").trim();
    if (!/espresso/i.test(method) || /filter|pour|v60|aeropress|french|clever/i.test(method)) {
      return { latest, tip: "No espresso-specific adjustment: this cup's brewing method is not recorded as espresso. Log the method and tasting result to get relevant guidance." };
    }
    const observed = diagnose(latest.notes);
    const dose = number(latest.dose);
    const output = number(latest.output);
    const reference = bean.roasterRecipe || {};
    const refDose = number(reference.dose);
    const refOutput = number(reference.output);
    const actualTime = number(latest.actualFlowTime);
    const rating = latest.rating === null || latest.rating === undefined || latest.rating === "" ? null : Number(latest.rating);
    const sameDose = dose && refDose && Math.abs(dose - refDose) < 0.1;
    let tip;
    let reason;
    if (observed.channeling || (observed.sour && observed.bitter)) {
      tip = "For the next shot, focus on even distribution and a level tamp; keep dose, yield and grind unchanged.";
      reason = "Spraying or a mixture of sour and bitter can indicate uneven extraction, but does not prove it.";
    } else if (observed.sour) {
      if (dose && output && output / dose < 3 && output <= 498) {
        const toward = sameDose && refOutput && refOutput > output;
        const target = Math.round((output + (toward ? Math.min(2, refOutput - output) : 2)) * 10) / 10;
        tip = `For the next shot, try ${target} g out instead of ${output} g${toward ? ", moving toward your saved roaster reference" : ""}; keep dose and grind unchanged.`;
        reason = "A slightly longer yield may improve extraction and sweetness; acidity can also be the coffee's intended character.";
      } else {
        tip = "Try one small step finer on the grinder; keep dose and yield unchanged.";
        reason = "A finer grind may increase extraction. Check puck preparation if the shot sprays or tastes both sour and bitter.";
      }
    } else if (observed.bitter) {
      if (dose && output && output / dose > 1.2 && output > 2) {
        const toward = sameDose && refOutput && refOutput < output;
        const target = Math.round((output - (toward ? Math.min(2, output - refOutput) : 2)) * 10) / 10;
        tip = `For the next shot, try ${target} g out instead of ${output} g${toward ? ", moving toward your saved roaster reference" : ""}; keep dose and grind unchanged.`;
        reason = "A slightly shorter yield may reduce bitter extraction; roast and milk can also affect the taste.";
      } else {
        tip = "Try one small step coarser on the grinder; keep dose and yield unchanged.";
        reason = "A coarser grind may reduce extraction; repeat consistently and taste the result.";
      }
    } else if (Number.isFinite(rating) && rating >= 8) {
      tip = "Your last cup scored well. Repeat the same recipe before changing it.";
      reason = "A high rating alone does not identify a problem to fix.";
    } else {
      tip = "No clear adjustment yet. Record whether the cup tastes too sour, bitter, or shows uneven flow, then change one variable at a time.";
      reason = "A rating alone cannot tell us which way to adjust extraction.";
    }
    const best = same.filter((brew) => {
      const value = brew.rating;
      return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 8 && brew !== latest;
    }).sort((a, b) => Number(b.rating) - Number(a.rating))[0];
    const roaster = refDose && refOutput ? `Roaster reference you entered: ${refDose} g in / ${refOutput} g out${reference.time ? `, ${reference.time}` : ""}. Your shot: ${dose ?? "?"} g in / ${output ?? "?"} g out${actualTime ? ` in ${actualTime} s` : ""}. This is a starting point, not a target to force.` : "No roaster recipe saved; the product page is not read automatically.";
    return { latest, tip, reason, roaster, best };
  }

  const api = { advice, diagnose };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RecipeAdvice = api;
})(typeof window !== "undefined" ? window : null);

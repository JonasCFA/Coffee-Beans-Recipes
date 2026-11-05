const beans = [
  {
    id: 1,
    name: "Yirgacheffe Sunrise",
    roaster: "Cedar & Co.",
    origin: "Ethiopia",
    roastDate: "2026-10-22",
    cluster: "Bright & Floral",
    profile: ["floral", "citrus", "tea-like", "bergamot"],
    rating: 4.9,
    recipe: {
      dose: 18,
      output: 40,
      ratio: "1:2.2",
      preInfusion: "20s",
      grind: 16,
      water: "94°C",
      brew: "V60"
    },
    notes: "Best as a clean, elegant cup with noticeable citrus lift and jasmine aromatics.",
    roastLevel: "Light"
  },
  {
    id: 2,
    name: "Maya Estate",
    roaster: "Horizon Roasters",
    origin: "Colombia",
    roastDate: "2026-10-18",
    cluster: "Balanced & Sweet",
    profile: ["caramel", "red apple", "brown sugar", "orange"],
    rating: 4.7,
    recipe: {
      dose: 18,
      output: 40,
      ratio: "1:2.2",
      preInfusion: "15s",
      grind: 15,
      water: "94°C",
      brew: "Pour over"
    },
    notes: "Sweet, balanced and very repeatable. Great first coffee for a home barista setup.",
    roastLevel: "Medium"
  },
  {
    id: 3,
    name: "Monsoon Reserve",
    roaster: "Wild Bean House",
    origin: "India",
    roastDate: "2026-10-12",
    cluster: "Heavy & Earthy",
    profile: ["dark chocolate", "cocoa", "cedar", "brown sugar"],
    rating: 4.5,
    recipe: {
      dose: 18,
      output: 40,
      ratio: "1:2.2",
      preInfusion: "18s",
      grind: 14,
      water: "93°C",
      brew: "French press"
    },
    notes: "A fuller body with deep cocoa and a smooth finish. Great for espresso or immersion brewing.",
    roastLevel: "Medium-dark"
  },
  {
    id: 4,
    name: "Velvet Cherry",
    roaster: "North Roast",
    origin: "Brazil",
    roastDate: "2026-10-27",
    cluster: "Chocolate & Caramel",
    profile: ["chocolate", "cherry", "toffee", "jam"],
    rating: 4.8,
    recipe: {
      dose: 18,
      output: 40,
      ratio: "1:2.2",
      preInfusion: "12s",
      grind: 17,
      water: "93.5°C",
      brew: "Espresso"
    },
    notes: "Sweet and syrupy with a velvety body and a very punchy chocolate finish.",
    roastLevel: "Medium"
  },
  {
    id: 5,
    name: "Sierra Bloom",
    roaster: "Summit Coffee",
    origin: "Guatemala",
    roastDate: "2026-09-30",
    cluster: "Citrus & Berry",
    profile: ["berry", "lemon zest", "honey", "grape"],
    rating: 4.6,
    recipe: {
      dose: 18,
      output: 40,
      ratio: "1:2.2",
      preInfusion: "18s",
      grind: 16,
      water: "94°C",
      brew: "Aeropress"
    },
    notes: "High clarity and bright fruit acidity. Ideal when you want zing without harshness.",
    roastLevel: "Light-medium"
  },
  {
    id: 6,
    name: "Golden Harvest",
    roaster: "Oak & Ember",
    origin: "Kenya",
    roastDate: "2026-10-24",
    cluster: "Bright & Fruity",
    profile: ["grape", "blackcurrant", "citric acid", "sweetness"],
    rating: 4.9,
    recipe: {
      dose: 18,
      output: 40,
      ratio: "1:2.2",
      preInfusion: "20s",
      grind: 15,
      water: "94.5°C",
      brew: "Clever dripper"
    },
    notes: "A layered, aromatic cup with brighter fruit and a crisp finish.",
    roastLevel: "Light"
  }
];

const detailPanel = document.getElementById("detailPanel");
const beanGrid = document.getElementById("beanGrid");
const clusterFilter = document.getElementById("clusterFilter");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const clusterGrid = document.getElementById("clusterGrid");

let selectedBeanId = beans[0]?.id ?? null;

function normalizeProfile(profile) {
  return profile.map((tag) => tag.toLowerCase());
}

function getClusterForBean(bean) {
  const profile = normalizeProfile(bean.profile);

  if (profile.some((tag) => ["citrus", "berry", "grape", "orange", "lemon", "blackcurrant"].includes(tag))) {
    return "Citrus & Berry";
  }

  if (profile.some((tag) => ["floral", "tea-like", "bergamot", "jasmine"].includes(tag))) {
    return "Bright & Floral";
  }

  if (profile.some((tag) => ["chocolate", "cocoa", "toffee", "caramel", "brown sugar"].includes(tag))) {
    return "Chocolate & Caramel";
  }

  if (profile.some((tag) => ["dark chocolate", "cedar", "earthy"].includes(tag))) {
    return "Heavy & Earthy";
  }

  return "Balanced & Sweet";
}

function buildClusterSummary() {
  const clusters = {};

  beans.forEach((bean) => {
    const cluster = getClusterForBean(bean);
    clusters[cluster] = clusters[cluster] || { count: 0, profiles: [] };
    clusters[cluster].count += 1;
    clusters[cluster].profiles.push(...bean.profile);
  });

  return Object.entries(clusters).map(([name, data]) => ({
    name,
    count: data.count,
    profiles: [...new Set(data.profiles)].slice(0, 4)
  }));
}

function renderStats() {
  document.getElementById("beanCount").textContent = beans.length;
  const avg = (beans.reduce((sum, bean) => sum + bean.rating, 0) / beans.length).toFixed(1);
  document.getElementById("avgRating").textContent = avg;
  document.getElementById("clusterCount").textContent = new Set(beans.map(getClusterForBean)).size;
}

function getFilteredBeans() {
  const search = searchInput.value.trim().toLowerCase();
  const cluster = clusterFilter.value;

  let filtered = [...beans];

  if (search) {
    filtered = filtered.filter((bean) => {
      const haystack = [bean.name, bean.roaster, bean.origin, ...bean.profile].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }

  if (cluster !== "all") {
    filtered = filtered.filter((bean) => getClusterForBean(bean) === cluster);
  }

  const sortMode = sortSelect.value;

  filtered.sort((a, b) => {
    if (sortMode === "date") {
      return new Date(b.roastDate) - new Date(a.roastDate);
    }
    if (sortMode === "name") {
      return a.name.localeCompare(b.name);
    }
    return b.rating - a.rating;
  });

  return filtered;
}

function renderClusterOptions() {
  const uniqueClusters = [...new Set(beans.map(getClusterForBean))];
  const options = ['<option value="all">All clusters</option>'];
  uniqueClusters.forEach((cluster) => {
    options.push(`<option value="${cluster}">${cluster}</option>`);
  });
  clusterFilter.innerHTML = options.join("");
}

function renderBeanCards() {
  const filtered = getFilteredBeans();

  if (!filtered.length) {
    beanGrid.innerHTML = `
      <div class="bean-card" style="grid-column: 1 / -1;">
        <h3>No beans match</h3>
        <p class="roaster">Try another search or cluster filter.</p>
      </div>
    `;
    return;
  }

  beanGrid.innerHTML = filtered
    .map((bean) => {
      const isSelected = bean.id === selectedBeanId;
      const cluster = getClusterForBean(bean);
      return `
        <article class="bean-card ${isSelected ? "is-selected" : ""}" data-id="${bean.id}" tabindex="0">
          <div class="bean-meta">
            <span class="origin-badge">${bean.origin}</span>
            <span class="rating-badge">★ ${bean.rating.toFixed(1)}</span>
          </div>

          <h3>${bean.name}</h3>
          <div class="roaster">${bean.roaster}</div>

          <div class="profile-row">
            ${bean.profile.slice(0, 3).map((item) => `<span class="profile-tag">${item}</span>`).join("")}
          </div>

          <div class="meta-row">
            <span class="cluster-pill">${cluster}</span>
            <span>${bean.roastLevel}</span>
          </div>
        </article>
      `;
    })
    .join("");

  beanGrid.querySelectorAll(".bean-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedBeanId = Number(card.dataset.id);
      renderBeanCards();
      renderDetail();
    });
  });
}

function renderDetail() {
  const bean = beans.find((entry) => entry.id === selectedBeanId) || beans[0];
  if (!bean) {
    detailPanel.innerHTML = `
      <div class="blank-state">
        <div class="empty-icon">⚠️</div>
        <h3>No route found</h3>
        <p>Please add a bean first.</p>
      </div>
    `;
    return;
  }

  const cluster = getClusterForBean(bean);

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${bean.origin}</p>
        <h3>${bean.name}</h3>
      </div>
      <span class="cluster-pill">${cluster}</span>
    </div>

    <div class="detail-ratings">
      <span class="star-row">★★★★★</span>
      <span>${bean.rating.toFixed(1)} / 5</span>
    </div>

    <div class="profile-list">
      ${bean.profile.map((tag) => `<span>${tag}</span>`).join("")}
    </div>

    <div class="detail-grid">
      <div class="detail-metric">
        <span>Roaster</span>
        <strong>${bean.roaster}</strong>
      </div>
      <div class="detail-metric">
        <span>Roast date</span>
        <strong>${new Date(bean.roastDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong>
      </div>
      <div class="detail-metric">
        <span>Last grind</span>
        <strong>${bean.recipe.grind}</strong>
      </div>
      <div class="detail-metric">
        <span>Water</span>
        <strong>${bean.recipe.water}</strong>
      </div>
    </div>

    <p>${bean.notes}</p>

    <div class="recipe-block">
      <h4>Recommended recipe</h4>
      <div class="recipe-grid">
        <div class="recipe-item">
          <span>In</span>
          <strong>${bean.recipe.dose}g</strong>
        </div>
        <div class="recipe-item">
          <span>Out</span>
          <strong>${bean.recipe.output}g</strong>
        </div>
        <div class="recipe-item">
          <span>Ratio</span>
          <strong>${bean.recipe.ratio}</strong>
        </div>
        <div class="recipe-item">
          <span>Pre infusion</span>
          <strong>${bean.recipe.preInfusion}</strong>
        </div>
        <div class="recipe-item">
          <span>Method</span>
          <strong>${bean.recipe.brew}</strong>
        </div>
        <div class="recipe-item">
          <span>Grind</span>
          <strong>${bean.recipe.grind}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderClusterCards() {
  const clusterSummary = buildClusterSummary();
  clusterGrid.innerHTML = clusterSummary
    .map(
      (cluster) => `
        <article class="cluster-card">
          <p class="eyebrow">Cluster</p>
          <h4>${cluster.name}</h4>
          <div class="profile-list">
            ${cluster.profiles.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
          <div class="cluster-meta">
            <strong>${cluster.count} beans</strong>
            <span class="cluster-count">Avg score ${(
              beans.filter((bean) => getClusterForBean(bean) === cluster.name).reduce((sum, bean) => sum + bean.rating, 0) /
              cluster.count
            ).toFixed(1)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function attachEvents() {
  searchInput.addEventListener("input", () => {
    renderBeanCards();
    renderDetail();
  });

  clusterFilter.addEventListener("change", () => {
    renderBeanCards();
    renderDetail();
  });

  sortSelect.addEventListener("change", () => {
    renderBeanCards();
    renderDetail();
  });
}

function init() {
  renderClusterOptions();
  renderStats();
  renderBeanCards();
  renderDetail();
  renderClusterCards();
  attachEvents();
}

init();

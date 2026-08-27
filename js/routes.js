let currentComponent = null;
let currentBaseRoute = null;
let currentRoot = null;
let currentCss = null;
let currentCssFile = null;

const routes = {
  "#/": {
    component: "home",
    css: "styles.css"
  },

  "#/planning": {
    component: "planning/index",
    css: "styles.css",
    children: {
      "current": "planning/current",
      "new": "planning/new",
      "supplies": "planning/supplies",
      "history": "planning/history"
    }
  },

  "#/production": {
    component: "production/index",
    css: "styles.css",
    children: {
      "detail": "production/detail"
    }
  },

  "#/security": {
    component: "security/index",
    css: "security.css",
    children: {
      "inspections": "security/inspections",
      "deviations": "security/deviations",
      "actions": "security/actions",
      "verifications": "security/verifications",
      "reports": "security/reports"
    }
  }
};

export async function handleRoute() {
  const hash = window.location.hash || "#/";
  const parts = hash.split("/").filter(Boolean); // ["#", "products", "phones"]

  const base = `#/${parts[1] || ""}`;
  const child = parts[2];
  const param = parts[3];

  const route = routes[base];

  if (!route) return loadComponent("home");

  setRouteCss(route.css);

  if (currentBaseRoute !== base) {
    currentBaseRoute = base;
    await loadComponent(route.component);
  } else {
    if (typeof (child) === "undefined") {
      await loadComponent(route.component);
    }
  }

  if (child && route.children && route.children[child]) {
    await loadChildComponent(route.children[child], param);
  }
}

async function loadComponent(name) {
  const app = document.getElementById("app");

  if (currentComponent?.destroy) currentComponent.destroy(currentRoot);

  const module = await import(`./components/${name}.js`);

  document.title = module.title || "My App";

  app.innerHTML = "";
  const root = document.createElement("div");
  root.id = "root";
  root.innerHTML = module.render();

  currentComponent = module;
  currentRoot = root;

  if (module.init) module.init(root);

  app.appendChild(root);
}

async function loadChildComponent(name, param) {
  const outlet = document.getElementById("child-outlet");
  if (!outlet) return;

  const module = await import(`./components/${name}.js`);

  outlet.innerHTML = module.render(param);
  if (module.init) module.init(outlet, param);
}

window.addEventListener("hashchange", handleRoute);

export function initRouter() {
  handleRoute();
}

function setRouteCss(cssFile) {
  if (currentCssFile === cssFile) {
    return;
  } else {
    currentCssFile = cssFile;
  }

  if (currentCss) {
    currentCss.remove();
    currentCss = null;
  }

  if (!cssFile) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `./css/${cssFile}`;
  document.head.appendChild(link);

  currentCss = link;
}
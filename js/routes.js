let currentComponent = null;
let currentRoot = null;

const routes = {
  "#/": { component: "home" },

  "#/products": {
    component: "products/index",
    children: {
      "phones": "products/phones",
      "laptops": "products/laptops"
    }
  }
};

export function handleRoute() {
  const hash = window.location.hash || "#/";
  const parts = hash.split("/").filter(Boolean); // ["#", "products", "phones"]

  const base = `#/${parts[1] || ""}`;
  const child = parts[2];

  const route = routes[base];

  if (!route) return loadComponent("home");

  loadComponent(route.component).then(() => {
    if (child && route.children && route.children[child]) {
      loadChildComponent(route.children[child]);
    }
  });
}

async function loadComponent(name) {
  const app = document.getElementById("app");

  if (currentComponent?.destroy) currentComponent.destroy(currentRoot);

  const module = await import(`./components/${name}.js`);

  document.title = module.title || "My App";

  app.innerHTML = "";
  const root = document.createElement("div");
  root.innerHTML = module.render();

  currentComponent = module;
  currentRoot = root;

  if (module.init) module.init(root);

  app.appendChild(root);
}

async function loadChildComponent(name) {
  const outlet = document.getElementById("child-outlet");
  if (!outlet) return;

  const module = await import(`./components/${name}.js`);

  outlet.innerHTML = module.render();
  if (module.init) module.init(outlet);
}

window.addEventListener("hashchange", handleRoute);

export function initRouter() {
  handleRoute();
}

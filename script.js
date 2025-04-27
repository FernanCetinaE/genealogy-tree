let fullData;
let currentRoot;
let maxDepth = 3;
const nodesById = {};
let renderedNodes = {};

// Load data
fetch('Daxcsa.json')
  .then(res => res.json())
  .then(json => {
    fullData = json.data.attributes[0];
    indexNodes(fullData);
    setRoot(fullData);
  });

function indexNodes(node) {
  nodesById[node.distributor_id] = node;
  if (node.children) node.children.forEach(indexNodes);
}

// UI refs
const btnUp = document.getElementById('btn-up');
const btnTop = document.getElementById('btn-top');
const depthSelect = document.getElementById('depth-select');
const bc = document.getElementById('breadcrumbs');

btnTop.onclick = () => setRoot(fullData);
btnUp.onclick = () => {
  const parent = nodesById[currentRoot.parent_id];
  if (parent) setRoot(parent);
};
depthSelect.onchange = () => {
  maxDepth = +depthSelect.value;
  renderChart();
};

function setRoot(node) {
  currentRoot = node;
  btnUp.disabled = !nodesById[node.parent_id];
  updateBreadcrumbs();
  renderChart();
}

function updateBreadcrumbs() {
  const trail = [];
  let cursor = currentRoot;
  while (cursor) {
    trail.push(cursor);
    cursor = nodesById[cursor.parent_id];
  }
  bc.innerHTML = '';
  trail.reverse().forEach((n, idx) => {
    const span = document.createElement('span');
    span.textContent = n.full_name;
    span.className = 'cursor-pointer text-blue-600';
    span.onclick = () => setRoot(n);
    bc.appendChild(span);
    if (idx < trail.length - 1) {
      const sep = document.createElement('span');
      sep.textContent = ' > ';
      bc.appendChild(sep);
    }
  });
}

function buildNode(node, depth = 0) {
  const id = 'node-' + node.distributor_id;
  renderedNodes[id] = node;
  const status = node.status || '-';
  const product = node.product_name || '-';
  const category = node.category_name || '-';
  const html = `
    <div class="node-name">${node.full_name}</div>
    <div class="node-content">
      <div><strong>U:</strong> ${node.username}</div>
      <div><strong>S:</strong> ${status}</div>
      <div><strong>P:</strong> ${product}</div>
      <div><strong>C:</strong> ${category}</div>
    </div>
  `;
  const obj = { HTMLid: id, innerHTML: html };

  if (depth + 1 < maxDepth && node.children) {
    const children = [];
    ['Left', 'Right'].forEach(side => {
      const child = node.children.find(c => c.binary_placement === side);
      if (child) children.push(buildNode(child, depth + 1));
    });
    if (children.length) obj.children = children;
  }
  return obj;
}

function renderChart() {
  renderedNodes = {};
  document.getElementById('chart').innerHTML = '';

  const isMobile = window.innerWidth < 640;
  const levelSep = isMobile ? 70 : 50;
  const siblingSep = isMobile ? 40 : 20;
  const subSeparation = isMobile ? 40 : 30;

  const config = {
    chart: {
      container: '#chart',
      levelSeparation: levelSep,
      siblingSeparation: siblingSep,
      subTeeSeparation: subSeparation,
      connectors: { type: 'curve' }
    },
    nodeStructure: buildNode(currentRoot)
  };

  new Treant(config, attachNodeHandlers);
}

window.addEventListener('resize', () => {
  if (currentRoot) renderChart();
});

function attachNodeHandlers() {
  Object.entries(renderedNodes).forEach(([id, node]) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.cursor = 'pointer';
      el.onclick = () => setRoot(node);
    }
  });
}

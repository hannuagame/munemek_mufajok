const categoriesEl = document.getElementById("categories");
const gameCategoriesEl = document.getElementById("gameCategories");
const itemsEl = document.getElementById("items");
const resultEl = document.getElementById("result");
const editView = document.getElementById("editView");
const playView = document.getElementById("playView");

let categories = [
  { name: "Állatok", features: ["kutya", "macska", "ló"] },
  { name: "Járművek", features: ["autó", "repülő", "hajó"] },
  { name: "Ételek", features: ["pizza", "alma", "leves"] }
];

let draggedCard = null;

function renderEditor() {
  categoriesEl.innerHTML = "";

  categories.forEach((category, categoryIndex) => {
    const box = document.createElement("div");
    box.className = "category-editor";

    const head = document.createElement("div");
    head.className = "category-head";

    const name = document.createElement("input");
    name.value = category.name;
    name.placeholder = "Kategória neve";
    name.addEventListener("input", e => category.name = e.target.value);

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "×";
    remove.title = "Kategória törlése";
    remove.onclick = () => {
      categories.splice(categoryIndex, 1);
      renderEditor();
    };

    head.append(name, remove);
    box.appendChild(head);

    category.features.forEach((feature, featureIndex) => {
      const row = document.createElement("div");
      row.className = "feature-row";

      const input = document.createElement("input");
      input.value = feature;
      input.placeholder = "Jellemző";
      input.addEventListener("input", e => category.features[featureIndex] = e.target.value);

      const removeFeature = document.createElement("button");
      removeFeature.className = "remove";
      removeFeature.textContent = "×";
      removeFeature.onclick = () => {
        category.features.splice(featureIndex, 1);
        renderEditor();
      };

      row.append(input, removeFeature);
      box.appendChild(row);
    });

    const addFeature = document.createElement("button");
    addFeature.className = "secondary add-feature";
    addFeature.textContent = "+ Jellemző";
    addFeature.onclick = () => {
      category.features.push("");
      renderEditor();
    };

    box.appendChild(addFeature);
    categoriesEl.appendChild(box);
  });
}

function switchMode(mode) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  editView.classList.toggle("hidden", mode !== "edit");
  playView.classList.toggle("hidden", mode !== "play");
}

function startGame() {
  const clean = categories
    .map(c => ({
      name: c.name.trim(),
      features: c.features.map(f => f.trim()).filter(Boolean)
    }))
    .filter(c => c.name && c.features.length);

  if (!clean.length) {
    alert("Adj meg legalább egy kategóriát és egy jellemzőt.");
    return;
  }

  categories = clean;
  renderGame();
  switchMode("play");
}

function renderGame() {
  gameCategoriesEl.innerHTML = "";
  itemsEl.innerHTML = "";
  resultEl.classList.add("hidden");
  resultEl.textContent = "";

  categories.forEach((category, categoryIndex) => {
    const box = document.createElement("div");
    box.className = "game-category";
    box.dataset.category = categoryIndex;

    const title = document.createElement("h2");
    title.textContent = category.name;

    const dropZone = document.createElement("div");
    dropZone.className = "drop-zone";

    setupDropZone(box, dropZone);
    box.append(title, dropZone);
    gameCategoriesEl.appendChild(box);
  });

  const allFeatures = [];
  categories.forEach((category, categoryIndex) => {
    category.features.forEach(feature => {
      allFeatures.push({ text: feature, answer: categoryIndex });
    });
  });

  shuffle(allFeatures).forEach((item, index) => {
    itemsEl.appendChild(createCard(item, index));
  });

  setupDropZone(itemsEl, itemsEl);
}

function createCard(item, index) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = item.text;
  card.draggable = true;
  card.dataset.answer = item.answer;
  card.dataset.id = index;

  card.addEventListener("dragstart", () => {
    draggedCard = card;
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    draggedCard = null;
  });

  let startX, startY, clone, offsetX, offsetY;

  card.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    draggedCard = card;
    const rect = card.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    clone = card.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.width = rect.width + "px";
    clone.style.left = (e.clientX - offsetX) + "px";
    clone.style.top = (e.clientY - offsetY) + "px";
    clone.style.zIndex = "1000";
    clone.style.pointerEvents = "none";
    clone.classList.add("dragging");
    document.body.appendChild(clone);
    card.style.opacity = ".25";
    card.setPointerCapture(e.pointerId);
  });

  card.addEventListener("pointermove", e => {
    if (!clone) return;
    clone.style.left = (e.clientX - offsetX) + "px";
    clone.style.top = (e.clientY - offsetY) + "px";
  });

  card.addEventListener("pointerup", e => {
    if (!clone) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const zone = target?.closest(".game-category, .items");
    if (zone) {
      if (zone.classList.contains("items")) {
        itemsEl.appendChild(card);
      } else {
        zone.querySelector(".drop-zone").appendChild(card);
      }
    }
    card.style.opacity = "";
    clone.remove();
    clone = null;
    draggedCard = null;
  });

  return card;
}

function setupDropZone(container, visualZone) {
  container.addEventListener("dragover", e => {
    e.preventDefault();
    container.classList.add("over");
  });

  container.addEventListener("dragleave", () => {
    container.classList.remove("over");
  });

  container.addEventListener("drop", e => {
    e.preventDefault();
    container.classList.remove("over");
    if (!draggedCard) return;

    if (container.classList.contains("items")) {
      itemsEl.appendChild(draggedCard);
    } else {
      visualZone.appendChild(draggedCard);
    }
  });
}

function checkAnswers() {
  let total = 0;
  let correct = 0;

  document.querySelectorAll(".card").forEach(card => {
    total++;
    const parent = card.closest(".game-category");
    const isCorrect = parent && Number(parent.dataset.category) === Number(card.dataset.answer);

    card.classList.remove("correct", "wrong");
    card.classList.add(isCorrect ? "correct" : "wrong");

    if (isCorrect) correct++;
  });

  const placed = [...document.querySelectorAll(".game-category .card")].length;
  const unanswered = total - placed;

  resultEl.classList.remove("hidden");
  resultEl.textContent = unanswered
    ? `${correct} / ${total} helyes. Még ${unanswered} jellemző nincs kategóriába húzva.`
    : `${correct} / ${total} helyes.`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

document.getElementById("addCategory").onclick = () => {
  categories.push({ name: "", features: [""] });
  renderEditor();
};

document.getElementById("startGame").onclick = startGame;
document.getElementById("check").onclick = checkAnswers;
document.getElementById("resetGame").onclick = renderGame;

document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    if (tab.dataset.mode === "play") startGame();
    else switchMode("edit");
  };
});

renderEditor();

let games=JSON.parse(localStorage.getItem("categoryGames")||"[]");
let currentGame=null;
let checked=false;
let showingSolution=false;

function saveGames(){
  localStorage.setItem("categoryGames",JSON.stringify(games));
}

function showGames(){
  document.getElementById("content").innerHTML=`
    <div class="card">
      <h2>Játékaim</h2>
      <div class="games">
        ${games.length?games.map((g,i)=>`
          <div class="game-row">
            <strong>${escapeHtml(g.name)}</strong>
            <div class="game-buttons">
              <button onclick="startGame(${i})">Játék</button>
              <button onclick="editGame(${i})">Szerkesztés</button>
              <button onclick="deleteGame(${i})">Törlés</button>
            </div>
          </div>
        `).join(""):"<p>Még nincs mentett játék.</p>"}
      </div>
    </div>
  `;
}

function newGame(){
  currentGame={
    name:"",
    categories:[]
  };
  renderEditor();
}

function editGame(i){
  currentGame=JSON.parse(JSON.stringify(games[i]));
  currentGame.index=i;
  renderEditor();
}

function renderEditor(){
  document.getElementById("content").innerHTML=`
    <div class="card">
      <h2>Játék szerkesztése</h2>
      <input id="gameName" placeholder="Játék neve" value="${escapeAttr(currentGame.name)}">
      <div id="categories"></div>
      <div class="editor-actions">
        <button onclick="addCategory()">+ Kategória</button>
        <button onclick="saveGame()">Játék mentése</button>
        <button onclick="showGames()">Mégse</button>
      </div>
    </div>
  `;
  renderCategories();
}

function renderCategories(){
  const box=document.getElementById("categories");
  box.innerHTML=currentGame.categories.map((c,i)=>`
    <div class="category">
      <input value="${escapeAttr(c.name)}"
        oninput="currentGame.categories[${i}].name=this.value"
        placeholder="Kategória neve">
      <div class="traits-editor">
        ${c.traits.map((t,j)=>`
          <div style="display:flex;gap:5px">
            <input value="${escapeAttr(t)}"
              oninput="currentGame.categories[${i}].traits[${j}]=this.value"
              placeholder="Jellemző">
            <button onclick="removeTrait(${i},${j})">×</button>
          </div>
        `).join("")}
      </div>
      <div class="editor-actions">
        <button onclick="addTrait(${i})">+ Jellemző</button>
        <button onclick="removeCategory(${i})">Kategória törlése</button>
      </div>
    </div>
  `).join("");
}

function addCategory(){
  currentGame.categories.push({name:"",traits:[""]});
  renderCategories();
}

function removeCategory(i){
  currentGame.categories.splice(i,1);
  renderCategories();
}

function addTrait(i){
  currentGame.categories[i].traits.push("");
  renderCategories();
}

function removeTrait(i,j){
  currentGame.categories[i].traits.splice(j,1);
  renderCategories();
}

function saveGame(){
  currentGame.name=document.getElementById("gameName").value.trim()||"Névtelen játék";
  currentGame.categories=currentGame.categories.map(c=>({
    name:c.name.trim(),
    traits:c.traits.filter(t=>t.trim()).map(t=>t.trim())
  })).filter(c=>c.name&&c.traits.length);

  if(!currentGame.categories.length){
    alert("Adj hozzá legalább egy kategóriát és egy jellemzőt!");
    return;
  }

  if(currentGame.index!==undefined){
    games[currentGame.index]=JSON.parse(JSON.stringify(currentGame));
    delete games[currentGame.index].index;
  }else{
    games.push(JSON.parse(JSON.stringify(currentGame)));
  }

  saveGames();
  showGames();
}

function deleteGame(i){
  if(confirm("Biztosan törlöd ezt a játékot?")){
    games.splice(i,1);
    saveGames();
    showGames();
  }
}

function startGame(i){
  currentGame=JSON.parse(JSON.stringify(games[i]));
  checked=false;
  showingSolution=false;

  const all=[];
  currentGame.categories.forEach((c,ci)=>{
    c.traits.forEach(t=>all.push({
      text:t,
      correct:ci
    }));
  });

  all.sort(()=>Math.random()-.5);
  currentGame.items=all;
  renderGame();
}

function renderGame(){
  const categories=currentGame.categories;

  document.getElementById("content").innerHTML=`
    <div class="card">
      <h2>${escapeHtml(currentGame.name)}</h2>
      <div id="gameBoard">
        ${categories.map((c,i)=>`
          <div class="play-category" data-category="${i}">
            <h3>${escapeHtml(c.name)}</h3>
            <div class="dropzone"
              ondragover="allowDrop(event)"
              ondrop="dropTrait(event,${i})">
            </div>
          </div>
        `).join("")}
      </div>

      <div class="traits" id="traits"></div>

      <div class="controls">
        <button onclick="checkGame()">ELLENŐRZÉS</button>
        ${checked?`<button onclick="toggleSolution()">
          ${showingSolution?"JÁTÉKOS VÁLASZAI":"MEGOLDÁS / HELYES VÁLASZOK"}
        </button>`:""}
        <button onclick="showGames()">Játékaim</button>
      </div>

      <div id="result"></div>
    </div>
  `;

  renderTraits();
}

function renderTraits(){
  const box=document.getElementById("traits");

  if(showingSolution){
    box.innerHTML="";
    currentGame.categories.forEach((c,ci)=>{
      const category=document.querySelector(`[data-category="${ci}"] .dropzone`);
      category.innerHTML=c.traits.map(t=>`
        <div class="trait correct">${escapeHtml(t)}</div>
      `).join("");
    });
    return;
  }

  const placed=[];
  document.querySelectorAll(".dropzone .trait").forEach(el=>{
    placed.push(el.dataset.id);
  });

  box.innerHTML="";

  currentGame.items.forEach((item,i)=>{
    if(!placed.includes(String(i))){
      const div=document.createElement("div");
      div.className="trait";
      div.textContent=item.text;
      div.draggable=true;
      div.dataset.id=i;
      div.dataset.correct=item.correct;

      div.ondragstart=e=>{
        e.dataTransfer.setData("text/plain",i);
        div.classList.add("dragging");
      };

      div.ondragend=()=>{
        div.classList.remove("dragging");
      };

      box.appendChild(div);
    }
  });
}

function allowDrop(e){
  e.preventDefault();
}

function dropTrait(e,categoryIndex){
  e.preventDefault();

  const id=e.dataTransfer.getData("text/plain");
  const item=currentGame.items[id];

  if(!item)return;

  const target=e.currentTarget;
  const div=document.createElement("div");

  div.className="trait";
  div.textContent=item.text;
  div.draggable=true;
  div.dataset.id=id;
  div.dataset.correct=item.correct;

  div.ondragstart=ev=>{
    ev.dataTransfer.setData("text/plain",id);
    div.classList.add("dragging");
  };

  div.ondragend=()=>{
    div.classList.remove("dragging");
  };

  target.appendChild(div);

  renderTraits();
}

function checkGame(){
  checked=true;
  showingSolution=false;

  let correct=0;
  let total=currentGame.items.length;

  document.querySelectorAll(".dropzone .trait").forEach(el=>{
    const category=el.closest(".play-category").dataset.category;
    const isCorrect=String(category)===el.dataset.correct;

    if(isCorrect){
      el.classList.add("correct");
      correct++;
    }else{
      el.classList.add("wrong");
    }
  });

  document.getElementById("result").innerHTML=
    `<div class="result">${correct} / ${total} helyes</div>`;

  renderGame();
  setTimeout(()=>{
    document.querySelectorAll(".dropzone .trait").forEach(el=>{
      const category=el.closest(".play-category").dataset.category;
      if(String(category)===el.dataset.correct)
        el.classList.add("correct");
      else
        el.classList.add("wrong");
    });

    document.getElementById("result").innerHTML=
      `<div class="result">${correct} / ${total} helyes</div>`;
  },0);
}

function toggleSolution(){
  showingSolution=!showingSolution;
  renderGame();

  if(!showingSolution){
    restorePlayerAnswers();
  }
}

function restorePlayerAnswers(){
  renderGame();
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeAttr(s){
  return escapeHtml(s);
}

showGames();

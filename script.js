let games = JSON.parse(localStorage.getItem("csoportositoGames") || "[]");

let currentGame = null;
let playerAnswers = {};
let checked = false;
let showingCorrect = false;

function saveGames(){
    localStorage.setItem("csoportositoGames", JSON.stringify(games));
}

function home(){

    document.getElementById("content").innerHTML = `
        <div class="top">
            <div>
                <h2>Játékaim</h2>
            </div>

            <div class="new-game">
                <button onclick="newGame()">＋ Új játék</button>
                <button onclick="editSelected()">Szerkesztése</button>
            </div>
        </div>

        <div class="game-list">
            ${
                games.length
                ? games.map((game,index)=>`
                    <div class="game-item" onclick="startGame(${index})">
                        ${escapeHtml(game.name)}
                    </div>
                `).join("")
                : ""
            }
        </div>
    `;
}

function newGame(){

    currentGame = {
        name:"",
        categories:[]
    };

    renderEditor();
}

function editSelected(){
    if(games.length){
        editGame(0);
    }
}

function editGame(index){

    currentGame = JSON.parse(JSON.stringify(games[index]));
    currentGame.index = index;

    renderEditor();
}

function renderEditor(){

    document.getElementById("content").innerHTML = `

        <div class="editor">

            <h2>Játék szerkesztése</h2>

            <div class="game-name">
                <input
                    id="gameName"
                    placeholder="Játéknév"
                    value="${escapeAttr(currentGame.name)}"
                >
            </div>

            <div id="editorCategories"></div>

            <button class="add" onclick="addCategory()">
                ＋ Kategória
            </button>

            <div class="editor-buttons">
                <button onclick="saveGame()">Mentés</button>
                <button class="secondary" onclick="home()">Mégse</button>
            </div>

        </div>
    `;

    renderEditorCategories();
}

function renderEditorCategories(){

    const container = document.getElementById("editorCategories");

    container.innerHTML = currentGame.categories.map((category,index)=>`

        <div class="editor-category">

            <div class="editor-category-title">

                <input
                    placeholder="Kategória neve"
                    value="${escapeAttr(category.name)}"
                    oninput="
                        currentGame.categories[${index}].name=this.value
                    "
                >

                <button
                    class="delete"
                    onclick="deleteCategory(${index})"
                >×</button>

            </div>

            ${
                category.traits.map((trait,traitIndex)=>`

                    <div class="editor-trait">

                        <input
                            placeholder="Jellemző"
                            value="${escapeAttr(trait)}"
                            oninput="
                                currentGame.categories[${index}].traits[${traitIndex}]=this.value
                            "
                        >

                        <button
                            class="delete"
                            onclick="deleteTrait(${index},${traitIndex})"
                        >×</button>

                    </div>

                `).join("")
            }

            <button
                class="add"
                onclick="addTrait(${index})"
            >
                ＋ Jellemző
            </button>

        </div>

    `).join("");
}

function addCategory(){

    currentGame.categories.push({
        name:"",
        traits:[""]
    });

    renderEditorCategories();
}

function deleteCategory(index){

    currentGame.categories.splice(index,1);

    renderEditorCategories();
}

function addTrait(categoryIndex){

    currentGame.categories[categoryIndex].traits.push("");

    renderEditorCategories();
}

function deleteTrait(categoryIndex,traitIndex){

    currentGame.categories[categoryIndex].traits.splice(traitIndex,1);

    renderEditorCategories();
}

function saveGame(){

    currentGame.name =
        document.getElementById("gameName").value.trim();

    if(!currentGame.name){
        alert("Adj nevet a játéknak!");
        return;
    }

    currentGame.categories =
        currentGame.categories
        .map(category=>({
            name:category.name.trim(),
            traits:category.traits
                .map(t=>t.trim())
                .filter(Boolean)
        }))
        .filter(category=>category.name && category.traits.length);

    if(!currentGame.categories.length){
        alert("Adj hozzá legalább egy kategóriát és egy jellemzőt!");
        return;
    }

    if(currentGame.index !== undefined){

        games[currentGame.index] =
            JSON.parse(JSON.stringify(currentGame));

        delete games[currentGame.index].index;

    }else{

        games.push(
            JSON.parse(JSON.stringify(currentGame))
        );

    }

    saveGames();

    home();
}

function startGame(index){

    currentGame =
        JSON.parse(JSON.stringify(games[index]));

    checked=false;
    showingCorrect=false;
    playerAnswers={};

    const allTraits=[];

    currentGame.categories.forEach((category,categoryIndex)=>{

        category.traits.forEach(trait=>{

            allTraits.push({
                text:trait,
                correctCategory:categoryIndex
            });

        });

    });

    allTraits.sort(()=>Math.random()-.5);

    currentGame.allTraits=allTraits;

    renderGame();
}

function renderGame(){

    document.getElementById("content").innerHTML = `

        <h2>${escapeHtml(currentGame.name)}</h2>

        <div class="play-traits" id="traits">

            ${
                currentGame.allTraits.map((trait,index)=>`

                    <div
                        class="trait"
                        draggable="true"
                        data-id="${index}"
                        ondragstart="dragStart(event)"
                    >
                        ${escapeHtml(trait.text)}
                    </div>

                `).join("")
            }

        </div>

        <div class="categories">

            ${
                currentGame.categories.map((category,index)=>`

                    <div
                        class="play-category"
                        data-category="${index}"
                    >

                        <h3>${escapeHtml(category.name)}</h3>

                        <div
                            class="dropzone"
                            ondragover="allowDrop(event)"
                            ondrop="dropTrait(event,${index})"
                        ></div>

                    </div>

                `).join("")
            }

        </div>

        <div class="check-area">

            <button onclick="checkGame()">
                Ellenőrzés
            </button>

        </div>
    `;
}

function dragStart(event){

    event.dataTransfer.setData(
        "text/plain",
        event.target.dataset.id
    );
}

function allowDrop(event){

    event.preventDefault();
}

function dropTrait(event,categoryIndex){

    event.preventDefault();

    if(checked) return;

    const id =
        event.dataTransfer.getData("text/plain");

    const trait =
        currentGame.allTraits[id];

    if(!trait) return;

    playerAnswers[id]=categoryIndex;

    const element =
        document.querySelector(
            `.trait[data-id="${id}"]`
        );

    if(element){

        element.remove();

        const newElement =
            document.createElement("div");

        newElement.className="trait";
        newElement.draggable=true;
        newElement.dataset.id=id;
        newElement.textContent=trait.text;

        newElement.ondragstart=dragStart;

        event.currentTarget.appendChild(newElement);
    }
}

function checkGame(){

    checked=true;

    let correct=0;

    currentGame.allTraits.forEach((trait,index)=>{

        if(
            Number(playerAnswers[index]) ===
            Number(trait.correctCategory)
        ){
            correct++;
        }

    });

    renderCheckResult(correct);
}

function renderCheckResult(correct){

    document.getElementById("content").innerHTML = `

        <h2>${escapeHtml(currentGame.name)} / ellenőrzés</h2>

        <div class="result">
            ${correct} / ${currentGame.allTraits.length} helyes
        </div>

        <div class="categories">

            ${
                currentGame.categories.map((category,categoryIndex)=>`

                    <div class="play-category">

                        <h3>${escapeHtml(category.name)}</h3>

                        <div class="dropzone">

                            ${
                                currentGame.allTraits
                                .map((trait,index)=>{

                                    const player =
                                        playerAnswers[index];

                                    if(
                                        Number(player) ===
                                        Number(categoryIndex)
                                    ){

                                        const isCorrect =
                                            Number(player) ===
                                            Number(trait.correctCategory);

                                        return `
                                            <div class="trait ${
                                                isCorrect
                                                ? "correct"
                                                : "wrong"
                                            }">
                                                ${escapeHtml(trait.text)}
                                            </div>
                                        `;
                                    }

                                    return "";

                                }).join("")
                            }

                        </div>

                    </div>

                `).join("")
            }

        </div>

        <div class="answer-toggle">

            <button onclick="toggleAnswers()">
                ${
                    showingCorrect
                    ? "Játékos megoldásai"
                    : "Helyes megoldás"
                }
            </button>

            <button onclick="home()">
                Játékaim
            </button>

        </div>
    `;
}

function toggleAnswers(){

    showingCorrect=!showingCorrect;

    if(showingCorrect){

        renderCorrectAnswers();

    }else{

        let correct=0;

        currentGame.allTraits.forEach((trait,index)=>{

            if(
                Number(playerAnswers[index]) ===
                Number(trait.correctCategory)
            ){
                correct++;
            }

        });

        renderCheckResult(correct);
    }
}

function renderCorrectAnswers(){

    document.getElementById("content").innerHTML = `

        <h2>${escapeHtml(currentGame.name)} / ellenőrzés</h2>

        <div class="categories">

            ${
                currentGame.categories.map(category=>`

                    <div class="play-category">

                        <h3>${escapeHtml(category.name)}</h3>

                        <div class="dropzone">

                            ${
                                category.traits.map(trait=>`

                                    <div class="trait correct">
                                        ${escapeHtml(trait)}
                                    </div>

                                `).join("")
                            }

                        </div>

                    </div>

                `).join("")
            }

        </div>

        <div class="answer-toggle">

            <button onclick="toggleAnswers()">
                Játékos megoldásai
            </button>

            <button onclick="home()">
                Játékaim
            </button>

        </div>
    `;
}

function escapeHtml(value){

    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function escapeAttr(value){

    return escapeHtml(value);
}

home();

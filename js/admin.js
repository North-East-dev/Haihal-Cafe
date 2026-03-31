/////////////////////////////
// 🔥 FIREBASE INIT
/////////////////////////////

const firebaseConfig = {
  apiKey: "AIzaSyAU3kzG4NnXHg6qRG8ccDcjUj95MiGn-HU",
  authDomain: "haihal-cafe.firebaseapp.com",
  projectId: "haihal-cafe",
  storageBucket: "haihal-cafe.firebasestorage.app",
  messagingSenderId: "279232044716",
  appId: "1:279232044716:web:6d8b4520625e26176f0909"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const storage = firebase.storage();

/////////////////////////////
// DATA
/////////////////////////////

let data = { menu: [] };

/////////////////////////////
// LOAD FROM FIREBASE
/////////////////////////////

function loadMenu(){

    db.ref("menu").once("value", snap => {

        if(snap.val()){
            data.menu = snap.val();   // ✅ FIXED STRUCTURE
        } else {
            data = { menu: [] };
        }

        render();
    });
}

/////////////////////////////
// CATEGORY NORMALIZATION
/////////////////////////////

function normalizeCategory(name){
    return name.trim().toLowerCase();
}

/////////////////////////////
// ADD ITEM
/////////////////////////////

function addItem(){

    const c = document.getElementById("category").value.trim();
    const n = document.getElementById("name").value.trim();
    const p = document.getElementById("price").value;
    const t = document.getElementById("type").value;
    const i = document.getElementById("image").value;
    const d = document.getElementById("description").value;

    if(!c || !n){
        alert("Category and name required");
        return;
    }

    let cat = data.menu.find(x =>
        normalizeCategory(x.category) === normalizeCategory(c)
    );

    if(!cat){
        cat = { category:c, items:[] };
        data.menu.push(cat);
    }

    cat.items.push({
        name:n,
        price:Number(p),
        type:t,
        src:i,
        description:d
    });

    // RESET FORM
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("image").value = "";
    document.getElementById("description").value = "";
    document.getElementById("preview").src = "";

    render();
}

/////////////////////////////
// RENDER UI
/////////////////////////////

function render(){

    const container = document.getElementById("menu");
    container.innerHTML = "";

    data.menu.forEach((cat, ci) => {

        const section = document.createElement("div");
        section.className = "category-block";

        const title = document.createElement("h3");
        title.textContent = cat.category;

        const controls = document.createElement("div");
        controls.className = "category-controls";

        controls.innerHTML = `
            <button onclick="addItemTo(${ci})">+ Item</button>
            <button onclick="deleteCategory(${ci})">Delete</button>
        `;

        const grid = document.createElement("div");
        grid.className = "card-grid";

        cat.items.forEach((item, ii) => {

            const desc = item.description || "";

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                ${item.src ? `<img src="${item.src}">` : `<div class="no-img">No Image</div>`}

                <input value="${item.name}" 
                    onchange="update(${ci},${ii},'name',this.value)">

                <input value="${item.price}" 
                    onchange="update(${ci},${ii},'price',this.value)">

                <select onchange="update(${ci},${ii},'type',this.value)">
                    <option ${item.type==='veg'?'selected':''}>veg</option>
                    <option ${item.type==='non-veg'?'selected':''}>non-veg</option>
                </select>

                <textarea onchange="update(${ci},${ii},'description',this.value)">${desc}</textarea>

                <button onclick="deleteItem(${ci},${ii})">Delete</button>
            `;

            grid.appendChild(card);
        });

        section.appendChild(title);
        section.appendChild(controls);
        section.appendChild(grid);

        container.appendChild(section);
    });
}

/////////////////////////////
// EDIT FUNCTIONS
/////////////////////////////

function update(ci,ii,key,value){
    data.menu[ci].items[ii][key] = value;
}

function deleteItem(ci,ii){
    data.menu[ci].items.splice(ii,1);
    render();
}

function deleteCategory(ci){
    data.menu.splice(ci,1);
    render();
}

function addItemTo(ci){
    data.menu[ci].items.push({
        name:"New Item",
        price:0,
        type:"veg",
        src:"",
        description:""
    });
    render();
}

/////////////////////////////
// REMOVE IMAGE
/////////////////////////////

function removeImage(){
    document.getElementById("preview").src = "";
    document.getElementById("image").value = "";
}

/////////////////////////////
// SAVE TO FIREBASE
/////////////////////////////

function saveMenu(){

    db.ref("menu").set(data.menu)   // ✅ FIXED
    .then(() => {
        alert("Saved to Firebase ✅");
    })
    .catch(err => {
        console.error(err);
        alert("Error saving ❌");
    });
}

/////////////////////////////
// DRAG & DROP (UPLOAD TO FIREBASE)
/////////////////////////////

window.addEventListener("DOMContentLoaded", () => {

    const dropZone = document.getElementById("dropZone");

    if(!dropZone) return;

    dropZone.addEventListener("dragover", e => e.preventDefault());

    dropZone.addEventListener("drop", async e => {

        e.preventDefault();

        const file = e.dataTransfer.files[0];
        if(!file) return;

        try {

            const ref = storage.ref("menu/" + Date.now());
            await ref.put(file);

            const url = await ref.getDownloadURL();

            document.getElementById("preview").src = url;
            document.getElementById("image").value = url;

        } catch(err){
            console.error(err);
            alert("Image upload failed ❌");
        }
    });

});
///////////////////////////
// 🔥 FIREBASE INIT
/////////////////////////////

const firebaseConfig = {
  apiKey: "AIzaSyAU3kzG4NnXHg6qRG8ccDcjUj95MiGn-HU",
  authDomain: "haihal-cafe.firebaseapp.com",
  databaseURL: "https://haihal-cafe-default-rtdb.firebaseio.com",
  projectId: "haihal-cafe",
  storageBucket: "haihal-cafe.firebasestorage.app",
  messagingSenderId: "279232044716",
  appId: "1:279232044716:web:6d8b4520625e26176f0909"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const storage = firebase.storage();

// Surface errors instead of failing silently
window.addEventListener("error", e => {
    console.error("Admin JS error:", e.error || e.message || e);
});
window.addEventListener("unhandledrejection", e => {
    console.error("Admin unhandled rejection:", e.reason || e);
});

/////////////////////////////
// DATA
/////////////////////////////

let data = { menu: [] };

/////////////////////////////
// 📸 IMAGE UPLOAD UTILS (Base64 Mode)
/////////////////////////////

async function uploadToStorage(file, callback) {
    if (!file) return;

    const el = document.getElementById("saveStatus");
    if (el) {
        el.textContent = "Processing image...";
        el.style.color = "gold";
    }

    // 🔥 SWITCHED TO BASE64 TO AVOID CORS HEADACHE
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result;
        console.log('✅ Image processed as Base64');
        
        if (el) {
            el.textContent = "Image ready ✅";
            setTimeout(() => { if(el.textContent.includes('ready')) el.textContent = ''; }, 2000);
        }
        
        callback(base64String);
    };
    reader.onerror = () => {
        console.error('❌ FileReader Error');
        if (el) el.textContent = "Failed to read image";
        alert("Failed to read image file.");
    };
    reader.readAsDataURL(file);
}

function sanitizeFilename(name) { return name; } // Not needed for base64 but keeping for compatibility

/////////////////////////////
// LOAD FROM FIREBASE
/////////////////////////////

function loadMenu(){

    console.log('🔥 loadMenu called');
    
    db.ref("menu").once("value", snap => {
        console.log('✅ Firebase snapshot received:', snap.val() ? 'data loaded' : 'null/empty');

        const val = snap.val();

        // Firebase can return objects instead of arrays depending on saved shape.
        // Also support wrapper shape: { restaurant, menu: [...] }
        let loaded = val;

        if (loaded && !Array.isArray(loaded) && Array.isArray(loaded.menu)) {
            loaded = loaded.menu;
        }

        if (loaded && !Array.isArray(loaded)) {
            loaded = Object.values(loaded);
        }

        if (!loaded) loaded = [];
        
        console.log('📊 Loaded menu categories:', loaded.length);

        data.menu = loaded.map(cat => {
            const safeCat = cat || {};
            let items = safeCat.items;

            if (items && !Array.isArray(items)) {
                items = Object.values(items);
            }
            if (!items) items = [];

            return { 
                ...safeCat, 
                items: items.map(item => ({
                    ...item,
                    featured: item.featured !== undefined ? normalizeFeatured(item.featured) : false
                }))
            };

        });

        console.log('✅ data.menu ready with', data.menu.length, 'categories');
        render();
    }).catch(err => {
        console.error('❌ Firebase loadMenu error:', err);
        data.menu = [];
        render();
    });
}

/////////////////////////////
// CATEGORY NORMALIZATION
/////////////////////////////

function normalizeCategory(name){
    return name.trim().toLowerCase();
}

function normalizeFeatured(value){
    // Firebase can store booleans as strings depending on how data was saved/imported.
    // Treat only explicit "true"/1 as featured.
    return value === true || value === "true" || value === 1 || value === "1";
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
        price:parseFloat(p) || 0,
        type:t,
        src:i || '',
        description:d || '',
        featured:false // ⭐ NEW
    });

    render();
    saveMenu();
    
    // Clear form
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("image").value = "";
    document.getElementById("description").value = "";
    document.getElementById("preview").src = "";
}

/////////////////////////////
// 🔥 RENDER UI
/////////////////////////////

let dragData = null;

function render(){

    const container = document.getElementById("menu");
    container.innerHTML = "";
    
// 🔥 CLEAR PREVIOUS DELEGATION
    container.removeEventListener('click', handleCardAction);
    container.removeEventListener('change', handleCardUpdate);
    container.removeEventListener('drop', handleDropReorder, true);

// 🔥 NEW DELEGATED REORDER DROP
    container.addEventListener('drop', handleDropReorder, true); // capture phase

    data.menu.forEach((cat, ci) => {

        // ⭐ SMART SORT (stable within same featured group)
        // We tie-break by the current array index so drag reordering doesn't appear random.
        const itemsWithIndex = cat.items.map((it, idx) => ({ it, idx }));
        itemsWithIndex.sort((a, b) => {
            const featuredDiff =
                normalizeFeatured(b.it.featured) - normalizeFeatured(a.it.featured);
            if (featuredDiff !== 0) return featuredDiff;
            return a.idx - b.idx;
        });
        cat.items = itemsWithIndex.map(x => x.it);

        const section = document.createElement("div");
        section.className = "category-block";

        const title = document.createElement("h3");
        title.textContent = cat.category;

        const controls = document.createElement("div");
        controls.className = "category-controls";
        controls.dataset.ci = ci;
        controls.innerHTML = `
            <button class="add-item" data-action="add">+ Item</button>
            <button class="delete-cat" data-action="delete">Delete</button>
        `;

        const grid = document.createElement("div");
        grid.className = "card-grid";

        cat.items.forEach((item, ii) => {

            const desc = item.description || "";
            const isFeatured = normalizeFeatured(item.featured);

            const card = document.createElement("div");
            card.className = "card" + (isFeatured ? " featured" : "");
            card.dataset.ci = ci;
            card.dataset.ii = ii;

            // 🔥 DRAG REORDER - ONLY START FROM HANDLE
            card.innerHTML = `
                <div class="drag-handle" draggable="true">⋮⋮ Move</div>

                ${isFeatured ? `<div class="featured-badge">⭐ Featured</div>` : ""}

                ${item.src ? `<img src="${item.src}">` : `<div class="no-img">No Image</div>`}

                <input class="edit-field" data-field="name" value="${item.name}" placeholder="Item Name">
                <input class="edit-field" data-field="price" type="number" value="${item.price}" placeholder="Price">
                <input class="edit-field" data-field="src" value="${item.src || ''}" placeholder="Image URL (or upload below)">
                <select class="edit-field" data-field="type">
                    <option value="veg" ${item.type==='veg'?'selected':''}>Veg</option>
                    <option value="non-veg" ${item.type==='non-veg'?'selected':''}>Non-Veg</option>
                </select>
                <textarea class="edit-field" data-field="description" placeholder="Description">${desc}</textarea>

                <button class="toggle-featured" data-action="toggle">⭐ ${isFeatured ? "Unfeature" : "Feature"}</button>

                <div class="item-drop-zone">
                    📸 Drop Image Here or Click
                </div>

                <input type="file" accept="image/*" class="file-upload" style="display:none;">

                <button class="remove-img" data-action="removeImg">🗑️ Remove Image</button>

                <button class="delete-item" data-action="delete">🗑️ Delete</button>
            `;

            // 🔥 DRAG REORDER EVENT
            const handle = card.querySelector(".drag-handle");
            handle.ondragstart = e => dragStart(ci, ii, e);
            card.ondragover = e => e.preventDefault();

            // 🔥 PER-CARD DROP ZONE - FIXED PROPAGATION
            const dropZoneEl = card.querySelector(".item-drop-zone");
            const fileInput = card.querySelector(".file-upload");
            
            if (dropZoneEl && fileInput) {
                dropZoneEl.onclick = (e) => {
                    e.stopPropagation();
                    fileInput.click();
                };
                
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZoneEl.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }, true);
                });
                
                dropZoneEl.addEventListener('dragover', () => dropZoneEl.classList.add("drag-over"));
                dropZoneEl.addEventListener('dragleave', () => dropZoneEl.classList.remove("drag-over"));
                dropZoneEl.addEventListener('drop', (e) => {
                    dropZoneEl.classList.remove("drag-over");
                    dropItemImage(e, ci, ii);
                });
                
                // File upload
                fileInput.onchange = (event) => uploadItemImage(event, ci, ii);
            }

            grid.appendChild(card);
        });

        section.appendChild(title);
        section.appendChild(controls);
        section.appendChild(grid);

        container.appendChild(section);
    });
    
// 🔥 EVENT DELEGATION
    container.addEventListener('click', handleCardAction);
    container.addEventListener('change', handleCardUpdate);
    
    console.log('✅ Render complete - image drops fixed');

}

/////////////////////////////
// 🔥 DELEGATION HANDLERS
/////////////////////////////

function handleCardAction(e) {
    e.stopPropagation();
    
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const card = btn.closest('.card');
    const controls = btn.closest('.category-controls');
    
    const ci = parseInt(card ? card.dataset.ci : (controls ? controls.dataset.ci : -1));
    const ii = card ? parseInt(card.dataset.ii) : -1;
    
    const action = btn.dataset.action;
    
    switch(action) {
        case 'add':
            addItemTo(ci);
            break;
        case 'delete':
            if (ii >= 0) {
                if (confirm('Delete item?')) deleteItem(ci, ii);
            } else if (ci >= 0) {
                if (confirm('Delete category?')) deleteCategory(ci);
            }
            break;
        case 'toggle':
            toggleFeatured(ci, ii);
            break;
        case 'removeImg':
            removeItemImage(ci, ii);
            break;
    }
    render();
}

// Inline handlers above - this is fallback
function handleCardUpdate(e) {
    const field = e.target.closest('.edit-field');
    if (!field) return;
    
    const card = field.closest('.card');
    if (!card) return;
    
    const ci = parseInt(card.dataset.ci);
    const ii = parseInt(card.dataset.ii);
    if (isNaN(ci) || isNaN(ii)) return;
    
    const key = field.dataset.field;
    let value = field.value;
    
    if (key === 'price') value = parseFloat(value) || 0;
    
    data.menu[ci].items[ii][key] = value;
    saveMenu();
    // Don't re-render everything on text input to preserve focus
    // Only re-render if it's a select or if we really need to update the UI
    if (field.tagName === 'SELECT') {
        render();
    }
}

function handleSelectChange(select, ci, ii) {
    // This is now handled by handleCardUpdate via delegation
}

function handleFileUpload(event, ci, ii) {
    // This is now handled by uploadItemImage
}

/////////////////////////////
// ⭐ FEATURE TOGGLE
/////////////////////////////

function toggleFeatured(ci, ii){

    const item = data.menu[ci].items[ii];

    item.featured = !normalizeFeatured(item.featured);
    item.featured = Boolean(item.featured);
    
    saveMenu();   
    render();
}

/////////////////////////////
// 🔀 DRAG REORDER
/////////////////////////////

function dragStart(ci, ii, e){
    dragData = {ci, ii};

    if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", `CARD_REORDER:${ci},${ii}`);
        e.dataTransfer.effectAllowed = "move";
        // Optional: add a drag image
    }
}

function handleDropReorder(e) {
    // If dropping on an image drop zone, ignore reorder
    if (e.target.closest('.item-drop-zone')) return;
    
    const card = e.target.closest('.card');
    if (!card) return;
    
    const ci = parseInt(card.dataset.ci);
    const ii = parseInt(card.dataset.ii);
    if (isNaN(ci) || isNaN(ii)) return;
    
    e.preventDefault();
    if (!dragData) return;
    
    // Don't reorder if dropped on self
    if (dragData.ci === ci && dragData.ii === ii) {
        dragData = null;
        return;
    }
    
    const sourceItem = data.menu[dragData.ci].items.splice(dragData.ii, 1)[0];
    data.menu[ci].items.splice(ii, 0, sourceItem);
    dragData = null;
    
    saveMenu();
    render();
}

function dropItemImage(e, ci, ii){
    console.log('✅ IMAGE DROP on', ci, ii);
    
    const dt = e.dataTransfer;
    if (!dt) return;
    
    // Check if it's a file drop
    if (dt.files && dt.files[0]) {
        uploadToStorage(dt.files[0], (url) => {
            data.menu[ci].items[ii].src = url;
            saveMenu();
            render();
        });
        return;
    }
    
    // Check if it's a URL drop
    let url = dt.getData("text/uri-list") || dt.getData("text/plain");
    if (!url || url.includes('CARD_REORDER')) return;
    
    url = url.trim().split('\n')[0];
    data.menu[ci].items[ii].src = url;
    saveMenu();
    render();
}

async function uploadFileToFirebase(file, ci, ii) {
    // This function is being phased out in favor of uploadToStorage
    uploadToStorage(file, (url) => {
        data.menu[ci].items[ii].src = url;
        saveMenu();
        render();
    });
}

async function uploadItemImage(e, ci, ii) {
    const file = e.target.files[0];
    if (file) {
        uploadToStorage(file, (url) => {
            data.menu[ci].items[ii].src = url;
            saveMenu();
            render();
        });
    }
}

/////////////////////////////
// EDIT FUNCTIONS
/////////////////////////////

function update(ci,ii,key,value){
    data.menu[ci].items[ii][key] = value;
    saveMenu();
}

function deleteItem(ci,ii){
    data.menu[ci].items.splice(ii,1);
    render();
    saveMenu();
}

function deleteCategory(ci){
    data.menu.splice(ci,1);
    render();
    saveMenu();
}

function addItemTo(ci){
    data.menu[ci].items.push({
        name:"New Item",
        price:0,
        type:"veg",
        src:"",
        description:"",
        featured:false
    });
    render();
    saveMenu();
}

function removeItemImage(ci, ii){
    data.menu[ci].items[ii].src = "";
    render();
    saveMenu();
}

function removeImage(){
    const previewEl = document.getElementById("preview");
    const imageInput = document.getElementById("image");
    if (previewEl) previewEl.src = "";
    if (imageInput) imageInput.value = "";
}

/////////////////////////////
// SAVE
/////////////////////////////

function saveMenu(){

    const el = document.getElementById("saveStatus");
    const set = (text, color) => {
        if (!el) return;
        el.textContent = text;
        el.style.color = color || '';
    };

    set("Saving...", "#fff");

    db.ref("menu").set(data.menu)
        .then(() => {
            console.log("Saved ✅");
            set("Saved ✅", "gold");
        })
        .catch(err => {
            console.error("Save failed", err);
            set("Save failed ❌", "#ff7b7b");
        });
}

/////////////////////////////
// FORM DROP ZONE
/////////////////////////////

window.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    if (!dropZone) return;

    const previewEl = document.getElementById("preview");
    const imageInput = document.getElementById("image");

    const handleFile = async (file) => {
        uploadToStorage(file, (url) => {
            if (previewEl) previewEl.src = url;
            if (imageInput) imageInput.value = url;
        });
    };

    dropZone.onclick = () => {
        const input = document.createElement("input");
        input.type = "file" ;
        input.accept = "image/*";
        input.onchange = (e) => handleFile(e.target.files[0]);
        input.click();
    };

    // Add Drag & Drop to Quick Add Zone
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
});

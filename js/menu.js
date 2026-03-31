/////////////////////////////
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

/////////////////////////////
// DATA
/////////////////////////////

let menuData = [];

/////////////////////////////
// 🔄 REAL-TIME LOAD FROM FIREBASE
/////////////////////////////

db.ref("menu").on("value", snapshot => {

    const data = snapshot.val();

    if (!data) {
        menuData = [];
    } else {
        menuData = data;   // ✅ already array from admin
    }

    renderMenu();
});

/////////////////////////////
// RENDER FUNCTION (UNCHANGED CORE)
/////////////////////////////

function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = "";

    const searchInput = document.getElementById("search");
    const filterInput = document.getElementById("filter");
    
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const filter = filterInput ? filterInput.value : "all";

    if (!menuData || menuData.length === 0) {
        container.innerHTML = `<div class="no-results">Menu is being loaded...</div>`;
        return;
    }

    let resultsFound = false;

    menuData.forEach(category => {
        const section = document.createElement('div');
        section.className = "category";

        const title = document.createElement('h2');
        title.textContent = category.category;
        section.appendChild(title);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = "items";

        let categoryHasItems = false;

        // ⭐ Featured items first within category
        const sortedItems = [...category.items].sort((a, b) => {
            const featA = normalizeFeatured(a.featured);
            const featB = normalizeFeatured(b.featured);
            return featB - featA;
        });

        sortedItems.forEach(item => {
            const nameMatch = item.name.toLowerCase().includes(search) || 
                              (item.description && item.description.toLowerCase().includes(search));
            const typeMatch = (filter === "all" || item.type === filter);

            if (!nameMatch || !typeMatch) return;

            categoryHasItems = true;
            resultsFound = true;

            const isFeatured = normalizeFeatured(item.featured);
            let priceText = item.price ? `₹${item.price}` : `₹${item.half || 0} / ₹${item.full || 0}`;

            let badges = "";
            if (item.tags) {
                if (item.tags.includes("signature")) badges += `<span class="badge signature">🔥 Signature</span>`;
                if (item.tags.includes("bestseller")) badges += `<span class="badge bestseller">⭐ Bestseller</span>`;
            }
            if (isFeatured) badges += `<span class="badge featured">⭐ Featured</span>`;

            const itemDiv = document.createElement('div');
            itemDiv.className = `menu-item ${isFeatured ? 'featured-item' : ''}`;
            
            itemDiv.innerHTML = `
                ${badges}
                ${item.src ? `<img src="${item.src}" loading="lazy" alt="${item.name}">` : `<div class="no-img-placeholder">🍽️</div>`}
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p class="price">${priceText}</p>
                    ${item.description ? `<p class="desc">${item.description}</p>` : ""}
                </div>
            `;
            itemsDiv.appendChild(itemDiv);
        });

        if (categoryHasItems) {
            section.appendChild(itemsDiv);
            container.appendChild(section);
        }
    });

    if (!resultsFound) {
        container.innerHTML = `<div class="no-results">No items found matching your search.</div>`;
    }
}

function normalizeFeatured(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

/////////////////////////////
// 🔥 EVENT LISTENERS (UNCHANGED)
/////////////////////////////

document.getElementById("search")?.addEventListener("input", renderMenu);
document.getElementById("filter")?.addEventListener("change", renderMenu);
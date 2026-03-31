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
    container.innerHTML = "";

    const search = document.getElementById("search")?.value.toLowerCase() || "";
    const filter = document.getElementById("filter")?.value || "all";

    menuData.forEach(category => {

        const section = document.createElement('div');
        section.className = "category";

        // ⭐ highlight category
        if (category.highlight) {
            section.classList.add("highlight");
        }

        const title = document.createElement('h2');
        title.textContent = category.category;
        section.appendChild(title);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = "items";

        let hasItems = false;

        category.items.forEach(item => {

            // 🔍 search + filter
            const nameMatch = item.name.toLowerCase().includes(search);
            const typeMatch = (filter === "all" || item.type === filter);

            if (!nameMatch || !typeMatch) return;

            hasItems = true;

            // 💰 price
            let priceText = item.price
                ? `₹${item.price}`
                : `₹${item.half} / ₹${item.full}`;

            // 🔥 badges
            let badge = "";

            if (item.tags) {
                if (item.tags.includes("signature")) {
                    badge += `<span class="badge signature">🔥 Signature</span>`;
                }
                if (item.tags.includes("bestseller")) {
                    badge += `<span class="badge bestseller">⭐ Bestseller</span>`;
                }
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = "menu-item";

            itemDiv.innerHTML = `
                ${badge}

                ${item.src ? `<img src="${item.src}">` : ""}

                <h3>${item.name}</h3>
                <p>${priceText}</p>

                ${item.description ? `<p class="desc">${item.description}</p>` : ""}
            `;

            itemsDiv.appendChild(itemDiv);
        });

        if (hasItems) {
            section.appendChild(itemsDiv);
            container.appendChild(section);
        }

    });
}

/////////////////////////////
// 🔥 EVENT LISTENERS (UNCHANGED)
/////////////////////////////

document.getElementById("search")?.addEventListener("input", renderMenu);
document.getElementById("filter")?.addEventListener("change", renderMenu);
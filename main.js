import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAH4Qa2eVZYBdmTqY33y72Z2Cmp5O3hZOg",
    authDomain: "exploreworldmap.firebaseapp.com",
    projectId: "exploreworldmap",
    storageBucket: "exploreworldmap.firebasestorage.app",
    messagingSenderId: "1073618479887",
    appId: "1:1073618479887:web:acb49d652549f3545dec7a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Elements
const authContainer = document.getElementById('auth-container');
const mapDiv = document.getElementById('map');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('error-msg');

// Handle login
loginBtn.addEventListener('click', async () => {
    try {
        const email = emailInput.value;
        const password = passwordInput.value;
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        errorMsg.textContent = error.message;
    }
});

// Show map for authenticated users
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authContainer.classList.add('hidden');
        mapDiv.classList.remove('hidden');

        const userId = user.uid;
        const userRef = ref(database, `users/${userId}/countries`);
        const countries = (await get(userRef)).val() || {};

        const map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        fetch('https://unpkg.com/world-atlas/countries-50m.json')
            .then(res => res.json())
            .then(data => {
                const countriesGeo = topojson.feature(data, data.objects.countries);

                countriesGeo.features.forEach(country => {
                    const layer = L.geoJSON(country, {
                        style: {
                            color: 'black',
                            fillColor: countries[country.id] || 'white',
                            fillOpacity: 0.6
                        }
                    }).addTo(map);

                    layer.on('click', () => {
                        const category = prompt("Select a category (null, traveled, friend's country, my country, scheduled visit):");
                        if (category) {
                            countries[country.id] = category;
                            set(userRef, countries);
                            layer.setStyle({ fillColor: getCategoryColor(category) });
                        }
                    });
                });
            });
    } else {
        authContainer.classList.remove('hidden');
        mapDiv.classList.add('hidden');
    }
});

function getCategoryColor(category) {
    return {
        null: 'white',
        traveled: 'red',
        "friend's country": 'pink',
        "my country": 'blue',
        "scheduled visit": 'orange'
    }[category] || 'white';
}

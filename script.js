"use strict";

/* =========================================
   GABY MUSIC - MAIN JAVASCRIPT (UPGRADED)
   ========================================= */

// GITHUB REPOSITORY
const GITHUB_API = "https://api.github.com/repos/gabyofficial57/GabyMusic/contents";

// DEFAULT SONGS
const defaultSongs = [
    {
        title: "Diez Dola - ONIVA Ft The Ben",
        file: "music/Diez Dola - ONIVA Ft The Ben (Official Music Video) [aHmE4QmI5zA].mp3",
        image: "images/cover1.jpg",
        category: "Rwandan Music"
    },
    {
        title: "Element Eleéeh - MY DEAR",
        file: "music/Element Eleéeh - MY DEAR (Lyric Video) [g0dNcA7c188].mp3",
        image: "images/cover2.jpg",
        category: "Afrobeat"
    }
];

// CATEGORIES
const categories = ["Rwandan Music", "Gospel", "Hip Hop", "Afrobeat", "Amapiano", "Pop", "Electronic", "Jazz", "Rock"];

// HTML ELEMENTS (Existing)
const musicList = document.getElementById("music-list");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const categoryFilter = document.getElementById("category-filter");
const addSongForm = document.getElementById("add-song-form");
const songTitle = document.getElementById("song-title");
const songCategory = document.getElementById("song-category");
const songAudio = document.getElementById("song-audio");
const songImage = document.getElementById("song-image");
const recentSongsContainer = document.getElementById("recent-songs");
const trendingContainer = document.getElementById("trending-songs");
const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingImage = document.getElementById("now-playing-image");
const playPauseButton = document.getElementById("play-pause-button");
const songProgress = document.getElementById("song-progress");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");
const visualizer = document.getElementById("music-visualizer");

// HTML ELEMENTS (NEW FEATURES)
const preloader = document.getElementById("preloader");
const scrollProgress = document.getElementById("scroll-progress");
const scrollTopBtn = document.getElementById("scroll-top-btn");
const themeSwitch = document.getElementById("theme-switch");
const cookieBanner = document.getElementById("cookie-banner");
const acceptCookiesBtn = document.getElementById("accept-cookies");
const btnShuffle = document.getElementById("btn-shuffle");
const btnRepeat = document.getElementById("btn-repeat");
const btnLike = document.getElementById("btn-like");
const btnShare = document.getElementById("btn-share");
const btnQueue = document.getElementById("btn-queue");
const queuePanel = document.getElementById("queue-panel");
const closeQueue = document.getElementById("close-queue");
const queueList = document.getElementById("queue-list");
const closeLyrics = document.getElementById("close-lyrics");
const lyricsModal = document.getElementById("lyrics-modal");
const closeShortcuts = document.getElementById("close-shortcuts");
const shortcutsModal = document.getElementById("shortcuts-modal");
const statSongs = document.getElementById("stat-songs");
const statArtists = document.getElementById("stat-artists");
const statPlays = document.getElementById("stat-plays");
const newsletterForm = document.getElementById("newsletter-form");
const contactForm = document.getElementById("contact-form");
const moodPills = document.querySelectorAll(".mood-pill");

// GLOBAL VARIABLES (Existing)
let savedSongs = [];
let githubSongs = [];
let allSongs = [];
let activeUrls = [];
let currentAudio = null;
let currentSong = null;

// GLOBAL VARIABLES (NEW FEATURES)
let isShuffle = false;
let repeatMode = 0; // 0: none, 1: all, 2: one
let playQueue = [];
let currentQueueIndex = -1;
let likedSongs = JSON.parse(localStorage.getItem("gaby_liked_songs") || "[]");
let totalPlays = parseInt(localStorage.getItem("gaby_total_plays") || "0");


/* =========================================
   NEW FEATURE: TOAST NOTIFICATIONS
   ========================================= */
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.background = type === "error" ? "#e74c3c" : "#8a2be2";
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


/* =========================================
   NEW FEATURE: UPDATE QUICK STATS
   ========================================= */
function updateStats() {
    if (!statSongs) return;
    
    const uniqueArtists = new Set(allSongs.map(song => {
        const parts = song.title.split("-");
        return parts.length > 1 ? parts[0].trim() : "Unknown";
    }));
    
    statSongs.textContent = allSongs.length;
    statArtists.textContent = uniqueArtists.size;
    statPlays.textContent = totalPlays.toLocaleString();
}


/* =========================================
   1. INDEXEDDB DATABASE (Unchanged Core Logic)
   ========================================= */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("GabyMusicDB", 2);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("songs")) {
                db.createObjectStore("songs", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings");
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadSavedSongs() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("songs", "readonly");
        const request = transaction.objectStore("songs").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
    });
}

async function seedDefaultSongs() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["songs", "settings"], "readwrite");
        const settings = transaction.objectStore("settings");
        const songs = transaction.objectStore("songs");
        const check = settings.get("defaultsAdded");
        check.onsuccess = () => {
            if (check.result === true) return;
            defaultSongs.forEach(song => songs.add(song));
            settings.put(true, "defaultsAdded");
        };
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
    });
}

async function saveSong(song) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("songs", "readwrite");
        transaction.objectStore("songs").add(song);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
    });
}

async function updateSong(song) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("songs", "readwrite");
        transaction.objectStore("songs").put(song);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
    });
}

async function deleteSong(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("songs", "readwrite");
        transaction.objectStore("songs").delete(id);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
    });
}


/* =========================================
   2. LOAD MUSIC FROM GITHUB (Unchanged Core Logic)
   ========================================= */
function detectCategory(filename) {
    const name = filename.toLowerCase();
    const found = categories.find(category =>
        name.startsWith(category.toLowerCase() + " -") ||
        name.startsWith("[" + category.toLowerCase() + "]")
    );
    return found || "GitHub Music";
}

async function loadGitHub

"use strict";

/* =========================================
   GABY MUSIC - MAIN JAVASCRIPT (FULL & COMPLETE)
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
   1. INDEXEDDB DATABASE
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
   2. LOAD MUSIC FROM GITHUB
   ========================================= */
function detectCategory(filename) {
    const name = filename.toLowerCase();
    const found = categories.find(category =>
        name.startsWith(category.toLowerCase() + " -") ||
        name.startsWith("[" + category.toLowerCase() + "]")
    );
    return found || "GitHub Music";
}

async function loadGitHubSongs() {
    const response = await fetch(`${GITHUB_API}/music?ref=main`);
    if (!response.ok) throw new Error("Could not access GitHub music folder.");
    const files = await response.json();
    if (!Array.isArray(files)) throw new Error("Invalid GitHub music folder.");
    
    return files.filter(file => file.type === "file" && /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name))
        .map(file => ({
            id: "github:" + file.name,
            title: file.name.replace(/\.[^.]+$/, ""),
            file: file.download_url,
            image: "images/cover1.jpg",
            category: detectCategory(file.name),
            source: "github"
        }));
}

async function loadGitHubImages() {
    try {
        const response = await fetch(`${GITHUB_API}/images?ref=main`);
        if (!response.ok) return [];
        const files = await response.json();
        return files.filter(file => file.type === "file" && /\.(jpg|jpeg|png|webp)$/i.test(file.name));
    } catch (error) {
        console.error("Image loading error:", error);
        return [];
    }
}

function getGitHubCover(song, images) {
    if (images.length === 0) return "images/cover1.jpg";
    const songName = song.title.toLowerCase();
    const matchingImage = images.find(image => image.name.toLowerCase().includes(songName));
    return matchingImage ? matchingImage.download_url : images[0].download_url;
}


/* =========================================
   3. COMBINE MUSIC LIBRARIES
   ========================================= */
async function loadAllMusic() {
    savedSongs = await loadSavedSongs();
    try {
        githubSongs = await loadGitHubSongs();
        const images = await loadGitHubImages();
        githubSongs.forEach(song => { song.image = getGitHubCover(song, images); });
    } catch (error) {
        console.error("GitHub music error:", error);
        githubSongs = [];
    }
    
    const localTitles = new Set(savedSongs.map(song => song.title.toLowerCase().trim()));
    const uniqueGitHubSongs = githubSongs.filter(song => !localTitles.has(song.title.toLowerCase().trim()));
    
    allSongs = [
        ...savedSongs.map(song => ({ ...song, source: "local" })),
        ...uniqueGitHubSongs
    ];
    
    updateStats();
}


/* =========================================
   4. AUDIO AND IMAGE URLS
   ========================================= */
function getSongUrl(song, type) {
    const blob = type === "audio" ? song.audioBlob : song.imageBlob;
    const file = type === "audio" ? song.file : song.image;
    if (!blob) return file;
    if (!song._urls) song._urls = {};
    if (!song._urls[type]) {
        song._urls[type] = URL.createObjectURL(blob);
        activeUrls.push(song._urls[type]);
    }
    return song._urls[type];
}


/* =========================================
   5. FORMAT TIME
   ========================================= */
function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


/* =========================================
   6. NOW PLAYING PLAYER
   ========================================= */
function updateNowPlaying(song, audio) {
    currentSong = song;
    currentAudio = audio;
    nowPlayingTitle.textContent = song.title;
    nowPlayingImage.src = getSongUrl(song, "image");
    playPauseButton.textContent = audio.paused ? "▶" : "Ⅱ";
    totalTimeDisplay.textContent = formatTime(audio.duration);
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    
    if (btnLike) {
        const isLiked = likedSongs.includes(song.title);
        btnLike.textContent = isLiked ? "❤️" : "🤍";
    }
}


/* =========================================
   7. PLAY MUSIC (With Queue/Shuffle/Repeat)
   ========================================= */
function playSong(song, fromQueue = false) {
    const audio = new Audio(getSongUrl(song, "audio"));
    audio.preload = "metadata";
    
    if (currentAudio) currentAudio.pause();
    
    currentAudio = audio;
    currentSong = song;
    updateNowPlaying(song, audio);
    
    totalPlays++;
    localStorage.setItem("gaby_total_plays", totalPlays.toString());
    updateStats();

    audio.addEventListener("play", () => {
        playPauseButton.textContent = "Ⅱ";
        if (visualizer) visualizer.classList.add("playing");
    });

    audio.addEventListener("pause", () => {
        playPauseButton.textContent = "▶";
        if (visualizer) visualizer.classList.remove("playing");
    });

    audio.addEventListener("timeupdate", () => {
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
        if (Number.isFinite(audio.duration)) {
            songProgress.value = (audio.currentTime / audio.duration) * 100;
        }
    });

    audio.addEventListener("loadedmetadata", () => {
        totalTimeDisplay.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("ended", () => {
        playPauseButton.textContent = "▶";
        songProgress.value = 0;
        if (visualizer) visualizer.classList.remove("playing");

        if (repeatMode === 2) {
            audio.currentTime = 0;
            audio.play();
        } else if (playQueue.length > 0 && currentQueueIndex < playQueue.length - 1) {
            currentQueueIndex++;
            playSong(playQueue[currentQueueIndex], true);
        } else if (repeatMode === 1) {
            currentQueueIndex = 0;
            playSong(playQueue[currentQueueIndex], true);
        } else if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * allSongs.length);
            playSong(allSongs[randomIndex]);
        } else {
            const currentIndex = allSongs.findIndex(s => s.title === song.title);
            if (currentIndex < allSongs.length - 1) {
                playSong(allSongs[currentIndex + 1]);
            }
        }
    });

    audio.addEventListener("error", () => {
        console.error("Audio could not be played:", song.title);
        showToast("Could not load this audio file.", "error");
    });

    audio.play().catch(error => {
        console.error("Playback error:", error);
        showToast("Could not play this song. Please try again.", "error");
    });
}


/* =========================================
   8. CREATE SONG CARD
   ========================================= */
function createSongCard(song) {
    const card = document.createElement("div");
    card.className = "song";
    
    const image = document.createElement("img");
    image.src = getSongUrl(song, "image");
    image.alt = song.title;
    image.className = "cover";
    image.onerror = () => { image.src = "images/cover1.jpg"; };
    
    const title = document.createElement("h3");
    title.textContent = song.title;
    title.className = "song-title";
    
    const artist = document.createElement("p");
    artist.textContent = song.title.split("-")[0].trim();
    artist.className = "song-artist";
    
    const category = document.createElement("p");
    category.textContent = song.category;
    
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.textContent = "▶ Play";
    playButton.addEventListener("click", () => {
        playQueue = allSongs.filter(s => s.category === song.category || true);
        currentQueueIndex = playQueue.findIndex(s => s.title === song.title);
        playSong(song);
    });
    
    const download = document.createElement("a");
    download.href = getSongUrl(song, "audio");
    download.download = `${song.title}.mp3`;
    download.textContent = "⬇ Download";
    download.className = "download-btn";
    
    const actions = document.createElement("div");
    actions.className = "song-actions";
    actions.append(playButton, download);
    
    if (song.source !== "github" && song.id !== undefined) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-song";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editLocalSong(song));
        
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-song";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => removeLocalSong(song));
        
        actions.append(editButton, deleteButton);
    }
    
    card.append(image, title, artist, category, actions);
    return card;
}


/* =========================================
   9, 10, 11. DISPLAY SONGS, RECENT, TRENDING
   ========================================= */
function displaySongs(songArray) {
    musicList.innerHTML = "";
    if (songArray.length === 0) {
        musicList.textContent = "No songs found.";
        return;
    }
    songArray.forEach(song => musicList.appendChild(createSongCard(song)));
}

function displayRecentSongs() {
    if (!recentSongsContainer) return;
    recentSongsContainer.innerHTML = "";
    const recentSongs = [...allSongs].slice(-5).reverse();
    if (recentSongs.length === 0) {
        recentSongsContainer.textContent = "No recent songs yet.";
        return;
    }
    recentSongs.forEach(song => {
        const item = document.createElement("div");
        item.className = "recent-song";
        item.innerHTML = `<p>${song.title}</p><small>${song.category}</small>`;
        const playButton = document.createElement("button");
        playButton.textContent = "▶";
        playButton.type = "button";
        playButton.addEventListener("click", () => playSong(song));
        item.appendChild(playButton);
        recentSongsContainer.appendChild(item);
    });
}

function displayTrendingSongs() {
    if (!trendingContainer) return;
    trendingContainer.innerHTML = "";
    const featuredSongs = allSongs.slice(0, 6);
    if (featuredSongs.length === 0) {
        trendingContainer.textContent = "No featured music available.";
        return;
    }
    featuredSongs.forEach(song => {
        const card = createSongCard(song);
        card.classList.add("trending-song");
        trendingContainer.appendChild(card);
    });
}


/* =========================================
   12. SEARCH AND CATEGORY FILTER
   ========================================= */
function filterSongs() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    
    const filteredSongs = allSongs.filter(song => {
        const matchesSearch = song.title.toLowerCase().includes(searchText);
        const matchesCategory = selectedCategory === "All" || song.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    displaySongs(filteredSongs);
}


/* =========================================
   13, 14, 15. ADD, EDIT, DELETE
   ========================================= */
addSongForm.addEventListener("submit", async event => {
    event.preventDefault();
    const audioFile = songAudio.files[0];
    const imageFile = songImage.files[0];
    
    if (!audioFile || !imageFile) { showToast("Choose an MP3 and an image.", "error"); return; }
    if (!audioFile.type.startsWith("audio/") || !imageFile.type.startsWith("image/")) {
        showToast("Choose valid audio and image files.", "error"); return;
    }
    
    const newSong = {
        title: songTitle.value.trim(),
        category: songCategory.value,
        audioBlob: audioFile,
        imageBlob: imageFile
    };
    
    if (!newSong.title) { showToast("Enter a song title.", "error"); return; }
    
    try {
        await saveSong(newSong);
        await loadAllMusic();
        addSongForm.reset();
        searchInput.value = "";
        categoryFilter.value = "All";
        filterSongs();
        displayRecentSongs();
        displayTrendingSongs();
        showToast("Song added successfully! 🎵");
    } catch (error) {
        console.error(error);
        showToast("Could not save song.", "error");
    }
});

async function editLocalSong(song) {
    const newTitle = prompt("New song title:", song.title);
    if (newTitle === null || !newTitle.trim()) return;
    
    const newCategory = prompt("Choose category: " + categories.join(", "), song.category);
    if (newCategory === null || !categories.includes(newCategory.trim())) {
        showToast("Invalid category.", "error"); return;
    }
    
    try {
        song.title = newTitle.trim();
        song.category = newCategory.trim();
        await updateSong(song);
        await loadAllMusic();
        filterSongs();
        displayRecentSongs();
        displayTrendingSongs();
        showToast("Song updated successfully! ✏️");
    } catch (error) {
        console.error(error);
        showToast("Could not update song.", "error");
    }
}

async function removeLocalSong(song) {
    if (!confirm(`Delete "${song.title}"?`)) return;
    try {
        await deleteSong(song.id);
        if (currentSong && currentSong.id === song.id) {
            if (currentAudio) currentAudio.pause();
            currentAudio = null; currentSong = null;
            nowPlayingTitle.textContent = "No song playing";
            nowPlayingImage.src = "images/cover1.jpg";
            playPauseButton.textContent = "▶";
            songProgress.value = 0;
            currentTimeDisplay.textContent = "0:00";
            totalTimeDisplay.textContent = "0:00";
        }
        await loadAllMusic();
        filterSongs();
        displayRecentSongs();
        displayTrendingSongs();
        showToast("Song deleted successfully! 🗑️");
    } catch (error) {
        console.error(error);
        showToast("Could not delete song.", "error");
    }
}


/* =========================================
   16. MAIN PLAYER CONTROLS
   ========================================= */
playPauseButton.addEventListener("click", () => {
    if (!currentAudio) { showToast("First play a song from your collection.", "error"); return; }
    if (currentAudio.paused) currentAudio.play().catch(e => console.error(e));
    else currentAudio.pause();
});

songProgress.addEventListener("input", () => {
    if (!currentAudio || !Number.isFinite(currentAudio.duration)) return;
    currentAudio.currentTime = (songProgress.value / 100) * currentAudio.duration;
});

searchButton.addEventListener("click", filterSongs);
searchInput.addEventListener("input", filterSongs);
categoryFilter.addEventListener("change", filterSongs);


/* =========================================
   NEW FEATURES: EVENT LISTENERS & LOGIC
   ========================================= */

// 1. Preloader
window.addEventListener("load", () => {
    if (preloader) preloader.style.display = "none";
});

// 2. Scroll Progress & Scroll to Top
window.addEventListener("scroll", () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    if (scrollProgress) scrollProgress.style.width = scrolled + "%";
    if (scrollTopBtn) scrollTopBtn.style.display = winScroll > 300 ? "block" : "none";
});

if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// 4. Dark/Light Mode
if (themeSwitch) {
    const savedTheme = localStorage.getItem("gaby_theme") || "dark";
    document.body.classList.add(savedTheme === "dark" ? "dark-mode" : "light-mode");
    themeSwitch.textContent = savedTheme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode";
    
    themeSwitch.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        document.body.classList.toggle("light-mode");
        const isDark = document.body.classList.contains("dark-mode");
        themeSwitch.textContent = isDark ? "🌙 Dark Mode" : "☀️ Light Mode";
        localStorage.setItem("gaby_theme", isDark ? "dark" : "light");
    });
}

// 9. Like Button
if (btnLike) {
    btnLike.addEventListener("click", () => {
        if (!currentSong) return;
        const index = likedSongs.indexOf(currentSong.title);
        if (index > -1) {
            likedSongs.splice(index, 1);
            btnLike.textContent = "🤍";
            showToast("Removed from favorites");
        } else {
            likedSongs.push(currentSong.title);
            btnLike.textContent = "❤️";
            showToast("Added to favorites ❤️");
        }
        localStorage.setItem("gaby_liked_songs", JSON.stringify(likedSongs));
    });
}

// 10. Share Button
if (btnShare) {
    btnShare.addEventListener("click", async () => {
        if (!currentSong) return;
        const shareData = {
            title: currentSong.title,
            text: `Listen to ${currentSong.title} on GABY MUSIC!`,
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log("Share canceled"); }
        } else {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            showToast("Link copied to clipboard! 📋");
        }
    });
}

// 11. Shuffle & Repeat
if (btnShuffle) {
    btnShuffle.addEventListener("click", () => {
        isShuffle = !isShuffle;
        btnShuffle.style.color = isShuffle ? "#8a2be2" : "white";
        showToast(isShuffle ? "Shuffle ON 🔀" : "Shuffle OFF");
    });
}

if (btnRepeat) {
    btnRepeat.addEventListener("click", () => {
        repeatMode = (repeatMode + 1) % 3;
        const modes = ["Repeat OFF", "Repeat All 🔁", "Repeat One 🔂"];
        btnRepeat.textContent = repeatMode === 0 ? "🔁" : (repeatMode === 1 ? "🔁" : "🔂");
        btnRepeat.style.color = repeatMode > 0 ? "#8a2be2" : "white";
        showToast(modes[repeatMode]);
    });
}

// 12. Queue Panel
if (btnQueue && queuePanel && closeQueue) {
    btnQueue.addEventListener("click", () => queuePanel.classList.add("open"));
    closeQueue.addEventListener("click", () => queuePanel.classList.remove("open"));
}

// 13. Lyrics Modal
if (closeLyrics && lyricsModal) {
    closeLyrics.addEventListener("click", () => lyricsModal.style.display = "none");
}

// 18. Keyboard Shortcuts
document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    
    if (e.code === "Space") {
        e.preventDefault();
        playPauseButton.click();
    } else if (e.key.toLowerCase() === "m" && currentAudio) {
        currentAudio.muted = !currentAudio.muted;
        showToast(currentAudio.muted ? "Muted 🔇" : "Unmuted 🔊");
    } else if (e.key.toLowerCase() === "l") {
        if (btnLike) btnLike.click();
    } else if (e.key.toLowerCase() === "q") {
        if (queuePanel) queuePanel.classList.toggle("open");
    } else if (e.key === "Escape") {
        if (queuePanel) queuePanel.classList.remove("open");
        if (lyricsModal) lyricsModal.style.display = "none";
        if (shortcutsModal) shortcutsModal.style.display = "none";
    }
});

// 19. Cookie Consent
if (cookieBanner && acceptCookiesBtn) {
    if (localStorage.getItem("gaby_cookies_accepted") === "true") {
        cookieBanner.style.display = "none";
    }
    acceptCookiesBtn.addEventListener("click", () => {
        cookieBanner.style.display = "none";
        localStorage.setItem("gaby_cookies_accepted", "true");
    });
}

// Newsletter & Contact Forms
if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Subscribed successfully! 📬");
        newsletterForm.reset();
    });
}

if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Message sent! We will reply soon. 📞");
        contactForm.reset();
    });
}

// Mood Pills Filter
if (moodPills.length > 0) {
    moodPills.forEach(pill => {
        pill.addEventListener("click", () => {
            moodPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            
            const mood = pill.dataset.mood;
            if (mood === "all") {
                categoryFilter.value = "All";
                filterSongs();
            } else {
                showToast(`Filtered by mood: ${mood} (Feature expanding...)`);
            }
        });
    });
}


/* =========================================
   18. START WEBSITE
   ========================================= */
async function startWebsite() {
    try {
        await seedDefaultSongs();
        await loadAllMusic();
        filterSongs();
        displayRecentSongs();
        displayTrendingSongs();
        console.log("GABY MUSIC loaded successfully:", allSongs.length, "songs");
    } catch (error) {
        console.error("Website loading error:", error);
        if (musicList) musicList.textContent = "Could not load music. Please refresh the page.";
    }
}


/* =========================================
   19. CLEAN UP OBJECT URLS
   ========================================= */
window.addEventListener("beforeunload", () => {
    activeUrls.forEach(url => URL.revokeObjectURL(url));
});


/* =========================================
   20. MUSIC VISUALIZER
   ========================================= */
document.addEventListener("play", event => {
    if (event.target.tagName === "AUDIO" && visualizer) visualizer.classList.add("playing");
}, true);

document.addEventListener("pause", event => {
    if (event.target.tagName === "AUDIO" && visualizer) visualizer.classList.remove("playing");
}, true);

document.addEventListener("ended", event => {
    if (event.target.tagName === "AUDIO" && visualizer) visualizer.classList.remove("playing");
}, true);


// START
startWebsite();

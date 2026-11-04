
"use strict";

/* =========================================
   GABY MUSIC - MAIN JAVASCRIPT
   ========================================= */

// GITHUB REPOSITORY
const GITHUB_API =
    "https://api.github.com/repos/gabyofficial57/GabyMusic/contents";

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
const categories = [
    "Rwandan Music",
    "Gospel",
    "Hip Hop",
    "Afrobeat",
    "Amapiano",
    "Pop",
    "Electronic",
    "Jazz",
    "Rock"
];

// HTML ELEMENTS
const musicList = document.getElementById("music-list");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const categoryFilter = document.getElementById("category-filter");

const addSongForm = document.getElementById("add-song-form");
const songTitle = document.getElementById("song-title");
const songCategory = document.getElementById("song-category");
const songAudio = document.getElementById("song-audio");
const songImage = document.getElementById("song-image");

const recentSongsContainer =
    document.getElementById("recent-songs");

const trendingContainer =
    document.getElementById("trending-songs");

const nowPlayingTitle =
    document.getElementById("now-playing-title");

const nowPlayingImage =
    document.getElementById("now-playing-image");

const playPauseButton =
    document.getElementById("play-pause-button");

const songProgress =
    document.getElementById("song-progress");

const currentTimeDisplay =
    document.getElementById("current-time");

const totalTimeDisplay =
    document.getElementById("total-time");

const visualizer =
    document.getElementById("music-visualizer");

// GLOBAL VARIABLES
let savedSongs = [];
let githubSongs = [];
let allSongs = [];

let activeUrls = [];
let currentAudio = null;
let currentSong = null;


/* =========================================
   1. INDEXEDDB DATABASE
   ========================================= */

function openDatabase() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open("GabyMusicDB", 2);

        request.onupgradeneeded = event => {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("songs")) {
                db.createObjectStore("songs", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings");
            }
        };

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);
    });
}


// LOAD SAVED SONGS
async function loadSavedSongs() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "songs",
            "readonly"
        );

        const request =
            transaction.objectStore("songs").getAll();

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
}


// ADD DEFAULT SONGS ONLY ONCE
async function seedDefaultSongs() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            ["songs", "settings"],
            "readwrite"
        );

        const settings =
            transaction.objectStore("settings");

        const songs =
            transaction.objectStore("songs");

        const check = settings.get("defaultsAdded");

        check.onsuccess = () => {

            if (check.result === true) return;

            defaultSongs.forEach(song => {
                songs.add(song);
            });

            settings.put(true, "defaultsAdded");
        };

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}


// SAVE SONG
async function saveSong(song) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction("songs", "readwrite");

        transaction.objectStore("songs").add(song);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}


// UPDATE SONG
async function updateSong(song) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction("songs", "readwrite");

        transaction.objectStore("songs").put(song);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}


// DELETE SONG
async function deleteSong(id) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction("songs", "readwrite");

        transaction.objectStore("songs").delete(id);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}


/* =========================================
   2. LOAD MUSIC FROM GITHUB
   ========================================= */

// DETECT CATEGORY FROM FILE NAME
function detectCategory(filename) {

    const name = filename.toLowerCase();

    const found = categories.find(category =>
        name.startsWith(category.toLowerCase() + " -") ||
        name.startsWith("[" + category.toLowerCase() + "]")
    );

    return found || "GitHub Music";
}


// LOAD MUSIC FOLDER
async function loadGitHubSongs() {

    const response = await fetch(
        `${GITHUB_API}/music?ref=main`
    );

    if (!response.ok) {
        throw new Error(
            "Could not access GitHub music folder. Check repository visibility."
        );
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
        throw new Error("Invalid GitHub music folder.");
    }

    return files

        .filter(file =>
            file.type === "file" &&
            /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)
        )

        .map(file => ({

            id: "github:" + file.name,

            title: file.name.replace(/\.[^.]+$/, ""),

            file: file.download_url,

            image: "images/cover1.jpg",

            category: detectCategory(file.name),

            source: "github"

        }));
}


// LOAD COVER IMAGES FROM GITHUB
async function loadGitHubImages() {

    try {

        const response = await fetch(
            `${GITHUB_API}/images?ref=main`
        );

        if (!response.ok) return [];

        const files = await response.json();

        return files.filter(file =>
            file.type === "file" &&
            /\.(jpg|jpeg|png|webp)$/i.test(file.name)
        );

    } catch (error) {

        console.error("Image loading error:", error);

        return [];
    }
}


// SELECT COVER IMAGE
function getGitHubCover(song, images) {

    if (images.length === 0) {
        return "images/cover1.jpg";
    }

    const songName = song.title.toLowerCase();

    const matchingImage = images.find(image =>
        image.name.toLowerCase().includes(songName)
    );

    return matchingImage
        ? matchingImage.download_url
        : images[0].download_url;
}


/* =========================================
   3. COMBINE MUSIC LIBRARIES
   ========================================= */

async function loadAllMusic() {

    savedSongs = await loadSavedSongs();

    try {

        githubSongs = await loadGitHubSongs();

        const images = await loadGitHubImages();

        githubSongs.forEach(song => {
            song.image = getGitHubCover(song, images);
        });

    } catch (error) {

        console.error("GitHub music error:", error);

        githubSongs = [];
    }

    // REMOVE DUPLICATE TITLES
    const localTitles = new Set(
        savedSongs.map(song =>
            song.title.toLowerCase().trim()
        )
    );

    const uniqueGitHubSongs = githubSongs.filter(song =>
        !localTitles.has(song.title.toLowerCase().trim())
    );

    allSongs = [
        ...savedSongs.map(song => ({
            ...song,
            source: "local"
        })),

        ...uniqueGitHubSongs
    ];
}


/* =========================================
   4. AUDIO AND IMAGE URLS
   ========================================= */

function getSongUrl(song, type) {

    const blob =
        type === "audio"
            ? song.audioBlob
            : song.imageBlob;

    const file =
        type === "audio"
            ? song.file
            : song.image;

    if (!blob) return file;

    if (!song._urls) {
        song._urls = {};
    }

    if (!song._urls[type]) {

        song._urls[type] =
            URL.createObjectURL(blob);

        activeUrls.push(song._urls[type]);
    }

    return song._urls[type];
}


/* =========================================
   5. FORMAT TIME
   ========================================= */

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds =
        Math.floor(seconds % 60);

    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


/* =========================================
   6. NOW PLAYING PLAYER
   ========================================= */

function updateNowPlaying(song, audio) {

    currentSong = song;

    currentAudio = audio;

    nowPlayingTitle.textContent = song.title;

    nowPlayingImage.src =
        getSongUrl(song, "image");

    playPauseButton.textContent =
        audio.paused ? "▶" : "Ⅱ";

    totalTimeDisplay.textContent =
        formatTime(audio.duration);

    currentTimeDisplay.textContent =
        formatTime(audio.currentTime);
}


/* =========================================
   7. PLAY MUSIC
   ========================================= */

function playSong(song) {

    const audio = new Audio(
        getSongUrl(song, "audio")
    );

    audio.preload = "metadata";

    if (currentAudio) {
        currentAudio.pause();
    }

    currentAudio = audio;

    currentSong = song;

    updateNowPlaying(song, audio);

    audio.addEventListener("play", () => {

        playPauseButton.textContent = "Ⅱ";

        if (visualizer) {
            visualizer.classList.add("playing");
        }
    });

    audio.addEventListener("pause", () => {

        playPauseButton.textContent = "▶";

        if (visualizer) {
            visualizer.classList.remove("playing");
        }
    });

    audio.addEventListener("timeupdate", () => {

        currentTimeDisplay.textContent =
            formatTime(audio.currentTime);

        if (Number.isFinite(audio.duration)) {

            songProgress.value =
                (audio.currentTime / audio.duration) * 100;
        }
    });

    audio.addEventListener("loadedmetadata", () => {

        totalTimeDisplay.textContent =
            formatTime(audio.duration);
    });

    audio.addEventListener("ended", () => {

        playPauseButton.textContent = "▶";

        songProgress.value = 0;

        if (visualizer) {
            visualizer.classList.remove("playing");
        }
    });

    audio.addEventListener("error", () => {

        console.error("Audio could not be played:", song.title);

    });

    audio.play().catch(error => {

        console.error("Playback error:", error);

        alert("Could not play this song. Please try again.");
    });
}


/* =========================================
   8. CREATE SONG CARD
   ========================================= */

function createSongCard(song) {

    const card = document.createElement("div");

    card.className = "song";

    // COVER
    const image = document.createElement("img");

    image.src = getSongUrl(song, "image");

    image.alt = song.title;

    image.className = "cover";

    image.onerror = () => {
        image.src = "images/cover1.jpg";
    };

    // TITLE
    const title = document.createElement("h3");

    title.textContent = song.title;

    // CATEGORY
    const category = document.createElement("p");

    category.textContent = song.category;

    // PLAY BUTTON
    const playButton = document.createElement("button");

    playButton.type = "button";

    playButton.textContent = "▶ Play";

    playButton.addEventListener("click", () => {

        playSong(song);
    });

    // DOWNLOAD
    const download = document.createElement("a");

    download.href = getSongUrl(song, "audio");

    download.download = `${song.title}.mp3`;

    download.textContent = "Download Song";

    // AUDIO PLAYER
    const audio = document.createElement("audio");

    audio.controls = true;

    audio.preload = "metadata";

    audio.src = getSongUrl(song, "audio");

    audio.addEventListener("play", () => {

        if (currentAudio && currentAudio !== audio) {
            currentAudio.pause();
        }

        document.querySelectorAll("#music-list audio")
            .forEach(player => {

                if (player !== audio) {
                    player.pause();
                }
            });

        currentSong = song;

        currentAudio = audio;

        updateNowPlaying(song, audio);
    });

    audio.addEventListener("timeupdate", () => {

        if (currentAudio !== audio) return;

        currentTimeDisplay.textContent =
            formatTime(audio.currentTime);

        if (Number.isFinite(audio.duration)) {

            songProgress.value =
                (audio.currentTime / audio.duration) * 100;
        }
    });

    audio.addEventListener("ended", () => {

        if (currentAudio === audio) {

            playPauseButton.textContent = "▶";

            songProgress.value = 0;
        }
    });

    // ACTIONS
    const actions = document.createElement("div");

    actions.className = "song-actions";

    actions.append(playButton, download);

    // EDIT AND DELETE ONLY LOCAL SONGS
    if (song.source !== "github" && song.id !== undefined) {

        const editButton = document.createElement("button");

        editButton.type = "button";

        editButton.className = "edit-song";

        editButton.textContent = "Edit Song";

        editButton.addEventListener("click", () => {
            editLocalSong(song);
        });

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className = "delete-song";

        deleteButton.textContent = "Delete Song";

        deleteButton.addEventListener("click", () => {
            removeLocalSong(song);
        });

        actions.append(editButton, deleteButton);
    }

    card.append(
        image,
        title,
        category,
        audio,
        actions
    );

    return card;
}


/* =========================================
   9. DISPLAY ALL SONGS
   ========================================= */

function displaySongs(songArray) {

    musicList.innerHTML = "";

    if (songArray.length === 0) {

        musicList.textContent = "No songs found.";

        return;
    }

    songArray.forEach(song => {

        musicList.appendChild(
            createSongCard(song)
        );
    });
}


/* =========================================
   10. RECENTLY ADDED SONGS
   ========================================= */

function displayRecentSongs() {

    if (!recentSongsContainer) return;

    recentSongsContainer.innerHTML = "";

    const recentSongs = [...allSongs]
        .slice(-5)
        .reverse();

    if (recentSongs.length === 0) {

        recentSongsContainer.textContent =
            "No recent songs yet.";

        return;
    }

    recentSongs.forEach(song => {

        const item = document.createElement("div");

        item.className = "recent-song";

        const title = document.createElement("p");

        title.textContent = song.title;

        const category = document.createElement("small");

        category.textContent = song.category;

        const playButton = document.createElement("button");

        playButton.textContent = "▶ Play";

        playButton.type = "button";

        playButton.addEventListener("click", () => {

            playSong(song);
        });

        item.append(
            title,
            category,
            playButton
        );

        recentSongsContainer.appendChild(item);
    });
}


/* =========================================
   11. TRENDING / FEATURED MUSIC
   ========================================= */

function displayTrendingSongs() {

    if (!trendingContainer) return;

    trendingContainer.innerHTML = "";

    // SHOW UP TO SIX FEATURED SONGS
    const featuredSongs = allSongs.slice(0, 6);

    if (featuredSongs.length === 0) {

        trendingContainer.textContent =
            "No featured music available.";

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

    const searchText =
        searchInput.value.toLowerCase().trim();

    const selectedCategory =
        categoryFilter.value;

    const filteredSongs = allSongs.filter(song => {

        const matchesSearch =
            song.title.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" ||
            song.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    displaySongs(filteredSongs);
}


/* =========================================
   13. ADD NEW SONG
   ========================================= */

addSongForm.addEventListener("submit", async event => {

    event.preventDefault();

    const audioFile = songAudio.files[0];

    const imageFile = songImage.files[0];

    if (!audioFile || !imageFile) {

        alert("Choose an MP3 and an image.");

        return;
    }

    if (
        !audioFile.type.startsWith("audio/") ||
        !imageFile.type.startsWith("image/")
    ) {

        alert("Choose valid audio and image files.");

        return;
    }

    const newSong = {

        title: songTitle.value.trim(),

        category: songCategory.value,

        audioBlob: audioFile,

        imageBlob: imageFile
    };

    if (!newSong.title) {

        alert("Enter a song title.");

        return;
    }

    try {

        await saveSong(newSong);

        await loadAllMusic();

        addSongForm.reset();

        searchInput.value = "";

        categoryFilter.value = "All";

        filterSongs();

        displayRecentSongs();

        displayTrendingSongs();

        alert("Song added successfully!");

    } catch (error) {

        console.error(error);

        alert("Could not save song.");
    }
});


/* =========================================
   14. EDIT LOCAL SONG
   ========================================= */

async function editLocalSong(song) {

    const newTitle = prompt(
        "New song title:",
        song.title
    );

    if (newTitle === null || !newTitle.trim()) {
        return;
    }

    const newCategory = prompt(
        "Choose category: " + categories.join(", "),
        song.category
    );

    if (newCategory === null) return;

    if (!categories.includes(newCategory.trim())) {

        alert("Invalid category.");

        return;
    }

    try {

        song.title = newTitle.trim();

        song.category = newCategory.trim();

        await updateSong(song);

        await loadAllMusic();

        filterSongs();

        displayRecentSongs();

        displayTrendingSongs();

        alert("Song updated successfully!");

    } catch (error) {

        console.error(error);

        alert("Could not update song.");
    }
}


/* =========================================
   15. DELETE LOCAL SONG
   ========================================= */

async function removeLocalSong(song) {

    if (!confirm(`Delete "${song.title}"?`)) {
        return;
    }

    try {

        await deleteSong(song.id);

        if (
            currentSong &&
            currentSong.id === song.id
        ) {

            if (currentAudio) {
                currentAudio.pause();
            }

            currentAudio = null;

            currentSong = null;

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

        alert("Song deleted successfully!");

    } catch (error) {

        console.error(error);

        alert("Could not delete song.");
    }
}


/* =========================================
   16. MAIN PLAYER CONTROLS
   ========================================= */

playPauseButton.addEventListener("click", () => {

    if (!currentAudio) {

        alert("First play a song from your music collection.");

        return;
    }

    if (currentAudio.paused) {

        currentAudio.play().catch(error => {
            console.error("Playback error:", error);
        });

    } else {

        currentAudio.pause();
    }
});


// SEEK THROUGH SONG
songProgress.addEventListener("input", () => {

    if (
        !currentAudio ||
        !Number.isFinite(currentAudio.duration)
    ) {
        return;
    }

    currentAudio.currentTime =
        (songProgress.value / 100) *
        currentAudio.duration;
});


/* =========================================
   17. SEARCH EVENTS
   ========================================= */

searchButton.addEventListener("click", filterSongs);

searchInput.addEventListener("input", filterSongs);

categoryFilter.addEventListener("change", filterSongs);


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

        console.log(
            "GABY MUSIC loaded successfully:",
            allSongs.length,
            "songs"
        );

    } catch (error) {

        console.error("Website loading error:", error);

        musicList.textContent =
            "Could not load music. Please refresh the page.";
    }
}


/* =========================================
   19. CLEAN UP OBJECT URLS
   ========================================= */

window.addEventListener("beforeunload", () => {

    activeUrls.forEach(url => {

        URL.revokeObjectURL(url);
    });
});


/* =========================================
   20. MUSIC VISUALIZER
   ========================================= */

document.addEventListener("play", event => {

    if (
        event.target.tagName === "AUDIO" &&
        visualizer
    ) {

        visualizer.classList.add("playing");
    }

}, true);


document.addEventListener("pause", event => {

    if (
        event.target.tagName === "AUDIO" &&
        visualizer
    ) {

        visualizer.classList.remove("playing");
    }

}, true);


document.addEventListener("ended", event => {

    if (
        event.target.tagName === "AUDIO" &&
        visualizer
    ) {

        visualizer.classList.remove("playing");
    }

}, true);


// START
startWebsite();

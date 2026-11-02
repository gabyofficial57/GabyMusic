
const defaultSongs = [
    {
        title: "Diez Dola - ONIVA Ft The Ben",
        file: "music/Diez Dola - ONIVA Ft The Ben (Official Music Video) [aHmE4QmI5zA].mp3",
        image: "images/cover1.jpg",
        category: "Rwandan Music"
    },
    {
        title: "Element Eleéeh - MY DEAR",
        file: "music/Element Eleéeh - MY DEAR (Lyric Video) [g0dNcA7c188].mp3",
        image: "images/cover2.jpg",
        category: "Afrobeat"
    }
];

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

const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingImage = document.getElementById("now-playing-image");
const playPauseButton = document.getElementById("play-pause-button");
const songProgress = document.getElementById("song-progress");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");

let savedSongs = [];
let activeUrls = [];
let currentAudio = null;
let currentSong = null;

const categories = [
    "Rwandan Music",
    "Gospel",
    "Hip Hop",
    "Afrobeat"
];

// CREATE DATABASE
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

// LOAD SONGS
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

// ADD ORIGINAL SONGS ONLY ONCE
async function seedDefaultSongs() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            ["songs", "settings"],
            "readwrite"
        );

        const settings = transaction.objectStore("settings");
        const songs = transaction.objectStore("songs");

        const check = settings.get("defaultsAdded");

        check.onsuccess = () => {
            if (check.result === true) return;

            defaultSongs.forEach(song => songs.add(song));
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
        const transaction = db.transaction("songs", "readwrite");
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
        const transaction = db.transaction("songs", "readwrite");
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
        const transaction = db.transaction("songs", "readwrite");
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

// GET AUDIO AND IMAGE URLS
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

// FORMAT TIME
function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

// UPDATE NOW PLAYING BAR
function updateNowPlaying(song, audio) {
    currentSong = song;
    currentAudio = audio;

    nowPlayingTitle.textContent = song.title;
    nowPlayingImage.src = getSongUrl(song, "image");

    playPauseButton.textContent = audio.paused ? "▶" : "Ⅱ";
    totalTimeDisplay.textContent = formatTime(audio.duration);
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
}

// DISPLAY ALL SONGS
function displaySongs(songArray) {
    musicList.innerHTML = "";

    if (songArray.length === 0) {
        musicList.innerHTML = "<p>No songs found.</p>";
        return;
    }

    songArray.forEach(song => {
        const imageUrl = getSongUrl(song, "image");
        const audioUrl = getSongUrl(song, "audio");

        const card = document.createElement("div");
        card.className = "song";

        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = song.title;
        image.className = "cover";

        const title = document.createElement("h3");
        title.textContent = song.title;

        const category = document.createElement("p");
        category.textContent = song.category;

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = audioUrl;

        // CONNECT AUDIO TO NOW PLAYING BAR
        audio.addEventListener("play", () => {
            document.querySelectorAll("#music-list audio").forEach(player => {
                if (player !== audio) player.pause();
            });

            updateNowPlaying(song, audio);
        });

        audio.addEventListener("pause", () => {
            if (currentAudio === audio) {
                playPauseButton.textContent = "▶";
            }
        });

        audio.addEventListener("timeupdate", () => {
            if (currentAudio !== audio) return;

            currentTimeDisplay.textContent = formatTime(audio.currentTime);

            if (Number.isFinite(audio.duration)) {
                songProgress.value =
                    (audio.currentTime / audio.duration) * 100;
            }
        });

        audio.addEventListener("loadedmetadata", () => {
            if (currentAudio === audio) {
                totalTimeDisplay.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener("ended", () => {
            if (currentAudio === audio) {
                playPauseButton.textContent = "▶";
                songProgress.value = 0;
            }
        });

        const download = document.createElement("a");
        download.href = audioUrl;
        download.download = `${song.title}.mp3`;
        download.textContent = "Download Song";

        const actions = document.createElement("div");
        actions.className = "song-actions";

        const editButton = document.createElement("button");
        editButton.className = "edit-song";
        editButton.dataset.id = song.id;
        editButton.textContent = "Edit Song";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-song";
        deleteButton.dataset.id = song.id;
        deleteButton.textContent = "Delete Song";

        actions.append(editButton, deleteButton);

        card.append(
            image,
            title,
            category,
            audio,
            download,
            actions
        );

        musicList.appendChild(card);
    });
}

// RECENTLY ADDED SONGS
function displayRecentSongs() {
    if (!recentSongsContainer) return;

    recentSongsContainer.innerHTML = "";

    const recentSongs = [...savedSongs]
        .filter(song => song.id !== undefined)
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    if (recentSongs.length === 0) {
        recentSongsContainer.textContent = "No recent songs yet.";
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

        playButton.addEventListener("click", () => {
            const audioPlayers = document.querySelectorAll("#music-list audio");
            const matchingCard = [...audioPlayers].find(player => {
                return player.closest(".song")
                    ?.querySelector("h3")?.textContent === song.title;
            });

            if (matchingCard) {
                matchingCard.play().catch(error => {
                    console.error("Playback error:", error);
                });
            }
        });

        item.append(title, category, playButton);
        recentSongsContainer.appendChild(item);
    });
}

// SEARCH AND CATEGORY FILTER
function filterSongs() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    const filteredSongs = savedSongs.filter(song => {
        const matchesSearch =
            song.title.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" ||
            song.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    displaySongs(filteredSongs);
}

// ADD NEW SONG
addSongForm.addEventListener("submit", async event => {
    event.preventDefault();

    const audioFile = songAudio.files[0];
    const imageFile = songImage.files[0];

    if (!audioFile || !imageFile) {
        alert("Choose an MP3 and an image.");
        return;
    }

    if (!audioFile.type.startsWith("audio/") ||
        !imageFile.type.startsWith("image/")) {
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

        savedSongs = await loadSavedSongs();

        addSongForm.reset();
        searchInput.value = "";
        categoryFilter.value = "All";

        filterSongs();
        displayRecentSongs();

        alert("Song added successfully!");
    } catch (error) {
        console.error(error);
        alert("Could not save song.");
    }
});

// EDIT AND DELETE SONGS
musicList.addEventListener("click", async event => {
    const editButton = event.target.closest(".edit-song");
    const deleteButton = event.target.closest(".delete-song");

    if (editButton) {
        const id = Number(editButton.dataset.id);
        const song = savedSongs.find(item => item.id === id);

        if (!song) return;

        const newTitle = prompt("New song title:", song.title);

        if (newTitle === null || !newTitle.trim()) return;

        const newCategory = prompt(
            "Category: Rwandan Music, Gospel, Hip Hop, Afrobeat",
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

            savedSongs = await loadSavedSongs();

            filterSongs();
            displayRecentSongs();

            alert("Song updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Could not update song.");
        }
    }

    if (deleteButton) {
        const id = Number(deleteButton.dataset.id);
        const song = savedSongs.find(item => item.id === id);

        if (!song) return;

        if (!confirm(`Delete "${song.title}"?`)) return;

        try {
            await deleteSong(id);

            if (currentSong && currentSong.id === id) {
                if (currentAudio) currentAudio.pause();

                currentAudio = null;
                currentSong = null;

                nowPlayingTitle.textContent = "No song playing";
                nowPlayingImage.src = "images/cover1.jpg";
                playPauseButton.textContent = "▶";
                songProgress.value = 0;
                currentTimeDisplay.textContent = "0:00";
                totalTimeDisplay.textContent = "0:00";
            }

            savedSongs = await loadSavedSongs();

            filterSongs();
            displayRecentSongs();

            alert("Song deleted successfully!");
        } catch (error) {
            console.error(error);
            alert("Could not delete song.");
        }
    }
});

// NOW PLAYING PLAY/PAUSE BUTTON
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

// SEEK / MOVE THROUGH SONG
songProgress.addEventListener("input", () => {
    if (!currentAudio || !Number.isFinite(currentAudio.duration)) return;

    currentAudio.currentTime =
        (songProgress.value / 100) * currentAudio.duration;
});

// SEARCH EVENTS
searchButton.addEventListener("click", filterSongs);
searchInput.addEventListener("input", filterSongs);
categoryFilter.addEventListener("change", filterSongs);

// START WEBSITE
async function startWebsite() {
    try {
        await seedDefaultSongs();

        savedSongs = await loadSavedSongs();

        filterSongs();
        displayRecentSongs();
    } catch (error) {
        console.error(error);
        alert("Could not open music database.");
    }
}

// CLEAN UP OBJECT URLS WHEN LEAVING
window.addEventListener("beforeunload", () => {
    activeUrls.forEach(url => URL.revokeObjectURL(url));
});

startWebsite();

// MUSIC VISUALIZER
const visualizer = document.getElementById("music-visualizer");

document.addEventListener("play", function(event) {
    if (event.target.tagName === "AUDIO" && visualizer) {
        visualizer.classList.add("playing");
    }
}, true);

document.addEventListener("pause", function(event) {
    if (event.target.tagName === "AUDIO" && visualizer) {
        visualizer.classList.remove("playing");
    }
}, true);

document.addEventListener("ended", function(event) {
    if (event.target.tagName === "AUDIO" && visualizer) {
        visualizer.classList.remove("playing");
    }
}, true);
// TEST MUSIC VISUALIZER
const visualizerTest = document.getElementById("music-visualizer");

if (visualizerTest) {
    visualizerTest.classList.add("playing");
}
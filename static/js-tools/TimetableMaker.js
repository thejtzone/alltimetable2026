const DIV_ID = "timetable";
const ASPECT_RATIO = 3 / 5;

function createTimetable() {
    const div = document.querySelector(`div#${DIV_ID}`);
    if (!div) return;

    div.innerHTML = "";

    const width = Math.min(div.clientWidth, window.innerWidth);
    const height = div.clientHeight;
    const heightWidthRatio = height / width;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    if (heightWidthRatio < ASPECT_RATIO) {
        div.style.height = `${(width * ASPECT_RATIO) / screenWidth * 100}dvw`;
        div.style.width = `${width / screenWidth * 100}dvw`;
    }
    else {
        div.style.width = `${(height / ASPECT_RATIO) / screenHeight * 100}dvh`;
        div.style.height = `${height / screenHeight * 100}dvh`;
    }

    div.style.display = "grid";
    div.style.gridTemplateColumns = `min-content repeat(7, 1fr)`;
    div.style.gridTemplateRows = `min-content repeat(${24 * 60}, 1fr)`;

    const blanks = []
    for (let i = 0; i < 7; i++) {
        let blank = document.createElement("div");
        blank.style.gridArea = `2 / ${i + 2} / ${24 * 60} / ${i + 2}`;
        blanks.push(blank);
        div.appendChild(blank);
    }

    const times = [];
    for (let i = 0; i < 24 * 60; i++) {
        if (i % 30 != 0) continue;

        let time = document.createElement("div");
        time.style.gridArea = `${i + 1} / 2 / ${i + 1} / 2`;
        times.push(time);
        
        time.textContent = `${pad(Math.floor(i / 60), 2)}:${pad(i % 60, 2)}`;

        div.appendChild(time);
    }

    const headers = [];
    for (let i = 0; i < 8; i++) {
        let header = document.createElement("div");
        header.style.gridArea = `1 / ${i + 1} / 2 / ${i + 1}`;
        header.style.fontWeight = "bold";
        headers.push(header);

        header.textContent = ["Time", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i];
        div.appendChild(header);
    }
}

function pad(number, digits) {return String(number).padStart(digits, "0");}

document.addEventListener("DOMContentLoaded", createTimetable)
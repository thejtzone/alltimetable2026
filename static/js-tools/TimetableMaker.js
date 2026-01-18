const DIV_ID = "timetable";
const ASPECT_RATIO = 3 / 5;

function createTimetable() {
    const div = document.querySelector(`div#${DIV_ID}`);
    if (!div) return;

    div.innerHTML = "";

    const width = div.clientWidth;
    const height = div.clientHeight;
    const heightWidthRatio = height / width;
    if (heightWidthRatio < ASPECT_RATIO) {
        div.style.height = `${width * ASPECT_RATIO}px`;
        div.style.width = `${width}px`;
    }
    else {
        div.style.width = `${height / ASPECT_RATIO}px`;
        div.style.height = `${height}px`;
    }

    div.style.display = "grid";
    div.style.gridTemplateColumns = `min-content repeat(7, 1fr)`;
    div.style.gridTemplateRows = `repeat(${24 * 60}, 1fr)`;

    const blanks = []
    for (let i = 0; i < 7; i++) {
        let blank = document.createElement("div");
        blank.style.gridArea = `1 / ${i + 2} / ${24 * 60 - 1} / ${i + 2}`;
        blanks.push(blank);
        div.appendChild(blank);
    }

    const times = [];
    for (let i = 0; i < 24 * 60; i++) {
        if (i % 30 != 0) continue;

        let time = document.createElement("div");
        time.style.gridArea = `${i + 1} / 1 / ${i + 1} / 1`;
        times.push(time);
        
        time.textContent = `${pad(Math.floor(i / 60), 2)}:${pad(i % 60, 2)}`;

        div.appendChild(time);
    }
}

function pad(number, digits) {return String(number).padStart(digits, "0");}

document.addEventListener("DOMContentLoaded", createTimetable)
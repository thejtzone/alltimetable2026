const DIV_ID = "timetable";
const ASPECT_RATIO = 4 / 3;

function createTimetable() {
    const div = document.querySelector(`div#${DIV_ID}`);
    if (!div) return;

    div.innerHTML = "";

    const width = div.clientWidth;
    const height = div.clientHeight;
    const heightWidthRatio = height / width;
    if (heightWidthRatio < ASPECT_RATIO) 
        div.style.height = `${width * ASPECT_RATIO}px`;
    else div.style.width = `${height / ASPECT_RATIO}px`;

    const table = document.createElement("table");
    div.appendChild(table);

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    

    // Table needs to be: 7 cols x 24 * 60 rows (1440)
    let headers = [];
    let rows = [];

    for (let i = 0; i < 7; i++) {
        const row = document.createElement("tr");
        tbody.appendChild(row);
        
        const th = document.createElement("th");
        th.textContent = "Day " + (i + 1);
        headers.push(th);
        row.appendChild(th);
    }

    for (let i = 0; i < 24 * 60; i++) {
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        rows.push(tr);

        const td = document.createElement("td");
        td.textContent = i;
        tr.appendChild(td);
    }
}

document.addEventListener("DOMContentLoaded", createTimetable)
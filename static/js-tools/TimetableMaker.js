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

    const header_row = document.createElement("tr");
    tbody.appendChild(header_row);

    for (let i = 0; i < 7; i++) {        
        const th = document.createElement("th");
        th.textContent = "Day " + (i + 1);
        headers.push(th);
        header_row.appendChild(th);
    }

    for (let i = 0; i < 24 * 60; i++) {
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        rows.push(tr);

        for (let j = 0; j < 7; j++) {
            const td = document.createElement("td");
            tr.appendChild(td);
            td.textContent = i + j * 1440;
        }
    }
}

document.addEventListener("DOMContentLoaded", createTimetable)
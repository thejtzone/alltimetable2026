const MODAL_ID = "modal";
let modalOpenState = true;

function ensureStyles() {
    const styles = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100dvw",
        height: "100dvh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        opacity: modalOpenState ? 1 : 0,
        pointerEvents: "none"
    }

    let el = document.getElementById(MODAL_ID)
    Object.assign(el.style, styles);

    el.addEventListener("click", (e) => {
        if (e.target === el) closeAnim();
    });

    return styles
}

function openAnim() {
    let el = document.getElementById(MODAL_ID)
    // el.style.transitionDuration = "1s";
    el.style.transition = "opacity 1s";
    el.style.pointerEvents = "auto";
    setTimeout(() => el.style.opacity = 1, 1);
    modalOpenState = true;
}

function closeAnim() {
    let el = document.getElementById(MODAL_ID)
    // el.style.transitionDuration = "1s";
    el.style.transition = "opacity 1s";
    setTimeout(() => el.style.opacity = 0, 1);
    setTimeout(() => el.style.pointerEvents = "none", 1000);
    modalOpenState = false;
}




function openPage(url, dvw, dvh) {
    let el = document.getElementById(MODAL_ID)
    if (el.children.length == 1 && 
        el.children[0].tagName == "IFRAME" &&
        el.children[0].src == url) return;

    let newFrame = document.createElement("iframe");
    newFrame.src = url;
    el.innerHTML = "";
    el.appendChild(newFrame);

    const frameStyles = {
        border: "none",
        width: `${dvw}dvw`,
        height: `${dvh}dvh`,
        position: "absolute",
        top: "50%",
        left: "50%",
        translate: "-50% -50%",
        zIndex: 101,
        borderRadius: "1dvh",
        backgroundColor: "rgb(30, 30, 30)",
    }
    Object.assign(newFrame.style, frameStyles);

    ensureStyles();
    openAnim();
}

function openHTML(html) {
    let el = document.getElementById(MODAL_ID)
    el.innerHTML = html;

    ensureStyles();
    openAnim();
}
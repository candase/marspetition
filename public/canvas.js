(function () {
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1;

    let sign = document.getElementById("sign");
    let counter = 0;
    let clearButton = document.getElementById("clearSign");

    let draw = false;

    let mouseX = 0,
        mouseY = 0,
        lastX = 0,
        lastY = 0;

    let drawCanvas = () => {
        if (draw) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
            lastX = mouseX;
            lastY = mouseY;
        }
    };

    document.addEventListener("mouseup", (e) => {
        draw = false;
    });

    canvas.addEventListener("mousedown", (event) => {
        draw = true;
        counter++;
        lastX = event.clientX - canvas.offsetLeft;
        lastY = event.clientY - canvas.offsetTop;
    });

    canvas.addEventListener("mousemove", (event) => {
        mouseX = event.clientX - canvas.offsetLeft;
        mouseY = event.clientY - canvas.offsetTop;
        // if (draw) {
        //     ctx.beginPath();
        //     ctx.moveTo(lastX, lastY);
        //     ctx.lineTo(mouseX, mouseY);
        //     ctx.stroke();
        //     lastX = mouseX;
        //     lastY = mouseY;
        // }
        drawCanvas();
    });

    canvas.addEventListener("mouseleave", () => {
        if (counter > 0) {
            sign.value = canvas.toDataURL();
        }
    });

    clearButton.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
})();

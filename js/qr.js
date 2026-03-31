function showQR(){

    const modal = document.getElementById("qrModal");
    const qrContainer = document.getElementById("qrcode");

    modal.style.display = "flex";

    // clear previous QR
    qrContainer.innerHTML = "";

    // 🔥 IMPORTANT: change this after GitHub deploy
    const url = window.location.origin + window.location.pathname;

    new QRCode(qrContainer, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#000",
        colorLight: "#fff"
    });
}

function closeQR(){
    document.getElementById("qrModal").style.display = "none";
}
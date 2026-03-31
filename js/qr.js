let qrGenerated = false;

function showQR(){
    document.getElementById("qrModal").style.display = "flex";

    if(!qrGenerated){
        new QRCode(document.getElementById("qrcode"), {
            text: window.location.href,
            width: 200,
            height: 200
        });
        qrGenerated = true;
    }
}

function closeQR(){
    document.getElementById("qrModal").style.display = "none";
}
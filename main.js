const inputListe = $("input#listeCsv")
const alertImport = $("div#infoImport")
const form = $("form#params")

let partsNames = []

function errorImport(cause) {
    partsNames = []
    alertImport.html(cause)
    alertImport.removeClass("alert-success")
    alertImport.addClass("alert-danger")
    alertImport.css("visibility", "visible")
    inputListe.val("")
}

inputListe.change(event => {
    let file = event.target.files[0]
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            const txt = evt.target.result;
            partsNames = txt.replace(",", "").split("\n")
            if (partsNames.length >= 400) {
                errorImport("Pour des raisons de performances, le nombre de participants est limité à 400 (" + partsNames.length + " fournis).")
            } else {
                alertImport.html("<b>" + partsNames.length + "</b> participant(s) importé(s)")
                alertImport.addClass("alert-success")
                alertImport.removeClass("alert-danger")
                alertImport.css("visibility", "visible")
            }

        }
        reader.onerror = function (evt) {
            errorImport("Fichier invalide")
        }
    }
    else {
        partsNames = []
        alertImport.css("visibility", "hidden")
    }

})


form.on("submit", event => {
    if (form[0].checkValidity() === false) {
        event.preventDefault()
        event.stopPropagation()
    } else {
        console.log("ok");
    }
    form.addClass("was-validated")
})
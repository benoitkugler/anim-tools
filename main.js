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
            partsNames = $.trim(txt.replace(",", "")).split("\n")
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
        const nbEquipes = $("input#nbEquipes").val()
        const tailleEquipe = $("input#tailleEquipe").val()
        const nbParts = partsNames.length
        if (tailleEquipe > nbParts) {
            $("#errorNombreParts").css("visibility", "visible")
            $("#spinner").css("visibility", "hidden")
        } else {
            $("#errorNombreParts").css("visibility", "hidden")
            $("#spinner").css("visibility", "visible")
            setTimeout(() => {
                let [rep, newVar] = genereEquipes(nbParts, nbEquipes, tailleEquipe)
                showResult(rep, newVar)
                $("#spinner").css("visibility", "hidden")
            }, 100)

        }
    }
    form.addClass("was-validated")
})


// Renvoi un entier entre 0 et nMax - 1 
function randInt(nMax) {
    return Math.floor(Math.random() * nMax);
}

function randChoice(choices) {
    return choices[randInt(choices.length)]
}

function randomEquipe(nbParts, taille) {
    currentChoices = [...Array(nbParts).keys()]
    equipe = Array(taille)
    for (var i = 0; i < taille; i++) {
        part = randChoice(currentChoices)
        equipe[i] = part
        currentChoices = currentChoices.filter(r => r != part)
    }
    return equipe
}

function isEqual(equipe1, equipe2) {
    const e1 = new Set(equipe1)
    const e2 = new Set(equipe2)
    if (e1.size !== e2.size) return false;
    for (var a of e1) if (!e2.has(a)) return false;
    return true;
}

function isEquipeInRepartition(equipe, repartition) {
    for (var eq of repartition) {
        if (isEqual(eq, equipe)) {
            return true
        }
    }
    return false
}

function variance(repartition, nbParts) {
    let occ = Array(nbParts).fill(0)
    for (var eq of repartition) {
        for (var part of eq) {
            occ[part] += 1
        }
    }
    let mean = 0
    for (var oc of occ) {
        mean += oc
    }
    mean /= nbParts
    let v = 0
    for (oc of occ) {
        v += (oc - mean) ** 2
    }
    return Math.sqrt(v / nbParts)
}

function genereEquipes(nbParts, nbEquipes, taille) {
    let eq, repartition = []
    for (var i = 0; i < nbEquipes; i++) {   // repartition initiale
        eq = randomEquipe(nbParts, taille)
        while (isEquipeInRepartition(eq, repartition)) {
            eq = randomEquipe(nbParts, taille)
        }
        repartition.push(eq)
    }
    const MAXITER = 1000000
    let currentVar = variance(repartition, nbParts)
    let newVar, newRep
    for (i = 0; i < MAXITER; i++) {
        index = randInt(nbEquipes)
        eq = randomEquipe(nbParts, taille)
        while (isEquipeInRepartition(eq, repartition)) {
            eq = randomEquipe(nbParts, taille)
        }
        newRep = JSON.parse(JSON.stringify(repartition))
        newRep[index] = eq
        newVar = variance(newRep, nbParts)
        if (newVar <= currentVar) {
            currentVar = newVar
            repartition = newRep
        }
        if (newVar == 0) {
            return [repartition, newVar]
        }

    }
    return [repartition, newVar]
}



function showResult(repartition, variance) {
    $("div#results").css("visibility", "visible")
    $("div#results #variance").html(variance)
    let html = ""
    for (var eq of repartition) {
        html += "<div class='col-2'>" + eq.map(r => partsNames[r]).join(", ") + "</div>"
    }
    $("div#results .row").html(html)
}
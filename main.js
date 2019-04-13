const inputListe = $("input#listeCsv");
const alertImport = $("div#infoImport");
const form = $("form#params");

let partsNames = [];

function errorImport(cause) {
    partsNames = [];
    alertImport.html(cause);
    alertImport.removeClass("alert-success");
    alertImport.addClass("alert-danger");
    alertImport.css("visibility", "visible");
    inputListe.val("");
}

inputListe.change(event => {
    let file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function(evt) {
            const txt = evt.target.result;
            partsNames = $.trim(txt.replace(",", "")).split("\n");
            if (partsNames.length >= 400) {
                errorImport(
                    "Pour des raisons de performances, le nombre de participants est limité à 400 (" +
                        partsNames.length +
                        " fournis)."
                );
            } else {
                alertImport.html(
                    "<b>" + partsNames.length + "</b> participant(s) importé(s)"
                );
                alertImport.addClass("alert-success");
                alertImport.removeClass("alert-danger");
                alertImport.css("visibility", "visible");
            }
        };
        reader.onerror = function(evt) {
            errorImport("Fichier invalide");
        };
    } else {
        partsNames = [];
        alertImport.css("visibility", "hidden");
    }
});

form.on("submit", event => {
    event.preventDefault();
    event.stopPropagation();
    if (form[0].checkValidity() !== false) {
        const nbEquipes = $("input#nbEquipes").val();
        const tailleEquipe = $("input#tailleEquipe").val();
        const nbParts = partsNames.length;
        if (tailleEquipe > nbParts) {
            $("#errorNombreParts").css("visibility", "visible");
            $("#spinner").css("visibility", "hidden");
        } else {
            $("#errorNombreParts").css("visibility", "hidden");
            $("#spinner").css("visibility", "visible");
            const [nbEqPoss, nbPoss] = nbChoix(
                nbParts,
                nbEquipes,
                tailleEquipe
            );
            $("#nbChoix span#eq").html(nbEqPoss.toPrecision(4));
            $("#nbChoix span#rep").html(nbPoss.toPrecision(4));
            $("#nbChoix ").css("visibility", "visible");
            setTimeout(() => {
                let [rep, newVar] = genereEquipes(
                    nbParts,
                    nbEquipes,
                    tailleEquipe
                );
                showResult(rep, newVar, nbParts);
                $("#spinner").css("visibility", "hidden");
            }, 100);
        }
    }

    form.addClass("was-validated");
});

// Renvoi un entier entre 0 et nMax - 1
function randInt(nMax) {
    return Math.floor(Math.random() * nMax);
}

function randChoice(choices) {
    return choices[randInt(choices.length)];
}

function randomEquipe(nbParts, taille) {
    currentChoices = [...Array(nbParts).keys()];
    equipe = Array(taille);
    for (var i = 0; i < taille; i++) {
        part = randChoice(currentChoices);
        equipe[i] = part;
        currentChoices = currentChoices.filter(r => r != part);
    }
    return equipe;
}

function isEqual(equipe1, equipe2) {
    const e1 = new Set(equipe1);
    const e2 = new Set(equipe2);
    if (e1.size !== e2.size) return false;
    for (var a of e1) if (!e2.has(a)) return false;
    return true;
}

function isEquipeInRepartition(equipe, repartition) {
    for (var eq of repartition) {
        if (isEqual(eq, equipe)) {
            return true;
        }
    }
    return false;
}

function occurences(repartition, nbParts) {
    let occ = Array(nbParts).fill(0);
    for (var eq of repartition) {
        for (var part of eq) {
            occ[part] += 1;
        }
    }
    return occ;
}

function variance(repartition, nbParts) {
    const occ = occurences(repartition, nbParts);
    let mean = 0;
    for (var oc of occ) {
        mean += oc;
    }
    mean /= nbParts;
    let v = 0;
    for (oc of occ) {
        v += (oc - mean) ** 2;
    }
    return Math.sqrt(v / nbParts);
}

function nbChoix(nbParts, nbEquipes, taille) {
    var nbEquipesPossibles = 1;
    for (var i = 1; i <= taille; i++) {
        nbEquipesPossibles *= (nbParts + 1 - i) / i;
    }
    var out = 1;
    for (i = 1; i <= nbEquipes; i++) {
        out *= (nbEquipesPossibles + 1 - i) / i;
    }
    return [nbEquipesPossibles, out];
}

function genereEquipes(nbParts, nbEquipes, taille) {
    let eq,
        repartition = [];
    for (var i = 0; i < nbEquipes; i++) {
        // repartition initiale
        eq = randomEquipe(nbParts, taille);
        while (isEquipeInRepartition(eq, repartition)) {
            eq = randomEquipe(nbParts, taille);
        }
        repartition.push(eq);
    }
    const MAXITER = 100000;
    let currentVar = variance(repartition, nbParts);
    let newVar, newRep;
    for (i = 0; i < MAXITER; i++) {
        index = randInt(nbEquipes);
        eq = randomEquipe(nbParts, taille);
        while (isEquipeInRepartition(eq, repartition)) {
            eq = randomEquipe(nbParts, taille);
        }
        newRep = JSON.parse(JSON.stringify(repartition));
        newRep[index] = eq;
        newVar = variance(newRep, nbParts);
        if (newVar <= currentVar) {
            currentVar = newVar;
            repartition = newRep;
        }
        if (newVar == 0) {
            return [repartition, currentVar];
        }
    }
    return [repartition, currentVar];
}

function showResult(repartition, variance, nbParts) {
    $("div#results").css("visibility", "visible");
    $("div#results #variance").html(variance.toPrecision(4));
    const occ = occurences(repartition, nbParts);
    var freqs = {};
    for (var o of occ) {
        freqs[o] = (freqs[o] || 0) + 1;
    }
    console.log(freqs);
    $("div#results #occurences").html(
        Object.keys(freqs)
            .map(
                r =>
                    "<b>" +
                    freqs[r] +
                    "</b> participant(s) avec <b>" +
                    r +
                    "</b> participation(s)"
            )
            .join("<br/>")
    );
    let html = "";
    for (var eq of repartition) {
        html +=
            "<div class='col-2' style='border : 2px solid gray;'>" +
            eq.map(r => partsNames[r]).join("<br/> ") +
            "</div>";
    }
    $("div#results .row").html(html);
}

import {FlipBattleFormApplication, FlipFormApplication} from "./flipForm.js";

const BUTTON_HTML = `<div class="control-icon" data-action="flip"><i class="fas fa-repeat"></i><div class="flip-tokens"></div></div>`;

async function updateToken(hud, idx, path, scale, portrait) {
    updateTokenDocument(hud.object.document, idx, path, scale, portrait);
}

async function updateTokenDocument(tokenDocument, idx, path, scale, portrait) {
    if (!scale) {
        scale = 1;
    }
    await tokenDocument.update({
        "texture.src": path,
        "texture.scaleX": scale,
        "texture.scaleY": scale
    }, {
        animation: {
            transition: "morph",
            duration: 500
        }
    });
    await tokenDocument.actor.update({
        "flags.pf2e-flip-token.tokens.idx": idx,
    })
    if (portrait) {
        await tokenDocument.actor.update({
            img: portrait
        })
    }
}

Hooks.on("renderTokenConfig", async (app, html) => {
    if (!app.document?.actor) {
        return;
    }
    let $html = $(html)
    let tbutton = $('<button type="submit" class="flip-config"><i class="far fa-repeat"></i>Flip Config</button>');
    let battleButton = $('<button type="submit" class="flip-config-battle"><i class="far fa-repeat"></i>Flip Battle Config</button>');
    tbutton.click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        new FlipFormApplication(app.document).render(true);
    });
    battleButton.click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        new FlipBattleFormApplication(app.document).render(true);
    });
    $html.find(".tab[data-tab='identity']").prepend(battleButton);
    $html.find(".tab[data-tab='identity']").prepend(tbutton);
});

Hooks.on("renderTokenHUD", (hud, _hudHtml, hudData) => {
    let hudHtml = $(_hudHtml)

    let tbutton = $(BUTTON_HTML);
    tbutton.find(".fa-repeat").contextmenu(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        $(event.currentTarget).parent().find('.flip-tokens').addClass("active");
    });
    tbutton.find(".fa-repeat").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        let values = hud.object.document.actor?.getFlag('pf2e-flip-token', 'tokens')?.values;
        if (values) {
            let idx = hud.object.document.actor?.getFlag('pf2e-flip-token', 'tokens')?.idx;
            if ((idx + 1) < values.length) {
                await updateToken(hud, (idx + 1), values[idx + 1].path, values[idx + 1]?.scale ?? 1, values[idx + 1].portrait)
            } else {
                await updateToken(hud, 0, values[0].path, values[0]?.scale ?? 1, values[0].portrait)
            }
        }
    });

    let values = hud.object.document.actor?.getFlag('pf2e-flip-token', 'tokens')?.values ?? [];
    values.forEach(function (value, i) {
        const picture = document.createElement("picture");
        picture.classList.add("flip-token");
        picture.dataset.idx = i;
        picture.setAttribute("src", value.path);

        const icon = document.createElement("img");
        icon.src = value.path;
        picture.append(icon);
        $(picture).find('img').click(async (event) => {
            await updateToken(hud, i, value.path, value?.scale ?? 1, value?.portrait)
        });

        tbutton.find(".flip-tokens").append(picture);
    });

    hudHtml.find(".col.right").append(tbutton);
});

function updateBattleToken(tokenDocument, path, scale, portrait) {
    if (!scale) {
        scale = 1;
    }
    tokenDocument.update({
        "texture.src": path,
        "texture.scaleX": scale,
        "texture.scaleY": scale
    }, {
        animation: {
            transition: "morph",
            duration: 500
        }
    });

    if (portrait) {
        tokenDocument.actor.update({
            img: portrait
        })
    }
}

Hooks.on("combatStart", async (combat) => {
    combat.turns.forEach(c => {
        let battle = c.actor.getFlag('pf2e-flip-token', 'battle');
        if (battle) {
            let {path, scale, portrait} = battle?.inCombat;
            updateBattleToken(c.token, path, scale, portrait);
        }
    })
});

Hooks.on("deleteCombat", async (combat) => {
    combat.turns.forEach(c => {
        let battle = c.actor.getFlag('pf2e-flip-token', 'battle');
        if (battle) {
            let {path, scale, portrait} = battle?.atRest;
            updateBattleToken(c.token, path, scale, portrait);
        }
    })
});
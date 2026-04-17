import {FlipBattleFormApplication, FlipFormApplication} from "./flipForm.js";

function getActorDocument(tokenOrActorDocument) {
    return tokenOrActorDocument instanceof Actor ? tokenOrActorDocument : tokenOrActorDocument?.actor;
}

function getDefaultAnimation() {
    return {
        animation: {
            transition: "morph",
            duration: 500
        }
    };
}

async function applyTokenAppearance(tokenDocument, path, scale = 1, portrait, name) {
    if (!tokenDocument) {
        return;
    }

    if (tokenDocument?.ring?.enabled) {
        await tokenDocument.update({
            "ring.subject": {
                scale,
                texture: path
            },
        }, getDefaultAnimation());
    } else {
        await tokenDocument.update({
            "texture.src": path,
            "texture.scaleX": scale,
            "texture.scaleY": scale
        }, getDefaultAnimation());
    }

    if (portrait) {
        await tokenDocument.actor?.update({img: portrait});
    }

    if (name) {
        await tokenDocument.update({name});
    }
}

async function updateTokenDocument(tokenDocument, idx, path, scale, portrait, name) {
    await applyTokenAppearance(tokenDocument, path, scale ?? 1, portrait, name);
    await tokenDocument?.actor?.update({
        "flags.pf2e-flip-token.tokens.idx": idx,
    });
}

function createConfigButton({className, label, onClick}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.innerHTML = `<i class="far fa-repeat"></i>${label}`;
    button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await onClick();
    });
    return button;
}

function renderConfigButtons(app, element) {
    const actorDocument = app.actor ?? app.document?.actor;
    const identityTab = element.querySelector(".tab[data-tab='identity']");
    if (!actorDocument || !identityTab) {
        return;
    }

    identityTab.querySelector(".flip-config")?.remove();
    identityTab.querySelector(".flip-config-battle")?.remove();

    const flipButton = createConfigButton({
        className: "flip-config",
        label: "Flip Config",
        onClick: () => new FlipFormApplication(actorDocument).render(true)
    });
    const battleButton = createConfigButton({
        className: "flip-config-battle",
        label: "Flip Battle Config",
        onClick: () => new FlipBattleFormApplication(actorDocument).render(true)
    });

    identityTab.prepend(battleButton);
    identityTab.prepend(flipButton);
}

function getTokenFlagValues(actorDocument) {
    return actorDocument?.getFlag('pf2e-flip-token', 'tokens')?.values ?? [];
}

function getCurrentTokenIndex(actorDocument) {
    return actorDocument?.getFlag('pf2e-flip-token', 'tokens')?.idx ?? 0;
}

function createFlipTokenEntry(hud, value, index) {
    const picture = document.createElement("picture");
    picture.classList.add("flip-token");
    picture.dataset.idx = String(index);

    const icon = document.createElement("img");
    icon.src = value.path;
    icon.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await updateTokenDocument(hud.object.document, index, value.path, value?.scale ?? 1, value?.portrait, value?.name);
    });

    picture.append(icon);
    return picture;
}

function createHudButton(hud) {
    const button = document.createElement("div");
    button.classList.add("control-icon");
    button.dataset.action = "flip";

    const icon = document.createElement("i");
    icon.className = "fas fa-repeat";

    const tokenList = document.createElement("div");
    tokenList.classList.add("flip-tokens");

    icon.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        tokenList.classList.add("active");
    });

    icon.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const actorDocument = hud.object.document.actor;
        const values = getTokenFlagValues(actorDocument);
        if (!values.length) {
            return;
        }

        const currentIdx = getCurrentTokenIndex(actorDocument);
        const nextIdx = currentIdx + 1 < values.length ? currentIdx + 1 : 0;
        const next = values[nextIdx];
        await updateTokenDocument(hud.object.document, nextIdx, next.path, next?.scale ?? 1, next?.portrait, next?.name);
    });

    const actorDocument = hud.object.document.actor;
    for (const [index, value] of getTokenFlagValues(actorDocument).entries()) {
        tokenList.append(createFlipTokenEntry(hud, value, index));
    }

    button.append(icon, tokenList);
    return button;
}

Hooks.on("renderPrototypeTokenConfig", async (app, element) => {
    renderConfigButtons(app, element);
});

Hooks.on("renderTokenConfig", async (app, element) => {
    renderConfigButtons(app, element);
});

Hooks.on("renderTokenHUD", (hud, element) => {
    const controlsColumn = element.querySelector(".col.right");
    if (!controlsColumn || !hud.object?.document?.actor) {
        return;
    }

    controlsColumn.querySelector("[data-action='flip']")?.remove();
    controlsColumn.append(createHudButton(hud));
});

Hooks.on("combatStart", async (combat) => {
    for (const combatant of combat.turns) {
        const actorDocument = getActorDocument(combatant.actor);
        const battle = actorDocument?.getFlag('pf2e-flip-token', 'battle');
        if (!battle?.inCombat || !combatant.token) {
            continue;
        }

        const {path, scale, portrait, name} = battle.inCombat;
        await applyTokenAppearance(combatant.token, path, scale ?? 1, portrait, name);
    }
});

Hooks.on("deleteCombat", async (combat) => {
    for (const combatant of combat.turns) {
        const actorDocument = getActorDocument(combatant.actor);
        const battle = actorDocument?.getFlag('pf2e-flip-token', 'battle');
        if (!battle?.atRest || !combatant.token) {
            continue;
        }

        const {path, scale, portrait, name} = battle.atRest;
        await applyTokenAppearance(combatant.token, path, scale ?? 1, portrait, name);
    }
});

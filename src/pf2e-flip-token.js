import FlipFormApplication from "./flipForm.js";

const BUTTON_HTML = `<div class="control-icon" data-action="flip"><i class="fas fa-repeat"></i><div class="flip-tokens"></div></div>`;

async function updateToken(hud, idx, path, scale) {
    if (!scale) {scale = 1;}
    await hud.object.document.update({
        "flags.flip-token.tokens.idx": idx,
        "texture.src": path,
        "texture.scaleX": scale,
        "texture.scaleY": scale
    }, {
        animation: {
            transition: "morph",
            duration: 500
        }
    });
}

Hooks.on("renderTokenConfig", async (app, $html) => {
    let tbutton = $('<button type="submit" class="flip-config"><i class="far fa-repeat"></i>Flip Config</button>');
    tbutton.click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        new FlipFormApplication(app).render(true);
    });
    $html.find(".tab[data-tab='character']").prepend(tbutton);
});

Hooks.on("renderTokenHUD", (hud, hudHtml, hudData) => {
    let tbutton = $(BUTTON_HTML);
    tbutton.find(".fa-repeat").contextmenu(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        $(event.currentTarget).parent().find('.flip-tokens').addClass("active");
    });
    tbutton.find(".fa-repeat").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        let values = hud.object.document.flags?.['flip-token']?.['tokens']?.['values'];
        if (values) {
            let idx = hud.object.document.flags?.['flip-token']?.['tokens']?.['idx'];
            if ((idx +1) < values.length) {
                await updateToken(hud, (idx +1), values[idx + 1].path, values[idx + 1]?.scale ?? 1)
            } else {
                await updateToken(hud, 0, values[0].path, values[0]?.scale ?? 1)
            }
        }
    });

    let values = hud.object.document.flags?.['flip-token']?.['tokens']?.['values'] ?? [];
    values.forEach(function (value, i) {
        const picture = document.createElement("picture");
        picture.classList.add("flip-token");
        picture.dataset.idx = i;
        picture.setAttribute("src", value.path);

        const icon = document.createElement("img");
        icon.src = value.path;
        picture.append(icon);
        $(picture).find('img').click(async (event) => {
            await updateToken(hud, i, value.path, value?.scale ?? 1)
        });

        tbutton.find(".flip-tokens").append(picture);
    });

    hudHtml.find(".col.right").append(tbutton);
});
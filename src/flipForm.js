const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

class FlipFormApplication extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['form'],
        id: 'flip-form-application',
        position: {
            width: 400,
            height: 300
        },
        window: {
            title: "Flip Config"
        }
    };

    static PARTS = {
        form: {
            template: `modules/pf2e-flip-token/templates/menu.hbs`
        }
    };

    constructor(tokenDocument, options = {}) {
        super(options);

        this.actorDocument = tokenDocument instanceof Actor ? tokenDocument : tokenDocument?.actor;
        this.paths = this.actorDocument.getFlag('pf2e-flip-token', 'tokens')?.values ?? [this.getDefaultPath()];
    }

    getDefaultPath() {
        return {
            path: this.actorDocument.prototypeToken.texture.src,
            portrait: this.actorDocument.img,
            name: this.actorDocument.prototypeToken.name,
            scale: 1
        };
    }

    getPathObjs() {
        return this.paths.map((ce, index) => {
            return {
                idx: index,
                target: `flipIcon-${index}`,
                targetP: `flipPortrait-${index}`,
                path: ce.path,
                portrait: ce.portrait,
                name: ce.name,
                scale: ce.scale ?? 1
            };
        });
    }

    async _prepareContext() {
        return {values: this.getPathObjs()};
    }

    async close(options) {
        await this.actorDocument.setFlag('pf2e-flip-token', 'tokens', {
            values: this.paths,
            idx: 0,
        });

        return super.close(options);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element.querySelector('.flip-save')?.addEventListener('click', async (event) => {
            event.preventDefault();
            await this._updateObject('addRow', {path: '', portrait: '', scale: 1, name: ''});
        });

        for (const button of this.element.querySelectorAll('.flip-delete')) {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                const idx = Number(event.currentTarget.dataset.idx);
                await this._updateObject('deleteRow', null, idx);
            });
        }

        for (const input of this.element.querySelectorAll('file-picker.image')) {
            input.addEventListener('change', async (event) => {
                await this._updateObject('updatePath', event.currentTarget.value, Number(event.currentTarget.dataset.idx));
            });
        }

        for (const input of this.element.querySelectorAll('file-picker.portrait')) {
            input.addEventListener('change', async (event) => {
                await this._updateObject('updatePortrait', event.currentTarget.value, Number(event.currentTarget.dataset.idx));
            });
        }

        for (const input of this.element.querySelectorAll('input.scale-value')) {
            input.addEventListener('input', (event) => {
                const value = event.currentTarget.value;
                event.currentTarget.closest('.form-fields')?.querySelector('.range-value')?.replaceChildren(value);
            });

            input.addEventListener('change', async (event) => {
                await this._updateObject('updateScale', event.currentTarget.value, Number(event.currentTarget.dataset.idx));
            });
        }

        for (const input of this.element.querySelectorAll('input.name')) {
            input.addEventListener('change', async (event) => {
                await this._updateObject('updateName', event.currentTarget.value, Number(event.currentTarget.dataset.idx));
            });
        }
    }

    async _updateObject(event, val, idx) {
        if (event === 'addRow') {
            this.paths.push(val);
            return this.render(true);
        } else if (event === 'deleteRow') {
            this.paths.splice(idx, 1);
            if (this.paths.length === 0) {
                this.paths.push(this.getDefaultPath());
            }
            this.render(true);
        } else if (event === 'updatePath') {
            this.paths[idx].path = val;
        } else if (event === 'updatePortrait') {
            this.paths[idx].portrait = val;
        } else if (event === 'updateScale') {
            this.paths[idx].scale = Number.parseFloat(val) || 1;
        } else if (event === 'updateName') {
            this.paths[idx].name = val;
        }
    }
}

class FlipBattleFormApplication extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['form'],
        id: 'flip-battle-form-application',
        position: {
            width: 400,
            height: 540
        },
        window: {
            title: "Flip Battle Config",
            resizable: true
        }
    };

    static PARTS = {
        form: {
            root: true,
            template: `modules/pf2e-flip-token/templates/battle.hbs`
        }
    };

    constructor(tokenDocument, options = {}) {
        super(options);

        this.actorDocument = tokenDocument instanceof Actor ? tokenDocument : tokenDocument?.actor;

        const battle = this.actorDocument.getFlag('pf2e-flip-token', 'battle');
        this.inCombat = battle?.inCombat || this._getDefaultState();
        this.atRest = battle?.atRest || this._getDefaultState();
    }

    _getDefaultState() {
        return {
            path: this.actorDocument.prototypeToken.texture.src,
            portrait: this.actorDocument.img,
            name: this.actorDocument.prototypeToken.name,
            scale: 1
        };
    }

    async _prepareContext() {
        return {
            inCombat: this.inCombat,
            atRest: this.atRest,
        };
    }

    async close(options) {
        await this.actorDocument.setFlag('pf2e-flip-token', 'battle', {
            inCombat: this.inCombat,
            atRest: this.atRest,
        });

        return super.close(options);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        for (const input of this.element.querySelectorAll('file-picker.image')) {
            input.addEventListener('change', async (event) => {
                await this._updateObject('path', event.currentTarget.value, event.currentTarget.dataset.type);
            });
        }

        for (const input of this.element.querySelectorAll('file-picker.portrait')) {
            input.addEventListener('change', async (event) => {
                await this._updateObject('portrait', event.currentTarget.value, event.currentTarget.dataset.type);
            });
        }

        for (const input of this.element.querySelectorAll('input.scale-value')) {
            input.addEventListener('input', (event) => {
                const value = event.currentTarget.value;
                event.currentTarget.closest('.form-fields')?.querySelector('.range-value')?.replaceChildren(value);
            });

            input.addEventListener('change', async (event) => {
                await this._updateObject('scale', event.currentTarget.value, event.currentTarget.dataset.type);
            });
        }

        for (const input of this.element.querySelectorAll('input.name')) {
            input.addEventListener('change', async (event) => {
                await this._updateObject('name', event.currentTarget.value, event.currentTarget.dataset.type);
            });
        }
    }

    async _updateObject(event, val, idx) {
        if (event === 'scale') {
            this[idx][event] = Number.parseFloat(val) || 1;

        } else {
            this[idx][event] = val;
        }
    }
}

export {
    FlipFormApplication,
    FlipBattleFormApplication,
}

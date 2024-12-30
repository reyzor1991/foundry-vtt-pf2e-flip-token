export default class FlipFormApplication extends FormApplication {
    constructor(tokenDocument) {
        super();
        this.tokenDocument = tokenDocument;
        this.paths = this.tokenDocument.actor.getFlag('pf2e-flip-token', 'tokens')?.values
            ?? [{
                "path": this.tokenDocument.texture.src,
                "portrait": this.tokenDocument.actor.img,
                'scale': 1
            }];
        this.values = this.getPathObjs();
    }

    getPathObjs() {
        return this.paths.map((ce, index) => {
            return {
                'idx': index,
                'target': 'flipIcon-' + index,
                'targetP': 'flipPortrait-' + index,
                'path': ce.path,
                'portrait': ce.portrait,
                'scale': ce.scale ?? 1
            };
        });
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `modules/pf2e-flip-token/templates/menu.hbs`,
            id: 'flip-form-application',
            width: '400',
            height: '300',
            title: "Flip Config",
        });
    }

    getData() {
        return {values: this.values};
    }

    close() {
        super.close();
        this.tokenDocument.actor.setFlag('pf2e-flip-token', 'tokens', {
            "values": this.paths,
            "idx": 0,
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.flip-save').click(async (event) => {
            await this._updateObject('addRow', {path: '', 'scale': 1});
        });
        html.find('.flip-delete').click(async (event) => {
            await this._updateObject('deleteRow', null, $(event.currentTarget).data().idx);
        });
        html.find('input.image').change(async (event) => {
            await this._updateObject('updatePath', event.target.value, $(event.currentTarget).data().idx);
        });
        html.find('input.portrait').change(async (event) => {
            await this._updateObject('updatePortrait', event.target.value, $(event.currentTarget).data().idx);
        });
        html.find('input.scale-value').change(async (event) => {
            await this._updateObject('updateScale', event.target.value, $(event.currentTarget).data().idx);
        });
    }

    async _updateObject(event, val, idx) {
        if (event === 'addRow') {
            this.paths.push(val)
            this.values = this.getPathObjs();
            super.render()
        } else if (event === 'deleteRow') {
            this.paths.splice(idx, 1);
            this.values = this.getPathObjs();
            super.render()
        } else if (event === 'updatePath') {
            this.paths[idx].path = val;
            this.values = this.getPathObjs();
        } else if (event === 'updatePortrait') {
            this.paths[idx].portrait = val;
            this.values = this.getPathObjs();
        } else if (event === 'updateScale') {
            this.paths[idx].scale = parseFloat(val);
            this.values = this.getPathObjs();
        }
    }
}


export default class FlipFormApplication extends FormApplication {
  constructor(obj) {
    super();
    this.object = obj;
    this.paths = this.object.object.flags?.['flip-token']?.['tokens']?.['values']
        ?? [{"path":this.object.token.texture.src, 'scale': 1}];
    this.values = this.getPathObjs();
  }

  getPathObjs() {
    return this.paths.map((ce, index) => {
      return {
        'idx': index,
        'target': 'flipIcon-' + index,
        'path': ce.path,
        'scale': ce.scale ?? 1
      };
    });
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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
        return { values: this.values };
    }

    close() {
        super.close();
        this.object.object.update({
            "flags.flip-token.tokens.values": this.paths,
            "flags.flip-token.tokens.idx": 0,
        });
    }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.flip-save').click(async (event) => {
        this._updateObject('addRow', {path: '', 'scale': 1});
    });
    html.find('.flip-delete').click(async (event) => {
        this._updateObject('deleteRow', null, $(event.currentTarget).data().idx);
    });
    html.find('input.image').change(async (event) => {
        this._updateObject('updatePath', event.target.value, $(event.currentTarget).data().idx);
    });
    html.find('input.scale-value').change(async (event) => {
        this._updateObject('updateScale', event.target.value, $(event.currentTarget).data().idx);
    });
  }

  async _updateObject(event, val, idx) {
    if (event == 'addRow') {
        this.paths.push(val)
        this.values = this.getPathObjs();
        super.render()
    } else if (event == 'deleteRow') {
        this.paths.splice(idx, 1);
        this.values = this.getPathObjs();
        super.render()
    } else if (event == 'updatePath') {
        this.paths[idx].path = val;
        this.values = this.getPathObjs();
    } else if (event == 'updateScale') {
        this.paths[idx].scale = parseFloat(val);
        this.values = this.getPathObjs();
    }
  }
}


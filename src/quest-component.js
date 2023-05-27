import {entity} from "./entity.js";


export const quest_component = (() => {
  class QuestComponent extends entity.Component {
    constructor(_TITLE, _TEXT) {
      super();
      this._TEXT = _TEXT;
      this._TITLE = _TITLE;
      const e = document.getElementById('quest-ui');
      e.style.visibility = 'hidden';
    }

    InitComponent() {
      this._RegisterHandler('input.picked', (m) => this._OnPicked(m));
    }

    _OnPicked(msg) {
      const quest = {
        title: this._TITLE,
        text: this._TEXT,
      };
      this.FindEntity('ui').GetComponent('UIController').AddQuest(quest);
    }
  };

  return {
      QuestComponent: QuestComponent,
  };
})();
import {entity} from './entity.js';

export const ui_controller = (() => {

  class UIController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._quests = {};
    }
  
    AddQuest(quest) {
      this._quests[quest.id] = quest;
      this._OnQuestSelected(quest.id);
    }

    _OnQuestSelected(id) {
      const quest = this._quests[id];

      const e = document.getElementById('quest-ui');
      e.style.visibility = '';

      const text = document.getElementById('quest-text');
      text.innerText = quest.text;

      const title = document.getElementById('quest-text-title');
      title.innerText = quest.title;
    }

    Update(timeInSeconds) {
    }
  };

  return {
    UIController: UIController,
  };

})();
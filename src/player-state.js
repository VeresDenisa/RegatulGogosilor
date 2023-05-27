export const player_state = (() => {

    class State {
      constructor(parent) {
        this._parent = parent;
      }
    
      Enter() {}
      Exit() {}
      Update() {}
    };
  
    class WalkState extends State {
      constructor(parent) {
        super(parent);
      }
    
      get Name() {
        return 'walk';
      }
    
      Enter(prevState) {
        const curAction = this._parent._proxy._animations['walk'].action;
        if (prevState) {
          const prevAction = this._parent._proxy._animations[prevState.Name].action;
          curAction.enabled = true;
          curAction.time = 0.0;
          curAction.setEffectiveTimeScale(1.0);
          curAction.setEffectiveWeight(1.0);
          curAction.crossFadeFrom(prevAction, 0.1, true);
          curAction.play();
        } else {
          curAction.play();
        }
      }
    
      Exit() {
      }
    
      Update(timeElapsed, input) { 
        if (input._keys.forward)
          return;
    
        this._parent.SetState('idle');
      }
    };
    
    class IdleState extends State {
      constructor(parent) {
        super(parent);
      }
    
      get Name() {
        return 'idle';
      }
    
      Enter(prevState) {
        const idleAction = this._parent._proxy._animations['idle'].action;
        if (prevState) {
          const prevAction = this._parent._proxy._animations[prevState.Name].action;
          idleAction.time = 0.0;
          idleAction.enabled = true;
          idleAction.setEffectiveTimeScale(1.0);
          idleAction.setEffectiveWeight(1.0);
          idleAction.crossFadeFrom(prevAction, 0.25, true);
          idleAction.play();
        } else {
          idleAction.play();
        }
      }
    
      Exit() {
      }
    
      Update(_, input) {
        if (input._keys.forward) {
          this._parent.SetState('walk');
        }
      }
    };
  
    return {
      State: State,
      IdleState: IdleState,
      WalkState: WalkState
    };
  
  })();
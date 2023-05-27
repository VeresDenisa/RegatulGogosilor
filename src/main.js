import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from './third-person-camera.js';
import {entity_manager} from './entity-manager.js';
import {player_entity} from './player-entity.js'
import {entity} from './entity.js';
import {gltf_component} from './gltf-component.js';
import {player_input} from './player-input.js';
import {spatial_hash_grid} from './spatial-hash-grid.js';
import {ui_controller} from './ui-controller.js';
import {quest_component} from './quest-component.js';
import {spatial_grid_controller} from './spatial-grid-controller.js';

class DonutsAdventure {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';

    document.getElementById('container').appendChild(this._threejs.domElement);

    window.onload = function(){
      var instructions = document.getElementById('instructions');
      document.onclick = function(e){
        if(e.target.id !== 'instructions'){
          instructions.style.display = 'none';
        }
      };
    };

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 10000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-10, 500, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1000.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    this._sun = light;

    const plane = new THREE.Mesh(
        new THREE.CircleGeometry(150, 32),
        new THREE.MeshStandardMaterial({
            color: 0xb3e7f4,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    this._entityManager = new entity_manager.EntityManager();
    this._grid = new spatial_hash_grid.SpatialHashGrid(
        [[-1000, -1000], [1000, 1000]], [100, 100]);
   
    const ui = new entity.Entity();
    ui.AddComponent(new ui_controller.UIController());
    this._entityManager.Add(ui, 'ui');

    this._LoadPlayer();
    
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this._scene.add(hemiLight);

    this._scene.background=new THREE.Color(0x63c5da);

    this._LoadStaticModels('castle2', new THREE.Vector3(-30,0,80), 0.01);
    this._LoadStaticModels('party', new THREE.Vector3(-20,0,10), 0.008);
    this._LoadStaticModels('rocks3', new THREE.Vector3(10,0,60), 0.018);
    this._LoadStaticModels('tanks', new THREE.Vector3(-100,0,40), 0.015);
    this._LoadStaticModels('tanks2', new THREE.Vector3(20,0,100), 0.015);
    this._LoadStaticModels('tanks3', new THREE.Vector3(0,0,-80), 0.015);
    this._LoadForest();

    this._previousRAF = null;
    this._RAF();
  }

  _LoadForest() {
    for (let i = 0; i < 50; ++i) {
      const names = [
        'candy_cane_pc1', 'candy_cane_wr1', 'candy_cane_yb1',
        'candy_cane_pc2', 'candy_cane_wr2', 'candy_cane_yb2',
        'candy_cane_pc3', 'candy_cane_wr3', 'candy_cane_yb3',
        'candy_cane_pc4', 'candy_cane_wr4', 'candy_cane_yb4',
        'rocks1', 'rocks4', 'sticks', 'sticks'
      ];

      const scales = [0.016, 0.014, 0.012, 0.01, 0.009, 0.008, 0.007, 0.006, 0.005, 0.004];
      
      const name = names[Math.round(Math.random() * (names.length - 1))];
      const scale = scales[Math.round(Math.random() * (scales.length - 1))];

      let pos;

      if(i < 40) pos = new THREE.Vector3(Math.random() * 100 + 20,0,(Math.random() * 2.0 - 1.0) * 100);
      else pos = new THREE.Vector3(Math.random() * 200 -150,0,(Math.random() * 2.0 - 1.0) * 150);

      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/decor/',
        resourceName: name + '.fbx',
        scale: scale,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true,
      }));
      e.AddComponent(
          new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }

  _LoadStaticModels(name, pos, scale) {
      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/decor/',
        resourceName: name + '.fbx',
        scale: scale,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true,
      }));
      e.AddComponent(
          new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);
      this._entityManager.Add(e);
      e.SetActive(false);
  }

  addPickable(resourcePath, resourceName, scale, position, id, title, text) {
    const object = new entity.Entity();
    object.AddComponent(new gltf_component.AnimatedModelComponent({
        scene: this._scene,
        resourcePath: resourcePath,
        resourceName: resourceName,
        scale: scale,
        receiveShadow: true,
        castShadow: false,
    }));
    object.AddComponent(new spatial_grid_controller.SpatialGridController({
        grid: this._grid,
    }));
    object.AddComponent(new player_input.PickableComponent());
    object.AddComponent(new quest_component.QuestComponent(title,text));
    object.SetPosition(position);
    this._entityManager.Add(object);
  }

  _LoadPlayer() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };

    for (let i = 0; i < 22; ++i) {
      const names = [
          'boston_cream', 'bear_claw', 'chocolate_frosted', 'cinnamon_twist', 'coffee', 'day_old_donuts', 'donut_holes', 'double_chocolate', 
          'eclair', 'french_cruller', 'glazed', 'jelly_filled', 'maple_bar', 'maple_frosted', 'milk', 'mucho_matcha', 'old_fashioned',
          'plain', 'powdered', 'red_velvet', 'sprinkled', 'strawberry_glazed'
      ];

      const texts = [
        'A fost odată ca niciodată un regat îndepărtat.',
        'Magia proteja granițele regatului și niciun străin nu putea intra.',
        'Regatul era condus de un rege și o regină.',
        'Aceștia aveau trei copii năzdrăvani.',
        'Cel mai mare fiu era moștenitorul tronului.',
        'Dar nu putea deveni rege dacă nu își dovedea vrednicia.',
        'Moștenitorul urma să plece într-o aventură.',
        'Familia regală era adorată de toți locuitorii regatului.',
        'Ziua în care a plecat a fost zi de sărbătoare pentru tot regatul.',
        'Petrecerea a durat trei zile și trei nopți.',
        'Oamenii se întrebau prin ce aventuri trece moștenitorul în regatele îndepărtate.',
        'Multe anotimpuri au trecut de la plecarea moștenitorului.',
        'Într-o zi un bărbat foarte familiar a sosit în regat.',
        'El susținea că este moștenitorul de drept al regatului.',
        'Regatul era în extaz. Moștenitorul s-a întors teafăr din călătoria sa.',
        'Regele, mulțumit de rezultatele fiului său, i-a oferit sa ca lider al regatului.',
        'Încoronarea a avut loc trei zile mai târziu.',
        'Cu sceptrul regal în mână și coroana pe cap noul rege s-a adresat regatului său.',
        'În momentul în care a început să vorbească a fost învăluit de un fum gros.',
        'Toată lumea a realizat că nu moștenitorul a fost încoronat, ci un vrăjitor foarte puternic.',
        'Vrăjitorul a blestemat toți locuitorii regatului.',
        'Singura persoană care poate rupe blestemul este moștenitorul.'
      ];
      
      const titles = [
        'Boston Cream', 'Bear Claw', 'Chocolate Frosted', 'Cinnamon Twist', 'Coffee', 'Day-Old Donuts', 'Donut Holes', 'Double Chocolate', 
        'Eclair', 'French Cruller', 'Glazed', 'Jelly Filled', 'Maple Bar', 'Maple Frosted', 'Milk', 'Mucho Matcha', 'Old Fashioned',
        'Plain', 'Powdered', 'Red Velvet', 'Sprinkled', 'Strawberry Glazed'
      ];

      const X = [-50,-30,-110, -30,-140,-100, -90, -20,-100,-110,-40,-90,-140,-70, -60, -10, -10,  0,-60, 10,-90,-70,-120];
      const Y = [-30,-80,   0,-100, -40,  40,-110,-140, -40, -70, 10,110,  10,  0,-110,-130,-50, -30, 40, 10,130,-60,  60];

      this.addPickable('./resources/go_nuts_for_donuts/', (names[i] + '.fbx'), 0.035, new THREE.Vector3(X[i],0,Y[i]), i, titles[i], texts[i]);
    }

    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(params));
    player.AddComponent(new player_entity.BasicCharacterController(params));
    player.AddComponent(
        new spatial_grid_controller.SpatialGridController({grid: this._grid}));
    this._entityManager.Add(player, 'player');

    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player')}));
    this._entityManager.Add(camera, 'player-camera');
  }

  _UpdateSun() {
    const player = this._entityManager.Get('player');
    const pos = player._position;

    this._sun.position.copy(pos);
    this._sun.position.add(new THREE.Vector3(-10, 500, -10));
    this._sun.target.position.copy(pos);
    this._sun.updateMatrixWorld();
    this._sun.target.updateMatrixWorld();
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._UpdateSun();
    this._entityManager.Update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new DonutsAdventure();
});

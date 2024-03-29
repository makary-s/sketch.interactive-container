const g = require('../threeGlobals');
const matLib = require('../materialLib')
const clipLib = require('../clipLib');
const cnf = require('../config');
const mCnf = require('../../assets/model/modelConfig.json');
const TWEEN = require('../lib/Tween');

const loadOBJs = require('../lib/myThree/loadOBJs');
const InfoLabel = require('../components/InfoLabel');

const TopGroup = require('../components/GroupsFromNamesBuilder');

const topGroup = new TopGroup('__'); // #remove!


let onLoadFinish = loadOBJs(cnf.MODEL_NAMES, cnf.MODELS_BASE_PATH);
onLoadFinish(function (loadedObjects) {
  // parse loaded objects
  for (let objName in loadedObjects) {
    let object = loadedObjects[objName];
    for (let child of object.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      withCild(child, objName);
    }
  }
  
  afterLoad();
  addAnimations();
})


function withCild(child, objName) {
  child.receiveShadow = true;
  child.castShadow = true;
  
  child.material = matLib[child.material.name];
  child.material.side = THREE.DoubleSide;
  // child.material.shadowSide = THREE.DoubleSide;

  // g.hoverer.addObject(child);
  
  g.objTagger.set('_modelParts', objName, child)
  g.objTagger.set('group', child.name, child)
  
}

function afterLoad() {
  let modelParts = g.objTagger.get('_modelParts'); // #Bad!
  for (let modelName in modelParts) {
    let group = new THREE.Group();
    group.position.fromArray(mCnf.axis);
    
    group.add(...modelParts[modelName])
    group.updateMatrixWorld();
    group.children.forEach(child => {
      child.worldToLocal(child.position);
    });

    g.objTagger.set('model', modelName, group);
    g.scene.add(group);
  }

  ///

  /* #bad!!! */

  var outerLablePositions = [
    "model__opori",
    "model__vent",
    "model__karkas"
  ]

  g.lablesLib = {
    inner: [],
    outer: []
  }
  
  var objLeft = g.objTagger.get('model', 'containerLeft')[0];
  var objRight = g.objTagger.get('model', 'containerRight')[0];

  let parts = g.objTagger.get('group');
  for (let partName in parts) {
    let lablePosition = mCnf.lablePositions[partName];
    if (!lablePosition) continue;
    
    console.log('lable:', 'lable'+partName);
    let lable = new InfoLabel('lable_'+partName);
    lable.name = partName;
    lable.position.fromArray(lablePosition);

    //

    if (lablePosition[2] <= 0) {
      lable.position.fromArray(objLeft.worldToLocal(lable.position).toArray());
      objLeft.add(lable);
      // objLeft.add(addCube(10, lable.position))
    } else {
      lable.position.fromArray(objRight.worldToLocal(lable.position).toArray());
      objRight.add(lable);
      // objRight.add(addCube(10, lable.position))
    }

    //

    if (outerLablePositions.indexOf(partName) === -1) {
      g.lablesLib.inner.push(lable);
      lable.hide();
    } else {
      g.lablesLib.outer.push(lable);
    }

    ///

    lable.hideList();
    lable.onMouseover(function () {
      lable.hideList(false);
      
      for (let subObj of g.objTagger.get('group', lable.name)) {
        if (g.options.highlightMode == 'outline') {
          g.highlighter.add(subObj);
        } else if (g.options.highlightMode == 'emissive') {
          subObj.oldMaterial = subObj.material;
          let newMat = subObj.material.clone();
          newMat.emissive.setHex(new THREE.Color("#005e00").getHex());
          subObj.material = newMat;
        }

      }

    });
    lable.onMouseout(function () {
      lable.hideList(true);

      if (g.options.highlightMode == 'outline') {
        g.highlighter.clear();
      } else if (g.options.highlightMode == 'emissive') {
        for (let subObj of g.objTagger.get('group', lable.name)) {
          subObj.material = subObj.oldMaterial;
          subObj.oldMaterial = undefined;
        }
      }



    });

    ///

    g.containerDiv.onmousedown = function(event) { // #bad!
      if (event.which == 3) {
        for (let prop in g.lablesLib) {
          for (let lable of g.lablesLib[prop]) {
            if (getComputedStyle(lable.element, null).display === 'none'){
              lable.element.style.display = 'block'; 
            } else {
              lable.element.style.display = 'none'; 
            }
          }
        }
      }
  }

    ///

    g.objTagger.set('lables', partName, lable)

    
    
  }
  console.log('parts:', parts);
  

}


function addAnimations() {

  var objLeft = g.objTagger.get('model', 'containerLeft')[0];
  var objRight = g.objTagger.get('model', 'containerRight')[0];
  
  { /* OPEN */
    var prop = {y:0}
    
    var duration = 500;
    var easing = TWEEN.Easing.Quadratic.Out;

    var maxAng = Math.PI / 5;
    var stepAng = Math.PI / 5;
    
    var openTween = new TWEEN.Tween(prop) 
      .to({ y: '+' + stepAng}, duration)
      .easing(easing)
      .onUpdate(function () {
        if (prop.y > maxAng) prop.y = maxAng;
        objRight.rotation.set(0, prop.y, 0)
        objLeft.rotation.set(0, -prop.y, 0)
        // objLeft.parent.translateX(-10)
        })  
  
    var closeTween = new TWEEN.Tween(prop) 
    .to({ y: '-' + stepAng}, duration)
    .easing(easing)
      .onUpdate(function () {
        if (prop.y < 0) prop.y = 0;
        objRight.rotation.set(0, prop.y, 0)
        objLeft.rotation.set(0, -prop.y, 0)
        // objLeft.parent.translateX(10)
      })
    g.tweenLib.open = openTween;
    g.tweenLib.close = closeTween;

    ///
    var state = 'closed';
    
    var baseMaxAA = g.controls.maxAzimuthAngle;
    var baseMinAA = g.controls.minAzimuthAngle;

    g.containerDiv.addEventListener("wheel", function (e) {
      var delta = e.deltaY || e.detail || e.wheelDelta;
      if (delta > 0) {
        openTween.onComplete(() => {
          state = 'opened'
          g.controls.maxAzimuthAngle =  Math.PI * 0;
          g.controls.minAzimuthAngle = - Math.PI * 1;
          g.controls.autoRotate = false;
          // g.controls.enableZoom = true;

          g.lablesLib.inner.forEach((lable) => lable.hide(false));
          g.lablesLib.outer.forEach((lable) => lable.hide(true));
        }).start();
        closeTween.stop();
        
      } else {
        closeTween.onComplete(() => {
          state = 'closed';
          g.controls.maxAzimuthAngle = Infinity;
          g.controls.minAzimuthAngle = - Infinity;
          g.controls.autoRotate = true;
          // g.controls.enableZoom = false;

          g.lablesLib.inner.forEach((lable) => lable.hide(true));
          g.lablesLib.outer.forEach((lable) => lable.hide(false));
        }).start();
        openTween.stop()
      }
    });
  }  
  

}



function addCube(size, position) {
  var geometry = new THREE.BoxBufferGeometry(size, size, size);
  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff
    // flatShading: true
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
}



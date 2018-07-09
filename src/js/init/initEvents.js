const THREE = require('../lib/myThree/THREE.js');
const Foggle = require('../lib/Foggle.js');

const {
  globals: g,
  options
} = require('../threeGlobals');


{ /* ON TICK */
  g.animate.onTick(function () {
    g.controls.update();
    g.hoverer.updateIntersects();
  })
}

{ /* ON TICK END */
  g.animate.onTick(function () {
    // #bad! 
    if (options.highlightMode == "emissive") g.renderer.render(g.scene, g.camera);
    g.labelRenderer.render(g.scene, g.camera);
    if (options.highlightMode == "outline") g.composer.render();
  });
}

{ /* RESIZE */
  g.containerDiv.addEventListener( "resize", function () {
      g.canvasWidth = g.containerDiv.clientWidth;
      g.canvasHeight = g.containerDiv.clientHeight;
      //
      g.renderer.setSize(g.canvasWidth, g.canvasHeight);
      g.labelRenderer.setSize(g.canvasWidth, g.canvasHeight);
      //
      g.camera.aspect = g.canvasWidth / g.canvasHeight;
      g.camera.updateProjectionMatrix();
    },
    false
  );
}

{ /* MOUSEMOVE */
  // hoverer
  g.containerDiv.addEventListener('mousemove', function (event) {
    g.hoverer.updateMouse(event.clientX, event.clientY, g.containerDiv);
  });
}

{ /* CONTROLS */

  // visibiler
  g.controls.addEventListener('change', function() {
    if (options.hideLabels) g.visibiler.update();
  });
}

{ /* HOVERER */

  {  /* HIGHLIGHT */
    var highlightOn = new Foggle(options, "highlightMode");
    var highlightOff = new Foggle(options, "highlightMode");
    g.hoverer.onMouseOver(highlightOn);
    g.hoverer.onMouseOut(highlightOff);

    // outline
    let highlighter = g.highlighter;
    highlightOn.on("outline", function (obj) {
      highlighter.set(obj);
    });
    highlightOff.on("outline", function () {
      highlighter.clear();
    });

    // emissive
    highlightOn.on("emissive", function (obj) {
      obj.currentHex = obj.material.emissive.getHex();
      obj.material.emissive.setHex(new THREE.Color("#005e00").getHex());
    });
    highlightOff.on("emissive", function (obj) {
      obj.material.emissive.setHex(obj.currentHex);
    });
  }

  { /* LABELS */
    var showLable = new Foggle(options, "hideLabels");
    var hideLable = new Foggle(options, "hideLabels");
    g.hoverer.onMouseOver(showLable);
    g.hoverer.onMouseOut(hideLable);

    // hideLabels - true
    showLable.on(true, function (obj) {
      let lable = obj.userData.infoLable;
      if (!lable) return;
      lable.hide(false);
      lable.select(true);
    });
    hideLable.on(true, function (obj) {
      let lable = obj.userData.infoLable;
      if (!lable) return;
      lable.hide(true);
      lable.select(false);
    });
  
    // hideLabels - false
    showLable.on(false, function (obj) {
      let lable = obj.userData.infoLable;
      if (!lable) return;
      lable.hideList(false)
      lable.select(true);
    });
    hideLable.on(false, function (obj) {
      let lable = obj.userData.infoLable;
      if (!lable) return;
      lable.hideList(true)
      lable.select(false);
    });
  }

}





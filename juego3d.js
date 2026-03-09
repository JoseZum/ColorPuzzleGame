var COLOR_PALETTE=[
    0xff0000,0x00cc00,0x0066ff,0xffcc00,0xff00ff,
    0x00ffff,0xff6600,0x9933ff,0x33ff66,0xff3399
]
var COLOR_CSS=[
    '#ff0000','#00cc00','#0066ff','#ffcc00','#ff00ff',
    '#00ffff','#ff6600','#9933ff','#33ff66','#ff3399'
]

function getColorHex(c){var i=parseInt(c);return COLOR_PALETTE[i%COLOR_PALETTE.length]}
function getCSS(c){var i=parseInt(c);return COLOR_CSS[i%COLOR_CSS.length]}

var scene,camera,renderer,controls
var tubeGroup,liquidMeshes=[],tubeMeshes=[],glowMeshes=[]
var historial,movesCount=0
var selectedTube=-1,lifted=false
var raycaster,mouse
var hoverTube=-1
var particleSystem
var animating=false
var currentView='3d'
var selected2D=-1
var toastTimeout=null

var TUBE_SPACING=2.2
var TUBE_RADIUS=0.42
var TUBE_HEIGHT=CAPACIDAD*0.82+0.5
var LIQUID_RADIUS=TUBE_RADIUS-0.04
var LIQUID_HEIGHT=0.65
var LIQUID_GAP=0.04
var LIQUID_BASE=0.4

function initThree(){
    try{
        scene=new THREE.Scene()
        scene.fog=new THREE.FogExp2(0x0a0a1a,0.025)
        camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,100)
        camera.position.set(0,12,16)
        camera.lookAt(0,1.5,0)
        renderer=new THREE.WebGLRenderer({canvas:document.getElementById('game-canvas'),antialias:true})
        renderer.setSize(window.innerWidth,window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
        renderer.shadowMap.enabled=true
        renderer.shadowMap.type=THREE.PCFSoftShadowMap
        if(THREE.OrbitControls){
            controls=new THREE.OrbitControls(camera,renderer.domElement)
            controls.enableDamping=true
            controls.dampingFactor=0.08
            controls.maxPolarAngle=Math.PI/2.2
            controls.minDistance=8
            controls.maxDistance=30
            controls.target.set(0,1.5,0)
        }
        scene.add(new THREE.AmbientLight(0xffffff,0.6))
        var dir=new THREE.DirectionalLight(0xffffff,0.8)
        dir.position.set(6,14,8)
        dir.castShadow=true
        dir.shadow.mapSize.width=1024
        dir.shadow.mapSize.height=1024
        scene.add(dir)
        var pl1=new THREE.PointLight(0x00d4ff,0.4,30)
        pl1.position.set(-10,6,-5)
        scene.add(pl1)
        var pl2=new THREE.PointLight(0x7b2ff7,0.3,30)
        pl2.position.set(10,6,-5)
        scene.add(pl2)
        var floor=new THREE.Mesh(
            new THREE.PlaneGeometry(60,60),
            new THREE.MeshStandardMaterial({color:0x0e0e20,roughness:0.85,metalness:0.15})
        )
        floor.rotation.x=-Math.PI/2
        floor.receiveShadow=true
        scene.add(floor)
        var grid=new THREE.GridHelper(40,40,0x1a1a35,0x141428)
        grid.position.y=0.01
        scene.add(grid)
        createParticles()
        raycaster=new THREE.Raycaster()
        mouse=new THREE.Vector2()
        window.addEventListener('resize',onResize)
        renderer.domElement.addEventListener('click',onClick)
        renderer.domElement.addEventListener('mousemove',onMouseMove)
        tubeGroup=new THREE.Group()
        scene.add(tubeGroup)
        console.log('Three.js initialized OK')
    }catch(e){
        console.error('Three.js init error:',e)
    }
}

function createParticles(){
    var n=100
    var pos=new Float32Array(n*3)
    var col=new Float32Array(n*3)
    for(var i=0;i<n;i++){
        pos[i*3]=(Math.random()-0.5)*40
        pos[i*3+1]=Math.random()*12
        pos[i*3+2]=(Math.random()-0.5)*40
        var c=new THREE.Color(COLOR_PALETTE[Math.floor(Math.random()*COLOR_PALETTE.length)])
        col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b
    }
    var geo=new THREE.BufferGeometry()
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3))
    geo.setAttribute('color',new THREE.BufferAttribute(col,3))
    particleSystem=new THREE.Points(geo,new THREE.PointsMaterial({size:0.06,vertexColors:true,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending}))
    scene.add(particleSystem)
}

function getTubePosition(index){
    var cols=6
    var row=Math.floor(index/cols)
    var col=index%cols
    var totalCols=Math.min(NUMERO_TUBOS,cols)
    var ox=-(totalCols-1)*TUBE_SPACING/2
    return new THREE.Vector3(ox+col*TUBE_SPACING,0,-row*3.2)
}

function createTubeMesh(index){
    var pos=getTubePosition(index)
    var group=new THREE.Group()
    group.position.copy(pos)
    var wall=new THREE.Mesh(
        new THREE.CylinderGeometry(TUBE_RADIUS,TUBE_RADIUS+0.04,TUBE_HEIGHT,32,1,true),
        new THREE.MeshStandardMaterial({color:0x88aacc,transparent:true,opacity:0.18,roughness:0.1,metalness:0.1,side:THREE.DoubleSide,depthWrite:false})
    )
    wall.renderOrder=10
    wall.position.y=TUBE_HEIGHT/2+0.05
    wall.userData={tubeIndex:index,clickable:true}
    group.add(wall)
    var bottom=new THREE.Mesh(
        new THREE.CylinderGeometry(TUBE_RADIUS+0.04,TUBE_RADIUS+0.04,0.08,32),
        new THREE.MeshStandardMaterial({color:0x445566,roughness:0.4,metalness:0.4})
    )
    bottom.position.y=0.04
    bottom.receiveShadow=true
    bottom.userData={tubeIndex:index,clickable:true}
    group.add(bottom)
    var rim=new THREE.Mesh(
        new THREE.TorusGeometry(TUBE_RADIUS+0.01,0.025,8,32),
        new THREE.MeshStandardMaterial({color:0x99bbdd,roughness:0.2,metalness:0.5})
    )
    rim.rotation.x=Math.PI/2
    rim.position.y=TUBE_HEIGHT+0.05
    group.add(rim)
    var glow=new THREE.Mesh(
        new THREE.CylinderGeometry(TUBE_RADIUS+0.12,TUBE_RADIUS+0.12,TUBE_HEIGHT+0.3,32),
        new THREE.MeshBasicMaterial({color:0x00d4ff,transparent:true,opacity:0,side:THREE.DoubleSide})
    )
    glow.position.y=TUBE_HEIGHT/2+0.05
    group.add(glow)
    glowMeshes[index]=glow
    group.userData={tubeIndex:index,clickable:true}
    return group
}

function getLiquidY(slotIndex){
    return LIQUID_BASE+slotIndex*(LIQUID_HEIGHT+LIQUID_GAP)
}

function createLiquidMesh(colorIndex,tubeIndex,slotIndex){
    var color=new THREE.Color(getColorHex(colorIndex))
    var geo=new THREE.CylinderGeometry(LIQUID_RADIUS,LIQUID_RADIUS,LIQUID_HEIGHT,32)
    var mat=new THREE.MeshStandardMaterial({
        color:color,
        roughness:0.3,
        metalness:0.1,
        emissive:color.clone().multiplyScalar(0.25)
    })
    var mesh=new THREE.Mesh(geo,mat)
    mesh.castShadow=true
    mesh.receiveShadow=true
    var p=getTubePosition(tubeIndex)
    mesh.position.set(p.x,getLiquidY(slotIndex),p.z)
    mesh.userData={tubeIndex:tubeIndex,colorIndex:colorIndex,slotIndex:slotIndex,clickable:true,isBall:true}
    return mesh
}

function clearLiquids(){
    for(var i=scene.children.length-1;i>=0;i--){
        if(scene.children[i].userData&&scene.children[i].userData.isBall) scene.remove(scene.children[i])
    }
    liquidMeshes=[]
}

function buildScene(){
    while(tubeGroup.children.length>0) tubeGroup.remove(tubeGroup.children[0])
    clearLiquids()
    tubeMeshes=[]
    glowMeshes=[]
    var estado=estadoActual(historial)
    if(!estado) return
    for(var i=0;i<estado.length;i++){
        var t=createTubeMesh(i)
        tubeGroup.add(t)
        tubeMeshes.push(t)
    }
    for(var i=0;i<estado.length;i++){
        var arr=estado[i].toArray()
        for(var j=0;j<arr.length;j++){
            var liq=createLiquidMesh(arr[j],i,j)
            scene.add(liq)
            liquidMeshes.push(liq)
        }
    }
}

function updateLiquids(){
    clearLiquids()
    var estado=estadoActual(historial)
    if(!estado) return
    for(var i=0;i<estado.length;i++){
        var arr=estado[i].toArray()
        for(var j=0;j<arr.length;j++){
            var liq=createLiquidMesh(arr[j],i,j)
            scene.add(liq)
            liquidMeshes.push(liq)
        }
    }
}

function setTubeGlow(index,active,color){
    if(!glowMeshes[index]) return
    glowMeshes[index].material.opacity=active?0.15:0
    if(active) glowMeshes[index].material.color.set(color||0x00d4ff)
}

function clearAllGlow(){
    for(var i=0;i<glowMeshes.length;i++) setTubeGlow(i,false)
}

function liftTopLiquids(tubeIndex){
    if(lifted) return
    var estado=estadoActual(historial)
    if(!estado) return
    var arr=estado[tubeIndex].toArray()
    if(arr.length===0) return
    var top=arr[arr.length-1]
    var count=0
    for(var i=arr.length-1;i>=0;i--){
        if(arr[i]===top) count++
        else break
    }
    var startSlot=arr.length-count
    for(var k=0;k<liquidMeshes.length;k++){
        var liq=liquidMeshes[k]
        if(liq.userData.tubeIndex===tubeIndex&&liq.userData.slotIndex>=startSlot){
            liq.userData._origY=liq.position.y
            liq.position.y+=0.5
        }
    }
    lifted=true
}

function dropLiftedLiquids(){
    if(!lifted) return
    for(var k=0;k<liquidMeshes.length;k++){
        var liq=liquidMeshes[k]
        if(liq.userData._origY!==undefined){
            liq.position.y=liq.userData._origY
            delete liq.userData._origY
        }
    }
    lifted=false
}

function showToast(msg,type){
    var el=document.getElementById('toast')
    if(!el) return
    el.textContent=msg
    el.className=type+' show'
    if(toastTimeout) clearTimeout(toastTimeout)
    toastTimeout=setTimeout(function(){el.className=''},1800)
}

function flashTubeError(index){
    if(!glowMeshes[index]) return
    var mat=glowMeshes[index].material
    mat.color.set(0xff0000)
    mat.opacity=0.3
    setTimeout(function(){mat.opacity=0},400)
}

function getErrorMsg(estado,from,to){
    if(estado[to].size()>=CAPACIDAD) return "Tubo lleno"
    var bloque=contarBloqueSuperior(estado[from])
    var espacio=CAPACIDAD-estado[to].size()
    if(!estado[to].isEmpty()&&estado[to].peek()!==estado[from].peek()) return "Colores diferentes"
    if(espacio<bloque) return "No hay espacio para el bloque ("+bloque+" piezas)"
    return "Movimiento invalido"
}

function selectTube(index){
    if(index<0||index>=NUMERO_TUBOS) return
    var estado=estadoActual(historial)
    if(!estado) return
    if(selectedTube===index){
        dropLiftedLiquids()
        clearAllGlow()
        selectedTube=-1
        return
    }
    if(selectedTube===-1){
        if(estado[index].isEmpty()){
            showToast("Tubo vacio","error")
            flashTubeError(index)
            return
        }
        selectedTube=index
        clearAllGlow()
        setTubeGlow(index,true,0x00d4ff)
        liftTopLiquids(index)
    }else{
        var from=selectedTube
        if(!puedeMover(estado[from],estado[index])){
            showToast(getErrorMsg(estado,from,index),"error")
            flashTubeError(index)
            dropLiftedLiquids()
            clearAllGlow()
            selectedTube=-1
            return
        }
        var ok=hacerMovimiento(historial,from,index)
        dropLiftedLiquids()
        clearAllGlow()
        selectedTube=-1
        if(ok){
            movesCount++
            document.getElementById('moves').textContent=movesCount
            updateLiquids()
            render2D()
            var cur=estadoActual(historial)
            if(cur&&detectarVictoria(cur)) showVictory()
        }
    }
}

function getIntersectedTube(event){
    var rect=renderer.domElement.getBoundingClientRect()
    mouse.x=((event.clientX-rect.left)/rect.width)*2-1
    mouse.y=-((event.clientY-rect.top)/rect.height)*2+1
    raycaster.setFromCamera(mouse,camera)
    var targets=[]
    tubeGroup.traverse(function(ch){if(ch.isMesh) targets.push(ch)})
    for(var k=0;k<liquidMeshes.length;k++) targets.push(liquidMeshes[k])
    var hits=raycaster.intersectObjects(targets,false)
    if(hits.length>0){
        var obj=hits[0].object
        while(obj){
            if(obj.userData&&obj.userData.tubeIndex!==undefined) return obj.userData.tubeIndex
            obj=obj.parent
        }
    }
    return-1
}

function onClick(event){
    if(animating) return
    var i=getIntersectedTube(event)
    if(i>=0) selectTube(i)
    else{
        dropLiftedLiquids()
        clearAllGlow()
        selectedTube=-1
    }
}

function onMouseMove(event){
    var i=getIntersectedTube(event)
    if(i!==hoverTube){
        if(hoverTube>=0&&hoverTube!==selectedTube) setTubeGlow(hoverTube,false)
        hoverTube=i
        if(hoverTube>=0&&hoverTube!==selectedTube) setTubeGlow(hoverTube,true,selectedTube>=0?0x7bed9f:0x334455)
    }
    renderer.domElement.style.cursor=i>=0?'pointer':'default'
}

function onResize(){
    camera.aspect=window.innerWidth/window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth,window.innerHeight)
}

function showVictory(){
    document.getElementById('victory-moves').textContent='Completado en '+movesCount+' movimientos!'
    document.getElementById('victory-screen').classList.add('active')
    spawnFireworks()
}

function hideVictory(){
    document.getElementById('victory-screen').classList.remove('active')
}

function spawnFireworks(){
    for(var f=0;f<5;f++){
        (function(f){
            setTimeout(function(){
                var n=50
                var geo=new THREE.BufferGeometry()
                var pos=new Float32Array(n*3)
                var vels=[]
                var cx=(Math.random()-0.5)*10,cy=4+Math.random()*4,cz=(Math.random()-0.5)*6
                for(var i=0;i<n;i++){
                    pos[i*3]=cx;pos[i*3+1]=cy;pos[i*3+2]=cz
                    vels.push(new THREE.Vector3((Math.random()-0.5)*0.3,Math.random()*0.2,(Math.random()-0.5)*0.3))
                }
                geo.setAttribute('position',new THREE.BufferAttribute(pos,3))
                var mat=new THREE.PointsMaterial({size:0.15,color:new THREE.Color(COLOR_PALETTE[Math.floor(Math.random()*COLOR_PALETTE.length)]),transparent:true,opacity:1,blending:THREE.AdditiveBlending})
                var pts=new THREE.Points(geo,mat)
                scene.add(pts)
                var life=0
                function tick(){
                    life++
                    var a=geo.attributes.position.array
                    for(var i=0;i<n;i++){
                        a[i*3]+=vels[i].x;a[i*3+1]+=vels[i].y;a[i*3+2]+=vels[i].z
                        vels[i].y-=0.005
                    }
                    geo.attributes.position.needsUpdate=true
                    mat.opacity=Math.max(0,1-life/60)
                    if(life<60) requestAnimationFrame(tick)
                    else scene.remove(pts)
                }
                tick()
            },f*300)
        })(f)
    }
}

function undoMove(){
    if(animating) return
    if(historial.size()<=1){
        showToast("Nada que deshacer","info")
        return
    }
    dropLiftedLiquids()
    clearAllGlow()
    selectedTube=-1
    selected2D=-1
    undo(historial)
    movesCount=Math.max(0,movesCount-1)
    document.getElementById('moves').textContent=movesCount
    updateLiquids()
    render2D()
}

function resetGame(){
    if(animating) return
    dropLiftedLiquids()
    clearAllGlow()
    selectedTube=-1
    selected2D=-1
    resetear(historial)
    movesCount=0
    document.getElementById('moves').textContent=movesCount
    hideVictory()
    updateLiquids()
    render2D()
}

function newGame(){
    if(animating) return
    historial=empezarJuego()
    movesCount=0
    document.getElementById('moves').textContent=movesCount
    selectedTube=-1
    selected2D=-1
    lifted=false
    hideVictory()
    buildScene()
    render2D()
}

function animate(){
    requestAnimationFrame(animate)
    if(controls) controls.update()
    if(particleSystem){
        var p=particleSystem.geometry.attributes.position.array
        for(var i=0;i<p.length;i+=3){
            p[i+1]+=0.002
            if(p[i+1]>12) p[i+1]=0
        }
        particleSystem.geometry.attributes.position.needsUpdate=true
        particleSystem.rotation.y+=0.0002
    }
    if(renderer&&scene&&camera) renderer.render(scene,camera)
}

// --- 2D ---
function render2D(){
    var container=document.getElementById('view-2d')
    if(!container) return
    container.innerHTML=''
    var estado=estadoActual(historial)
    if(!estado) return
    var grid=document.createElement('div')
    grid.className='grid-2d'
    for(var i=0;i<estado.length;i++){
        var tubeEl=document.createElement('div')
        tubeEl.className='tube2d'+(i===selected2D?' selected2d':'')
        tubeEl.setAttribute('data-index',i)
        ;(function(idx){
            tubeEl.addEventListener('click',function(){onTube2DClick(idx)})
        })(i)
        var arr=estado[i].toArray()
        for(var j=CAPACIDAD-1;j>=0;j--){
            var slot=document.createElement('div')
            slot.className='slot2d'
            if(j<arr.length){
                slot.className+=' filled'
                slot.style.background=getCSS(arr[j])
                slot.style.boxShadow='inset 0 -3px 6px rgba(0,0,0,0.3), 0 0 8px '+getCSS(arr[j])+'66'
            }
            tubeEl.appendChild(slot)
        }
        var label=document.createElement('div')
        label.className='tube2d-label'
        label.textContent=i+1
        tubeEl.appendChild(label)
        grid.appendChild(tubeEl)
    }
    container.appendChild(grid)
}

function onTube2DClick(index){
    if(index<0||index>=NUMERO_TUBOS) return
    var estado=estadoActual(historial)
    if(!estado) return
    if(selected2D===index){
        selected2D=-1
        render2D()
        return
    }
    if(selected2D===-1){
        if(estado[index].isEmpty()){
            showToast("Tubo vacio","error")
            return
        }
        selected2D=index
        render2D()
    }else{
        var from=selected2D
        if(!puedeMover(estado[from],estado[index])){
            showToast(getErrorMsg(estado,from,index),"error")
            selected2D=-1
            render2D()
            return
        }
        var ok=hacerMovimiento(historial,from,index)
        selected2D=-1
        if(ok){
            movesCount++
            document.getElementById('moves').textContent=movesCount
            updateLiquids()
            render2D()
            var cur=estadoActual(historial)
            if(cur&&detectarVictoria(cur)) showVictory()
        }else{
            render2D()
        }
    }
}

function toggleView(){
    var canvas=document.getElementById('game-canvas')
    var view2d=document.getElementById('view-2d')
    var btn=document.getElementById('btn-view')
    var title=document.getElementById('hud-title')
    if(currentView==='3d'){
        currentView='2d'
        canvas.style.display='none'
        view2d.style.display='flex'
        btn.textContent='3D'
        if(title) title.textContent='Tube Sort 2D'
        render2D()
    }else{
        currentView='3d'
        canvas.style.display='block'
        view2d.style.display='none'
        btn.textContent='2D'
        if(title) title.textContent='Tube Sort 3D'
        updateLiquids()
    }
    selectedTube=-1
    selected2D=-1
    dropLiftedLiquids()
    clearAllGlow()
}

// --- Start ---
try{
    initThree()
    newGame()
    animate()
    console.log('Game started OK')
}catch(e){
    console.error('Game start error:',e)
    document.body.innerHTML='<div style="color:white;padding:40px;font-size:1.2rem">Error: '+e.message+'</div>'
}

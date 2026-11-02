import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = id => document.getElementById(id);
const intro=$('intro'), viewer=$('viewer'), lesson=$('lesson'), host=$('sceneHost');
let renderer, scene, camera, controls, rig, model, ground, waveGroup, building, waterLayer, reticle;
let clock=new THREE.Clock(), running=false, progress=0, intensity=6, frequency=2, arMode=false, hitSource=null, hitRequested=false, placed=false;
let animationId, soilCondition='saturated', cameraStream=null, overlayMode=false, dragState=null;

function mat(color,roughness=.85,transparent=false,opacity=1){return new THREE.MeshStandardMaterial({color,roughness,transparent,opacity});}
function makeBox(w,h,d,material,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
function buildModel(){
  rig=new THREE.Group(); scene.add(rig);
  const base=new THREE.Group(); rig.add(base);
  // Cutaway block: soil layers, saturated sand, water table and surface.
  makeBox(2.8,.12,1.8,mat('#667b52'),0,-.06,0,base);
  makeBox(2.8,.34,1.8,mat('#8b7656'),0,-.29,0,base);
  makeBox(2.8,.58,1.8,mat('#d1ad76'),0,-.75,0,base);
  waterLayer=makeBox(2.8,.015,1.8,new THREE.MeshStandardMaterial({color:'#49b8d0',transparent:true,opacity:.58,roughness:.2}),0,-.48,0,base);
  // Soil cutaway front face visual grid.
  const grid=new THREE.GridHelper(2.8,14,'#fff0cc','#fff0cc');grid.rotation.x=Math.PI/2;grid.position.set(0,-.12,.906);grid.material.transparent=true;grid.material.opacity=.16;base.add(grid);
  // Surface grass tufts.
  const grassMat=mat('#4d784c');
  for(let i=0;i<38;i++){const x=(Math.random()-.5)*2.55,z=(Math.random()-.5)*1.55;const tuft=makeBox(.018,.08,.018,grassMat,x,.05,z,base);tuft.rotation.z=(Math.random()-.5)*.3;}
  // Small building and road on top.
  building=new THREE.Group();base.add(building);
  makeBox(.52,.43,.48,mat('#e6e2d6'),-.72,.28,-.18,building);
  makeBox(.58,.08,.54,mat('#a74e3c'),-.72,.535,-.18,building);
  for(let x=-.9;x<=-.55;x+=.17)makeBox(.07,.11,.012,mat('#6ca4b5'),x,.3,.067,building);
  makeBox(1.05,.045,.23,mat('#555e61'),.78,.1,.48,base);
  // Seismic source and wave rings.
  const source=new THREE.Mesh(new THREE.ConeGeometry(.12,.25,12),mat('#f08b4d'));source.rotation.z=Math.PI;source.position.set(0,-1.03,.0);base.add(source);
  waveGroup=new THREE.Group();base.add(waveGroup);
  for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.2+i*.18,.012,6,64),new THREE.MeshBasicMaterial({color:i%2?'#f3d18d':'#58d7c6',transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;ring.position.set(0,-.39,0);waveGroup.add(ring);}
  // Small explanatory label plate.
  const plate=makeBox(1.25,.035,.06,mat('#173846'),0,.12,.95,base);plate.rotation.x=-.2;
  model=base;
  // Add a soft light marker above the model.
  const light=new THREE.PointLight('#fff0ce',1.3,5);light.position.set(0,2,2);rig.add(light);
}
function initScene(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#b8d2d5');
  camera=new THREE.PerspectiveCamera(55,host.clientWidth/host.clientHeight,.01,100);
  camera.position.set(3.5,2.6,4.6);camera.lookAt(0,-.35,0);
  controls=new OrbitControls(camera,host);controls.target.set(0,-.35,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2.7;controls.maxDistance=8;
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.xr.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;host.querySelector('canvas')?.remove();host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#e8f8ff','#6b5943',2));const sun=new THREE.DirectionalLight('#fff1d5',2.4);sun.position.set(3,5,4);scene.add(sun);
  buildModel();
  reticle=new THREE.Mesh(new THREE.RingGeometry(.08,.105,32),new THREE.MeshBasicMaterial({color:'#5ed6c0'}));reticle.rotation.x=-Math.PI/2;reticle.matrixAutoUpdate=false;reticle.visible=false;scene.add(reticle);
  window.addEventListener('resize',resize);
  renderer.setAnimationLoop(render);
}
function resize(){if(!renderer)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);}
function susceptibility(){return soilCondition==='saturated'?1:soilCondition==='dense'?.32:.08;}
function updateScience(){const raw=Math.max(0,(progress-18)/82);const ru=Math.min(.92,raw*Math.pow(intensity/10,1.25)*susceptibility());const effective=1-ru;const pore=Math.round(ru*100);$('poreValue').textContent=pore+'%';$('stressValue').textContent=Math.round(effective*100)+'%';let explanation='Getaran belum cukup berkembang untuk menunjukkan perubahan berarti pada tekanan air pori.';if(soilCondition==='dry')explanation='Tanah kering tidak memiliki kejenuhan air yang diperlukan untuk mekanisme likuifaksi klasik. Guncangan tetap dapat menggeser atau memadatkan tanah.';else if(soilCondition==='dense')explanation='Pasir padat jenuh air umumnya lebih tahan terhadap kontraksi. Pada model pembelajaran ini, kenaikan indeks tekanan air porinya dibuat lebih kecil.';else if(ru<.2)explanation='Pada pasir lepas jenuh air, getaran siklik mulai dapat menaikkan tekanan air pori.';else if(ru<.65)explanation='Tekanan air pori meningkat. Tegangan efektif yang menjaga butiran saling mengunci mulai berkurang.';else explanation='Indeks tekanan air pori tinggi: kekuatan tanah dapat turun tajam dan deformasi permukaan menjadi lebih mungkin.';$('scienceExplanation').textContent=explanation;return ru;}
function render(){const dt=Math.min(clock.getDelta(),.05);if(controls&&controls.enabled)controls.update();if(running){progress=Math.min(100,progress+dt*7.2);$('progressBar').style.width=progress+'%';$('progressText').textContent=Math.round(progress)+'%';updateStage();}
  const t=clock.elapsedTime;const amp=(intensity/10)*.045*(running?1:.08);if(model){model.position.x=Math.sin(t*frequency*2*Math.PI)*amp;model.rotation.z=Math.sin(t*frequency*2*Math.PI*.5)*amp*.12;}
  if(waveGroup){waveGroup.children.forEach((r,i)=>{const phase=(t*frequency*.7+i*.24)%1;r.scale.setScalar(.45+phase*2.6);r.material.opacity=(1-phase)*.8;});}
  const ru=updateScience();const liqui=Math.max(0,(ru-.25)/.67);if(waterLayer){waterLayer.material.opacity=soilCondition==='dry'?.12:(soilCondition==='dense'?.42:.48+liqui*.32);}if(building){building.position.y=-liqui*.15;building.rotation.z=Math.sin(t*frequency)*liqui*.08;}
  renderer.render(scene,camera);
}
function updateStage(){let name='GEMPA BERLANGSUNG';if(progress>20)name='GELOMBANG MERAMBAT';if(progress>48)name='TEKANAN AIR PORI MENINGKAT';if(progress>78)name=soilCondition==='saturated'?'POTENSI LIKUIFAKSI':'RESPONS TANAH';$('stageName').textContent=name;}
async function stopCameraOverlay(){
  if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}
  const video=$('cameraFeed');if(video){video.pause();video.srcObject=null;video.classList.add('hidden');}
  overlayMode=false;arMode=false;
  if(scene)scene.background=new THREE.Color('#b8d2d5');
  if(rig){rig.position.set(0,0,0);rig.rotation.set(0,0,0);rig.scale.setScalar(1);}
  if(controls)controls.enabled=true;
  $('stopCamera').classList.add('hidden');
}
async function startViewer(ar){
  intro.classList.add('hidden');lesson.classList.add('hidden');viewer.classList.remove('hidden');
  arMode=!!ar;overlayMode=!!ar;placed=!ar;progress=0;running=false;
  $('progressBar').style.width='0%';$('progressText').textContent='0%';$('playBtn').textContent='▶ Mulai gempa';$('stageName').textContent='KONDISI AWAL';updateScience();
  $('placeAgain').classList.toggle('hidden',!ar);$('stopCamera').classList.toggle('hidden',!ar);
  if(!renderer)initScene();else resize();
  if(rig){rig.scale.setScalar(ar?.48:1);rig.position.set(0,0,0);}
  if(controls)controls.enabled=!ar;
  const video=$('cameraFeed');
  if(ar){
    if(!navigator.mediaDevices?.getUserMedia){$('arHint').textContent='Browser tidak menyediakan akses kamera. Pastikan website HTTPS dan gunakan Chrome terbaru.';return;}
    $('arHint').textContent='Meminta akses kamera belakang…';
    try{
      cameraStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      video.srcObject=cameraStream;video.classList.remove('hidden');await video.play();
      scene.background=null;renderer.setClearColor(0x000000,0);overlayMode=true;
      $('arHint').textContent='Mode kamera aktif. Model 3D tampil sebagai overlay. Geser model dengan jari untuk mengatur posisinya.';
      $('compatNote').textContent='Mode kamera overlay aktif. Mode ini tidak memakai pelacakan permukaan ARCore.';
      placed=true;
    }catch(err){
      console.error('Camera error:',err);await stopCameraOverlay();
      $('arHint').textContent=err?.name==='NotAllowedError'?'Izin kamera ditolak. Izinkan Kamera untuk situs ini di setelan Chrome, lalu coba lagi.':err?.name==='NotFoundError'?'Kamera tidak ditemukan pada perangkat.':'Kamera gagal dibuka ('+(err?.name||'error')+'). Pastikan HTTPS, tutup aplikasi lain yang memakai kamera, lalu coba lagi.';
      $('stopCamera').classList.add('hidden');return;
    }
  }else{
    await stopCameraOverlay();scene.background=new THREE.Color('#b8d2d5');renderer.setClearColor(0x000000,0);
    $('arHint').textContent='Mode 3D: putar tampilan dengan menggeser layar atau mouse.';
  }
}
$('startAR').addEventListener('click',()=>startViewer(true));$('start3D').addEventListener('click',()=>startViewer(false));
$('stopCamera').addEventListener('click',async()=>{await stopCameraOverlay();$('arHint').textContent='Kamera dihentikan. Anda dapat kembali ke mode 3D.';});
// Touch-drag moves the overlay model on screen; this is a visual overlay, not world-locked AR tracking.
const sceneHost=$('sceneHost');
sceneHost.addEventListener('pointerdown',e=>{if(!overlayMode||!rig)return;dragState={x:e.clientX,y:e.clientY,px:rig.position.x,py:rig.position.y};sceneHost.setPointerCapture?.(e.pointerId);});
sceneHost.addEventListener('pointermove',e=>{if(!dragState||!rig)return;const dx=(e.clientX-dragState.x)/Math.max(1,sceneHost.clientWidth);const dy=(e.clientY-dragState.y)/Math.max(1,sceneHost.clientHeight);rig.position.x=dragState.px+dx*2.2;rig.position.y=dragState.py-dy*1.5;});
sceneHost.addEventListener('pointerup',()=>{dragState=null;});sceneHost.addEventListener('pointercancel',()=>{dragState=null;});
$('intensity').addEventListener('input',e=>{intensity=+e.target.value;$('intensityValue').textContent=intensity+' / 10';updateScience();});$('frequency').addEventListener('input',e=>{frequency=+e.target.value;$('frequencyValue').textContent=frequency.toFixed(1)+' Hz';});$('soilCondition').addEventListener('change',e=>{soilCondition=e.target.value;progress=0;running=false;$('progressBar').style.width='0%';$('progressText').textContent='0%';$('playBtn').textContent='▶ Mulai gempa';$('stageName').textContent='KONDISI AWAL';if(building){building.position.y=0;building.rotation.z=0;}updateScience();});
$('playBtn').addEventListener('click',()=>{if(progress>=100){progress=0;building.position.y=0;building.rotation.z=0;}running=!running;$('playBtn').textContent=running?'Ⅱ Jeda gempa':'▶ Lanjutkan gempa';});
$('resetBtn').addEventListener('click',()=>{running=false;progress=0;building.position.y=0;building.rotation.z=0;waterLayer.material.opacity=soilCondition==='dry'?.12:.48;$('playBtn').textContent='▶ Mulai gempa';$('progressBar').style.width='0%';$('progressText').textContent='0%';$('stageName').textContent='KONDISI AWAL';updateScience();});
$('placeAgain').addEventListener('click',()=>{placed=false;$('arHint').textContent='Arahkan kamera ke permukaan datar, lalu ketuk untuk meletakkan model.';});
$('panelToggle').addEventListener('click',()=>{$('panelBody').classList.toggle('hidden');$('panelToggle').textContent=$('panelBody').classList.contains('hidden')?'⌃':'⌄';});
$('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));

const questions=[{q:'Gelombang gempa membawa apa ke dalam tanah?',a:['Energi getaran','Air hujan','Udara panas'],correct:0,why:'Gelombang seismik membawa energi yang menyebabkan partikel tanah bergetar.'},{q:'Likuifaksi paling berisiko terjadi pada kondisi tanah seperti apa?',a:['Batuan keras dan kering','Pasir lepas yang jenuh air','Tanah kering yang sangat padat'],correct:1,why:'Pasir lepas yang jenuh air rentan mengalami kenaikan tekanan air pori saat diguncang.'},{q:'Apa yang dapat terjadi ketika tekanan air pori meningkat sangat tinggi?',a:['Kekuatan tanah dapat menurun','Tanah berubah menjadi batu','Gelombang gempa berhenti'],correct:0,why:'Tekanan air pori yang tinggi mengurangi tegangan efektif sehingga kekuatan tanah dapat turun.'}];let qi=0,selected=-1,checked=false,score=0;
function drawQuiz(){const q=questions[qi];$('quizContent').innerHTML=`<p style="font-size:13px;color:#62777d">Pertanyaan ${qi+1} dari ${questions.length}</p><h3 style="font-size:17px">${q.q}</h3>`+q.a.map((a,i)=>`<button class="quiz-option ${selected===i?'selected':''}" data-choice="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('')+(checked?`<p style="background:#e8f4ef;padding:12px;border-radius:8px">${selected===q.correct?'✓ Benar!':'Belum tepat.'} ${q.why}</p>`:'');document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{if(!checked){selected=+b.dataset.choice;drawQuiz();}}));$('nextQuestion').textContent=checked?(qi===questions.length-1?'Lihat hasil':'Pertanyaan berikutnya'):'Periksa jawaban';}
$('quizOpen').addEventListener('click',()=>{qi=0;selected=-1;checked=false;score=0;drawQuiz();$('quizDialog').showModal();});$('nextQuestion').addEventListener('click',()=>{if(!checked){if(selected<0)return;checked=true;if(selected===questions[qi].correct)score++;drawQuiz();}else if(qi<questions.length-1){qi++;selected=-1;checked=false;drawQuiz();}else{$('quizContent').innerHTML=`<h3>Skor kamu: ${score} dari ${questions.length}</h3><p>Terus belajar dan coba ulangi simulasi untuk memahami hubungan gelombang gempa dengan likuifaksi.</p>`;$('nextQuestion').textContent='Tutup';$('nextQuestion').onclick=()=>{$('quizDialog').close();$('nextQuestion').onclick=null;};}});

window.audioContext = new (window.AudioContext || window.webkitAudioContext)();



window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
    })();



function Metronome() {
    this.metronomePlaying = false;
    this.interval = null;

    this.lastTime = window.audioContext.currentTime;

    this.pendulumLength = 500;

    this.noteLength = 0.05;
    this.nextNoteTime = 0;
    this.beatNumber = 0;
    this.drawQueue = [];
    this.current16thOfANote = 0;
    this.x = 0;
    this.y= 0;

    this.clockwise = true;

    this.analyser = window.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    this.startStop = document.getElementById('start-stop');
    this.bpm = document.getElementById('bpm');
    this.resolution = document.getElementById('resolution');
    this.sonogramColorScale = new chroma.scale(['f5f5f5','#ABE18B','#88BD7A','#689A68','#4C7954','#335940','#1E3A2B']).out('hex');

    this.pendulumCanvas = document.getElementById('pendulum');
    this.pendulumCanvasCtx = this.pendulumCanvas.getContext('2d');
    this.canvasHeight = 500;
    this.canvasWidth = 400;
    this.n = 0;
}

Metronome.prototype.nextNote = function() {
    var tempo = this.bpm.value;
    if (tempo <20) {
        tempo = 20;
    } else if (tempo > 240) {
        tempo = 240
    }

    this.beatsPerSecond = 60.0/ tempo;

    this.nextNoteTime += 0.25 * this.beatsPerSecond;


    if (this.beatNumber == 16) {
        this.beatNumber = 0;
    }
    this.beatNumber ++;


};

Metronome.prototype.playNote =function () {


    if ( (this.resolution.options[this.resolution.selectedIndex].value==2) && (this.beatNumber%2))
    return;
    if ( (this.resolution.options[this.resolution.selectedIndex].value==3) && (this.beatNumber%4))
    return;
    if ( (this.resolution.options[this.resolution.selectedIndex].value==4) && (this.beatNumber%8))
    return;
    if ( (this.resolution.options[this.resolution.selectedIndex].value==5) && (this.beatNumber%16))
    return;

    this.drawQueue.push( { note: this.beatNumber, time: this.nextNoteTime } );


    var oscillator = window.audioContext.createOscillator();
    oscillator.connect(this.analyser);
    this.analyser.connect(window.audioContext.destination);


    if (this.beatNumber % 16 == 0) {

        oscillator.frequency.value = 1200.0;

    }
    else if (this.beatNumber % 4 == 0){

        oscillator.frequency.value = 880.0;
    }
    else {

        oscillator.frequency.value = 600.0;
    }


    oscillator.start(this.nextNoteTime);
    oscillator.stop(this.nextNoteTime + this.noteLength);

};

Metronome.prototype.schedule = function() {

    while ( this.nextNoteTime < window.audioContext.currentTime + 0.1){

        this.playNote();
        this.nextNote();

    }

};

Metronome.prototype.play = function() {
    this.interval = window.setInterval(this.schedule.bind(this), 25);
    window.requestAnimFrame(this.drawTimer.bind(this));
    this.startStop.innerHTML = 'Stop';
    console.log('interval made');

};

Metronome.prototype.stop =  function () {
    this.startStop.innerHTML = 'Start';
    window.clearInterval(this.interval);
    console.log('interval cleared')

};

Metronome.prototype.toggle = function () {
    console.log(this.metronomePlaying);
    (this.metronomePlaying ? this.stop() : this.play());
    this.metronomePlaying = !this.metronomePlaying;

};


Metronome.prototype.draw = function () {

   var angle = 1.5 * Math.PI;

   this.x = this.canvasWidth/2 + this.pendulumLength * Math.cos(angle + (this.n * 0.02));
   this.y = 50 - this.canvasHeight + this.pendulumLength * Math.sin(angle + (this.n * 0.02));


    // Start drawing
    this.pendulumCanvasCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

    // Draw bar for Pendulum
    this.pendulumCanvasCtx.strokeStyle = 'black';
    this.pendulumCanvasCtx.beginPath();
    this.pendulumCanvasCtx.moveTo(this.canvasWidth/2, this.canvasHeight-50);
    this.pendulumCanvasCtx.lineTo(this.x, this.y);
    this.pendulumCanvasCtx.stroke();
    this.pendulumCanvasCtx.closePath();


    // Draw pendulum
    this.pendulumCanvasCtx.fillStyle ='pink';
    this.pendulumCanvasCtx.beginPath();
    this.pendulumCanvasCtx.arc(this.canvasWidth/2,this.canvasHeight-50, 30, 0, Math.PI*2, false);
    this.pendulumCanvasCtx.fill();
    this.pendulumCanvasCtx.closePath();

};


Metronome.prototype.drawTimer = function() {

    this.pendulumCanvasCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

    var timeDifference = window.audioContext.currentTime - this.lastTime;

    if ( timeDifference > 0.1  && this.n == 30 && this.clockwise == true) {

        this.lastTime = window.audioContext.currentTime;
        this.clockwise = false;

    }
    else if (timeDifference > 0.1  && this.clockwise == true) {

        this.lastTime = window.audioContext.currentTime;
        this.n +=1;


    } else if (timeDifference > 0.1  && this.n == -30 && this.clockwise== false){

        this.lastTime = window.audioContext.currentTime;
        this.clockwise = true;


    } else if (timeDifference > 0.1  && this.clockwise == false)  {

        this.lastTime = window.audioContext.currentTime;
        this.n -= 1;


    }

    this.draw();


    this.interval = setInterval(this.drawTimer.bind(this), 100)

};

var run = new Metronome();


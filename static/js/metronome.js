window.audioContext = new (window.AudioContext || window.webkitAudioContext)();



window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
    })();



function Metronome() {
    this.metronomePlaying = false;
    this.interval = null;


    this.noteLength = 0.05;
    this.nextNoteTime = 0;
    this.beatNumber = 0;
    this.drawQueue = [];
    this.current16thOfANote = 0;
    this.column = 0;


    this.analyser = window.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArrayForCanvas = new Uint8Array(this.bufferLength);

    this.startStop = document.getElementById('start-stop');
    this.bpm = document.getElementById('bpm');
    this.resolution = document.getElementById('resolution');
    this.sonogramColorScale = new chroma.scale(['f5f5f5','#ABE18B','#88BD7A','#689A68','#4C7954','#335940','#1E3A2B']).out('hex');

    this.canvas = document.getElementById('visualizer');
    this.canvasCtx = this.canvas.getContext('2d');
    this.HEIGHT = 800.0;
    this.WIDTH = 1920.0;
}



Metronome.prototype.nextNote = function() {
    var tempo = this.bpm.value;

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




Metronome.prototype.drawTimer = function() {
    this.currentNote = this.current16thOfANote;
    this.currentTime = window.audioContext.currentTime;


    if (this.column == 0){
                this.canvasCtx.clearRect(0,0, this.WIDTH, this.HEIGHT)
            }

    this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

    var size = this.HEIGHT / this.bufferLength * 5;

    for (var j = 0; j < this.dataArrayForCanvas.length; j++) {

            this.canvasCtx.fillStyle = this.sonogramColorScale(this.dataArrayForCanvas[j] / 256.0);
            var color = this.dataArrayForCanvas[j] / 256.0;
//            this.canvasCtx.fillStyle = 'hsl(' + color + ',60%,60%)';
            this.canvasCtx.fillRect(this.column * size, this.HEIGHT - j, size, size);

        }

    this.column += 1;

    if (this.column >= this.WIDTH/size) {
        this.column = 0;
        this.canvasCtx.fillStyle = '#f5f5f5';
        this.canvasCtx.fillRect(0,0, this.WIDTH, this.HEIGHT)
    }
//    while (this.drawQueue.length && this.drawQueue[0].time < this.currentTime) {
//        this.currentNote = this.drawQueue[0].note;
//        this.drawQueue.splice(0,1);
//        }
//
//    if (this.current16thOfANote != this.currentNote) {
//
//        var noteHeight;
//
//
//        if (this.beatNumber % 16 == 0) {
//        noteHeight = this.HEIGHT * 0.7;
//        this.canvasCtx.strokeStyle = 'red';
//
//        }
//        else if (this.beatNumber % 4 == 0){
//            noteHeight = this.HEIGHT * 0.8;
//            this.canvasCtx.strokeStyle = 'green';
//        }
//        else {
//            noteHeight = this.HEIGHT * 0.9;
//            this.canvasCtx.strokeStyle = 'blue';
//        }
//
//
//        var canvas16thNotePosition = this.WIDTH/16;
//        var currentNotePosition = canvas16thNotePosition * this.beatNumber * 0.9;
//        this.canvasCtx.clearRect(0,0,this.WIDTH, this.HEIGHT);
//        this.canvasCtx.lineWidth = 5;
//
//        this.canvasCtx.beginPath();
//
//
//        this.canvasCtx.moveTo(currentNotePosition,this.HEIGHT);
//        this.canvasCtx.lineTo(currentNotePosition, noteHeight);
//        this.canvasCtx.stroke();
//
//
//
//        this.current16thOfANote = this.currentNote;
//    }
    window.requestAnimFrame(this.drawTimer.bind(this));

};

var run = new Metronome();


/**
 * Created by Plommonsorbet on 2014-12-28.
 */



var audioCtx = new (window.AudioContext || window.webkitAudioContext)();




navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

window.requestAnimFrame = (function(){
                       return  window.requestAnimationFrame       ||
                         window.webkitRequestAnimationFrame       ||
                         window.mozRequestAnimationFrame          ||
                         window.oRequestAnimationFrame            ||
                         window.msRequestAnimationFrame           ||
                         function( callback ){
                         window.setTimeout(callback, 1000 / 60);};
                       })();









function ChromaticTuner() {

    this.analyser = audioCtx.createAnalyser();
    this.analyser.minDecibels = -80 ;

    this.analyser.smoothingTimeConstant = 0.8;




    this.time = 0;

    this.canvasWidth = 1920;
    this.canvasHeight = 800;
    this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


    this.visualizer = document.querySelector('canvas');
    this.visualizerCtx = this.visualizer.getContext('2d');
    this.visualType = document.getElementById("visualType");
    this.pitch = document.getElementById('pitch');
    this.note = document.getElementById('note');

}


ChromaticTuner.prototype.start = function() {

    window.source.connect(this.analyser);

    this.analyser.fftSize = 2048;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArrayForCanvas = new Uint8Array(this.bufferLength);
    this.dataArrayForAutoCorrelation = new Float32Array(this.bufferLength);

    this.visualizerCtx.clearRect(0, 0, this.canvasHeight, this.canvasWidth);

    this.update();
};




ChromaticTuner.prototype.autoCorrelation  = function() {
    var samples = Math.floor(this.bufferLength / 2);
    var rootMeanSquareOfSignal = 0;
    var correlations = new Array(samples);
    var foundGoodCorrelation = false;
    var bestCorrelation = 0;
    var bestOffset = 0;


    for (var i = 0; i < this.bufferLength; i++) {
        rootMeanSquareOfSignal += this.dataArrayForAutoCorrelation[i] * this.dataArrayForAutoCorrelation[i]
    }

    rootMeanSquareOfSignal = Math.sqrt(rootMeanSquareOfSignal / this.bufferLength);
    if (rootMeanSquareOfSignal < 0.01) {
        return null;
    }

    var lastCorrelation = 1;
    for (var offset = 0; offset < samples; offset++) {
        var correlation = 0;

        for (var j = 0; j < samples; j++) {
            correlation += Math.abs((this.dataArrayForAutoCorrelation[j]) - (this.dataArrayForAutoCorrelation[j + offset]));
        }
        correlation = 1 - (correlation / samples);
        correlations[offset] = correlation;
        if ((correlation > 0.9) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;

            if (correlation > bestCorrelation) {

                bestCorrelation = correlation;
                bestOffset = offset;
            }
        } else if (foundGoodCorrelation) {
            var shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];

            return audioCtx.sampleRate / (bestOffset + (8 * shift));
        }

        lastCorrelation = correlation;

    }
    if (bestCorrelation > 0.01) {
        return audioCtx.sampleRate/bestOffset;
    }
    return null

};


ChromaticTuner.prototype.update = function() {


        this.analyser.getFloatTimeDomainData( this.dataArrayForAutoCorrelation );
        this.frequency = this.autoCorrelation();





        var x;
        this.visualizerCtx.fillStyle = 'rgb(245, 245, 245)';
        this.visualizerCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        if (this.visualType.elements["radio"].value == 'frequency bars'){
            x=0;
            this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

            var barWidth = (this.canvasWidth / this.bufferLength * 2.5);


            for (var i = 0; i < this.bufferLength; i++) {

                var color = i / this.analyser.frequencyBinCount * 1000;
                x = i + (i * barWidth);
                var barHeight = this.dataArrayForCanvas[i];


                this.visualizerCtx.fillStyle = 'hsl(' + color + ',60%,60%)';
                this.visualizerCtx.fillRect(x, this.canvasHeight - barHeight, barWidth, barHeight);

            }

        }
        else if (this.visualType.elements["radio"].value == 'sine wave') {
            console.log(this.visualType.elements["radio"].value);

            this.visualizerCtx.strokeStyle = "black";
            this.visualizerCtx.beginPath();
            this.visualizerCtx.moveTo(0,this.dataArrayForAutoCorrelation[0]);

            for (var j=0;j<this.canvasWidth;j++) {

                x = j * (this.canvasWidth / this.bufferLength);
                this.visualizerCtx.lineTo(x,this.canvasHeight/2+(this.dataArrayForAutoCorrelation[j]*this.canvasHeight/2));

            }

            this.visualizerCtx.stroke();


        }

        if (this.frequency != null ) {

            var note = 12 * (Math.log(this.frequency / 440) / Math.log(2) );
            note = Math.round(note) + 69;

            this.pitch.innerHTML = String(this.frequency.toFixed(2)) + ' Hz';
            this.note.innerHTML = this.notes[note % 12];


            this.time = audioCtx.currentTime;
        }

        else if ((audioCtx.currentTime - this.time) >= 5 ) {
            this.pitch.innerHTML = '-- Hz';
            this.note.innerHTML = '--'
        }

        requestAnimFrame(this.update.bind(this))
};
var run = new ChromaticTuner();



window.onload(navigator.getUserMedia(
    {audio: true},
    function (stream) {
        window.source = audioCtx.createMediaStreamSource(stream);
        run.start()
    },
    function (error) {
        console.log(alert("I'm sorry Dave. Your web browser can't do that."))
    }
));






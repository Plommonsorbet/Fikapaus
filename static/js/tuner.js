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
    this.analyser.minDecibels = -60 ;

    this.analyser.smoothingTimeConstant = 0.70;



    this.canvasWidth = 1920;
    this.canvasHeight = 800;

    this.sinewaveColorScale =  new chroma.scale(['white', 'black']).out('hex');
    this.sonogramColorScale = new chroma.scale(['f5f5f5','#ABE18B','#88BD7A','#689A68','#4C7954','#335940','#1E3A2B']).out('hex');
    this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    this.column = 0;

    this.frequencyUpdateTimer = audioCtx.currentTime;
    this.temporaryArrayForautoCorrelation = new Array;


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


    var bestCorrelation = 0;

    for (var i = 0; i < this.temporaryArrayForautoCorrelation.length; i++) {
        var dataArray = this.temporaryArrayForautoCorrelation[i];
        var samples = Math.floor(this.bufferLength / 2);
        var rootMeanSquareOfSignal = 0;
        var correlations = new Array(samples);
        var foundGoodCorrelation = false;

        var bestOffset = 0;

        for (var j = 0; j < this.bufferLength; j++) {
            rootMeanSquareOfSignal += dataArray[j] * dataArray[j]
        }

        rootMeanSquareOfSignal = Math.sqrt(rootMeanSquareOfSignal / this.bufferLength);
        if (rootMeanSquareOfSignal < 0.01) {
            return null;
        }

        var lastCorrelation = 1;
        for (var offset = 0; offset < samples; offset++) {
            var correlation = 0;

            for (var k = 0; k < samples; k++) {
                correlation += Math.abs((dataArray[k]) - (dataArray[k + offset]));
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
            return audioCtx.sampleRate / bestOffset;
        }
        return null
    }
};


ChromaticTuner.prototype.clearSonogram = function() {
        this.column = 0;
        this.visualizerCtx.fillRect(0,0, this.canvasWidth, this.canvasHeight)
};

ChromaticTuner.prototype.update = function() {


        this.analyser.getFloatTimeDomainData( this.dataArrayForAutoCorrelation );



        var x;
        this.visualizerCtx.fillStyle = 'rgb(245, 245, 245)';
//        this.visualizerCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        if (this.visualType.elements["radio"].value == 'frequency bars'){
            this.visualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);
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
            this.visualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

            console.log(this.visualType.elements["radio"].value);


            this.visualizerCtx.beginPath();
            this.visualizerCtx.lineWidth = 2;
            this.visualizerCtx.moveTo(0,this.dataArrayForAutoCorrelation[0]);

            for (var j=0; j<this.canvasWidth; j++) {
                this.visualizerCtx.strokeStyle = 'black';
                x = j * (this.canvasWidth / this.bufferLength);
                this.visualizerCtx.lineTo(x,this.canvasHeight/2+(this.dataArrayForAutoCorrelation[j]*this.canvasHeight/2));

            }

            this.visualizerCtx.stroke();


        }
        else if (this.visualType.elements["radio"].value == 'sonogram') {

            if (this.column == 0){
                this.visualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight)
            }

            this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

            var size = this.canvasHeight / this.bufferLength * 5;

            for (j = 0; j < this.dataArrayForCanvas.length; j++) {

                    this.visualizerCtx.fillStyle = this.sonogramColorScale(this.dataArrayForCanvas[j] / 256.0);
                    this.visualizerCtx.fillRect(this.column * size, this.canvasHeight - j, size, size);

                }

            this.column += 1;
            console.log(this.column);
            if (this.column >= this.canvasWidth/size) {
                this.column = 0;
                this.visualizerCtx.fillStyle = '#f5f5f5';
                this.visualizerCtx.fillRect(0,0, this.canvasWidth, this.canvasHeight)
            }

            }

        if ((audioCtx.currentTime - this.frequencyUpdateTimer) >= 0.5) {
            this.frequency = this.autoCorrelation();
            this.frequencyUpdateTimer = audioCtx.currentTime;


        }
        else {
            this.temporaryArrayForautoCorrelation.push( this.dataArrayForAutoCorrelation )
        }


        if (this.frequency != null ) {



            var note = 12 * (Math.log(this.frequency / 440) / Math.log(2) );
            note = Math.round(note) + 69;



            this.pitch.innerHTML = String(this.frequency.toFixed(1)) + ' Hz';
//            this.pitch.innerHTML = String(Math.round(this.frequency)) + ' Hz';
            this.note.innerHTML = this.notes[note % 12];


            this.time = audioCtx.currentTime;

        }

        else if ((audioCtx.currentTime - this.time) >= 5 ) {
            this.pitch.innerHTML = '-- Hz';
            this.note.innerHTML = '--'
        }

        requestAnimFrame(this.update.bind(this))
};




window.onload = function() {

    var run = new ChromaticTuner();

    navigator.getUserMedia(

        {audio: true},

        function (stream) {
            window.source = audioCtx.createMediaStreamSource(stream);
            run.start()
        },
        function () {
            alert("I'm sorry Dave. Your web browser can't do that.")
        }

    )};






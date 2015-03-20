/**
 * Created by Plommonsorbet on 2014-12-28.
 */


// Gathering the necessary (ingredients something something ingredients) for the tuner in a manner that will appease to the majority.

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();


navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia);


window.requestAnimFrame = (function(){
                       return  window.requestAnimationFrame       ||
                         window.webkitRequestAnimationFrame       ||
                         window.mozRequestAnimationFrame          ||
                         window.oRequestAnimationFrame            ||
                         function( callback ){
                         window.setTimeout(callback, 1000 / 60);};
                       })();





function ChromaticTuner() {

//  Creating our Analyser
    this.analyser = audioCtx.createAnalyser();
    this.analyser.minDecibels = -80 ;
    this.analyser.smoothingTimeConstant = 0.70;

//  Canvas max dimensions without being distorted.
    this.canvasWidth = 1920;
    this.canvasHeight = 800;

//  Color scheme for the pendulumCanvas.
    this.sonogramColorScale = new chroma.scale(['f5f5f5','#ABE18B','#88BD7A','#689A68','#4C7954','#335940','#1E3A2B']).out('hex');

//  For the note display.
    this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

//  Our x-coordinates for the pendulumCanvas.
    this.x = 0;

//  Using the audio context we can get an accurate timing of when we want to process the delayed audio data.
    this.frequencyUpdateTimer = audioCtx.currentTime;

//  Array to store the delayed audio input until being processed.
    this.temporaryArrayForautoCorrelation = new Array;

//  The pendulumCanvas and the canvasContext
    this.pendulumCanvas = document.querySelector('pendulumCanvas');
    this.pendulumCanvasCtx = this.pendulumCanvas.getContext('2d');

//  The current visual type e.g sonogram, frequency bars etc.
    this.visualType = document.getElementById("visualType");

//  Note and pitch display.
    this.pitch = document.getElementById('pitch');
    this.note = document.getElementById('note');
}


ChromaticTuner.prototype.start = function() {

//  This is where we connect the Electro-Voice communicator to our analyser(It does not determine the pitch but rather
//  allows us to extract the data in [different formats] <-- behöver omformuleras),
//  set the FFT size( where the amount of spectral lines are always FFT bins / 2).

    window.source.connect(this.analyser);

    this.analyser.fftSize = 2048;

//  As previously explaine is half of the FFT size and thus 1024.
    this.bufferLength = this.analyser.frequencyBinCount;

//  Creating arrays half the size of the amount of FFT bins
    this.dataArrayForCanvas = new Uint8Array(this.bufferLength);
    this.dataArrayForAutoCorrelation = new Float32Array(this.bufferLength);

//  Clearing the pendulumCanvas before visuals start.
    this.pendulumCanvasCtx.clearRect(0, 0, this.canvasHeight, this.canvasWidth);

//  initiating the visualization and tuner.
    this.update();
};




ChromaticTuner.prototype.autoCorrelation  = function() {


    var bestCorrelation = 0;

    for (var i = 0; i < this.temporaryArrayForautoCorrelation.length; i++) {
        var dataArray = this.temporaryArrayForautoCorrelation[i];
        var rootMeanSquareOfSignal = 0;
        var correlations = new Array(this.bufferLength);
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

            for (var k = 0; k < this.bufferLength; k++) {
                correlation += Math.abs((dataArray[k]) - (dataArray[k + offset]));
            }
            correlation = 1 - (correlation / this.bufferLength);
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


ChromaticTuner.prototype.clearCanvas = function() {
//      Clear and reset the pendulumCanvas when switching to the sonogram visualization.

        this.x = 0;
        this.pendulumCanvasCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);
        this.pendulumCanvasCtx.fillRect(0,0, this.canvasWidth, this.canvasHeight)

};

ChromaticTuner.prototype.update = function() {
//      This is where the data from the Electro-Voice communicator is extracted, where the different visualisations happens
//      and most importantly keeps track of when the data is to be shipped of for a biased auto correlation to determine pitch.

//      This copies the waveform data from the Electro-Voice communicator into "dataArrayForAutoCorrelation".
        this.analyser.getFloatTimeDomainData( this.dataArrayForAutoCorrelation );


//      Choose on of: frequency bars, sine wave, sonogram based on the visualType element.
        if (this.visualType.elements["radio"].value == 'frequency bars'){

//          Clear the previous "picture" on the pendulumCanvas.
            this.pendulumCanvasCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

//          Copies the FFT data into dataArrayForCanvas
            this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

//          Sets the bar width according to the current pendulumCanvas size.
            var barWidth = (this.canvasWidth / this.bufferLength * 2.5);

//          For each in the length of half the FFT bins.
            for (var i = 0; i < this.bufferLength; i++) {

//              To get a float based on the frequency so we can later use it to determine color.
                this.color = i / this.analyser.frequencyBinCount * 1000;
//              the x is used to determine where in the pendulumCanvas is according to the bar width and index of the FFT data.
                this.x = i + (i * barWidth);
//              The height of the bar is the value of the dataArrayForCanvas.
                var barHeight = this.dataArrayForCanvas[i];

//              Choose fill style based on the previous float.
                this.pendulumCanvasCtx.fillStyle = 'hsl(' + this.color + ',60%,60%)';
//              Draw the Bar
                this.pendulumCanvasCtx.fillRect(this.x, this.canvasHeight - barHeight, barWidth, barHeight);

            }

        }
        else if (this.visualType.elements["radio"].value == 'sine wave') {

//          Clear the previous "picture" on the pendulumCanvas.
            this.pendulumCanvasCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

//          Declare we want to start planning our stroke.
            this.pendulumCanvasCtx.beginPath();
//          Set the thickness of our stroke.
            this.pendulumCanvasCtx.lineWidth = 2;
//          Move to the value of the first value in the dataArrayForAutoCorrelation.
            this.pendulumCanvasCtx.moveTo(0,this.dataArrayForAutoCorrelation[0]);

//          for each in the pendulumCanvas width
            for (var j=0; j<this.canvasWidth; j++) {

//              Set the stroke color to black.
                this.pendulumCanvasCtx.strokeStyle = 'black';

//              Draw a point of the line at a point on the pendulumCanvas proportionate to the pendulumCanvas size/( FFT bins / 2 ) * the current
//              index in the timedomain data.
                this.x = j * (this.canvasWidth / this.bufferLength);

//              Plan a point on the pendulumCanvas.
                this.pendulumCanvasCtx.lineTo(x,this.canvasHeight/2+(this.dataArrayForAutoCorrelation[j]*this.canvasHeight/2));

            }
//          Draw the planned pendulumCanvas.
            this.pendulumCanvasCtx.stroke();


        }
        else if (this.visualType.elements["radio"].value == 'sonogram') {

//          Copies the FFT data into dataArrayForCanvas
            this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

//          The size of a point in the sonogram is equal to the pendulumCanvas height / ( FFT bins / 2 )
            var size = this.canvasHeight / this.bufferLength * 5;

//          For each in the length of half the FFT bins.
            for (j = 0; j < this.dataArrayForCanvas.length; j++) {

//                  Float for determining the intensity of the color.
                    this.color = this.dataArrayForCanvas[j] / 256.0;
//                  Set the fill style the intensity of the colorscale according to the float.
                    this.pendulumCanvasCtx.fillStyle = this.sonogramColorScale(this.color);
//                  Draw a point in the sonogram.
                    this.pendulumCanvasCtx.fillRect(this.x * size, this.canvasHeight - j, size, size);

                }
//          Add 1 to x each time so that it wont paint at the same x-coordinates.
            this.x ++;

//          Once it reaches the end of the pendulumCanvas set x=0 and clear the pendulumCanvas, so that it can continue to display the data.
            if (this.x >= this.canvasWidth/size) {
                this.x = 0;
                this.pendulumCanvasCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

            }

            }
//      When the 0.5 seconds have passed since the current time was equal to when we last saved the time we send the
//      time domain data to our biased auto correlation function.
        if ((audioCtx.currentTime - this.frequencyUpdateTimer) >= 0.5) {

            this.frequency = this.autoCorrelation();
            this.frequencyUpdateTimer = audioCtx.currentTime;


        }
//      Otherwise add the current time domain data to a temporary array so that we can delay the analysis.
        else {

            this.temporaryArrayForautoCorrelation.push( this.dataArrayForAutoCorrelation )

        }

//      if the returned frequency is not false, null, etc. determine the note from the frequency and insert the
//      current pitch and notes into their respective elements.
        if (this.frequency) {

            var note = 12 * (Math.log(this.frequency / 440) / Math.log(2) );
            note = Math.round(note) + 69;

            this.pitch.innerHTML = String(this.frequency.toFixed(1)) + ' Hz';
            this.note.innerHTML = this.notes[note % 12];

            this.time = audioCtx.currentTime;

        }
//      If nothing has been received for more than 5 seconds, -- Hz & -- respectively to the note and pitch element.
        else if ((audioCtx.currentTime - this.time) >= 5 ) {

            this.pitch.innerHTML = '-- Hz';
            this.note.innerHTML = '--'

        }
//      We use request animation frame instead of setTimeout or setInterval because it updates with the computers omformulera ---> [natural refresh rate].
        requestAnimFrame(this.update.bind(this))
};


// Upon the window loading, a new class was born and permission from the wise ones were sought, if one could use their
// Electro-Voice communicator. Unless one was deemed of an unsecure nature, thee must not ask again.


window.onload = function() {

    window.run = new ChromaticTuner();

    navigator.getUserMedia(

        {audio: true},

        function (stream) {

            // This new Electro-Voice communicator source has to be a global one, as to not disturb the ghost of the flaming fox.

            window.source = audioCtx.createMediaStreamSource(stream);
            window.run.start()
        },

        function () {
            alert("I'm sorry Dave. Your web browser can't do that.")
        }

    )};






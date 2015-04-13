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
    this.analyser.minDecibels = -60 ;
//    this.analyser.smoothingTimeConstant = 0.;

//  Canvas max dimensions without being distorted.
    this.canvasWidth = 1920;
    this.canvasHeight = 800;

//  Color scheme for the visualizer.
    this.sonogramColorScale = new chroma.scale(['f5f5f5','#ABE18B','#88BD7A','#689A68','#4C7954','#335940','#1E3A2B']).out('hex');

//  For the note display.
    this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

//  Our x-coordinates for the visualizer.
    this.x = 0;

//  Using the audio context we can get an accurate timing of when we want to process the delayed audio data.
    this.frequencyUpdateTimer = audioCtx.currentTime;

//  Array to store the delayed audio input until being processed.


    this.samples = Math.floor(1024 / 2);

    this.sampleRate = audioCtx.sampleRate;
//    this.bestCorrelation = 0;



//    this.rootMeanSquareOfSignal = 0;
//
//    this.bestOffset = 0;
//    this.lastCorrelation = 0;
//    this.correlations=[];
//    this.correlation = 0;
//    this.foundGoodCorrelation = false;

//  The visualizer and the canvasContext
    this.visualizer = document.getElementById('visualizer');
    this.VisualizerCtx = this.visualizer.getContext('2d');

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
    this.temporaryArrayForAutoCorrelation = new Float32Array(this.bufferLength);

//  Clearing the visualizer before visuals start.
    this.VisualizerCtx.clearRect(0, 0, this.canvasHeight, this.canvasWidth);

//  initiating the visualization and tuner.
    this.update();
};




ChromaticTuner.prototype.autoCorrelation  = function() {

    this.samples = this.dataArrayForAutoCorrelation.length/2;

    this.bestCorrelation = 0;

    this.rootMeanSquareOfSignal = 0;

    this.foundGoodCorrelation = false;

    this.correlations = new Array(this.samples);

    this.bestOffset = 0;

    for (var j = 0; j < this.samples; j++) {
        this.rootMeanSquareOfSignal += this.dataArrayForAutoCorrelation[j] * this.dataArrayForAutoCorrelation[j];
    }

    this.rootMeanSquareOfSignal = Math.sqrt(this.rootMeanSquareOfSignal / this.samples);

    if (this.rootMeanSquareOfSignal < 0.01) {

        return null;

    }

    this.lastCorrelation = 1;

    for (var offset = 0; offset < this.samples; offset++) {

        this.correlation = 0;

        for (var k = 0; k < this.samples; k++) {

            this.correlation += Math.abs((this.dataArrayForAutoCorrelation[k]) - (this.dataArrayForAutoCorrelation[k + offset]));

        }

        this.correlation = 1 - (this.correlation / (this.samples));

        this.correlations[offset] = this.correlation;


        if ((this.correlation > 0.9) && (this.correlation > this.lastCorrelation)) {

            this.foundGoodCorrelation = true;

            if (this.correlation > this.bestCorrelation) {

                this.bestCorrelation = this.correlation;
                this.bestOffset = offset;

            }
        }

//        else if (this.foundGoodCorrelation) {
//
//            var shift = (this.correlations[this.bestOffset + 1] - this.correlations[this.bestOffset - 1]) / this.correlations[this.bestOffset];
//
//            return this.sampleRate / (this.bestOffset + (8 * shift));
//
//        }

        this.lastCorrelation = this.correlation;

    }

    if (this.bestCorrelation > 0.01) {

        return this.sampleRate / this.bestOffset;

    }
    return null


};


ChromaticTuner.prototype.clearCanvas = function() {
//      Clear and reset the visualizer when switching to the sonogram visualization.

        this.x = 0;
        this.VisualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

};

ChromaticTuner.prototype.update = function() {
//      This is where the data from the Electro-Voice communicator is extracted, where the different visualisations happens
//      and most importantly keeps track of when the data is to be shipped of for a biased auto correlation to determine pitch.

//      This copies the waveform data from the Electro-Voice communicator into "temporaryArrayForAutoCorrelation".
        this.analyser.getFloatTimeDomainData( this.temporaryArrayForAutoCorrelation );


//      Choose on of: frequency bars, sine wave, sonogram based on the visualType element.
        if (this.visualType.elements["radio"].value == 'frequency bars'){

//          Clear the previous "picture" on the visualizer.
            this.VisualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

//          Copies the FFT data into dataArrayForCanvas
            this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

//          Sets the bar width according to the current visualizer size.
            var barWidth = (this.canvasWidth / this.bufferLength * 2.5);

//          For each in the length of half the FFT bins.
            for (var i = 0; i < this.bufferLength; i++) {

//              To get a float based on the frequency so we can later use it to determine color.
                this.color = i / this.analyser.frequencyBinCount * 1000;
//              the x is used to determine where in the visualizer is according to the bar width and index of the FFT data.
                this.x = i + (i * barWidth);
//              The height of the bar is the value of the dataArrayForCanvas.
                var barHeight = this.dataArrayForCanvas[i];

//              Choose fill style based on the previous float.
                this.VisualizerCtx.fillStyle = 'hsl(' + this.color + ',60%,60%)';
//              Draw the Bar
                this.VisualizerCtx.fillRect(this.x, this.canvasHeight - barHeight, barWidth, barHeight);

            }

        }
        else if (this.visualType.elements["radio"].value == 'sine wave') {

//          Clear the previous "picture" on the visualizer.
            this.VisualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

//          Declare we want to start planning our stroke.
            this.VisualizerCtx.beginPath();
//          Set the thickness of our stroke.
            this.VisualizerCtx.lineWidth = 2;
//          Move to the value of the first value in the temporaryArrayForAutoCorrelation.
            this.VisualizerCtx.moveTo(0,this.temporaryArrayForAutoCorrelation[0]);

//          for each in the visualizer width
            for (var j=0; j<this.canvasWidth; j++) {

//              Set the stroke color to black.
                this.VisualizerCtx.strokeStyle = 'black';

//              Draw a point of the line at a point on the visualizer proportionate to the visualizer size/( FFT bins / 2 ) * the current
//              index in the timedomain data.
                this.x = j * (this.canvasWidth / this.bufferLength);

//              Plan a point on the visualizer.
                this.VisualizerCtx.lineTo(this.x,this.canvasHeight/2+(this.temporaryArrayForAutoCorrelation[j]*this.canvasHeight/2));

            }
//          Draw the planned visualizer.
            this.VisualizerCtx.stroke();




        }

        else if (this.visualType.elements["radio"].value == 'sonogram') {

//          Copies the FFT data into dataArrayForCanvas
            this.analyser.getByteFrequencyData( this.dataArrayForCanvas );

//          The size of a point in the sonogram is equal to the visualizer height / ( FFT bins / 2 )
            var size = this.canvasHeight / this.bufferLength * 5;

//          For each in the length of half the FFT bins.
            for (j = 0; j < this.dataArrayForCanvas.length; j++) {

//                  Float for determining the intensity of the color.
                    this.color = this.dataArrayForCanvas[j] / 256.0;
//                  Set the fill style the intensity of the colorscale according to the float.
                    this.VisualizerCtx.fillStyle = this.sonogramColorScale(this.color);
//                  Draw a point in the sonogram.
                    this.VisualizerCtx.fillRect(this.x * size, this.canvasHeight - j, size, size);

                }
//          Add 1 to x each time so that it wont paint at the same x-coordinates.
            this.x ++;

//          Once it reaches the end of the visualizer set x=0 and clear the visualizer, so that it can continue to display the data.
            if (this.x >= this.canvasWidth/size) {
                this.x = 0;
                this.VisualizerCtx.clearRect(0,0, this.canvasWidth, this.canvasHeight);

            }

            }
//      When the 0.5 seconds have passed since the current time was equal to when we last saved the time we send the
//      time domain data to our biased auto correlation function.

        if ((audioCtx.currentTime - this.frequencyUpdateTimer) >= 0.3) {

           this.frequency = this.autoCorrelation();
           this.frequencyUpdateTimer = audioCtx.currentTime;
           this.dataArrayForAutoCorrelation = [];

        }
//      Otherwise add the current time domain data to a temporary array so that we can delay the analysis.
        else {

            this.dataArrayForAutoCorrelation = new Float32Array( this.temporaryArrayForAutoCorrelation, this.dataArrayForAutoCorrelation )

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






window.audioContext = new (window.AudioContext || window.webkitAudioContext)();

function Metronome() {
    //Variable for the start-stop button.
    this.metronomePlaying = false;

    //Current swing.
    this.barSwingCount = 0;
    //Direction of current swing.
    this.barDirections = [20, -20];

    //No swing on the first beep.
    this.firstbeat = true;
    //Length of beep.
    this.noteLength = 0.05;
    //For scheduling next beep.
    this.nextNoteTime = 0;
    //So we can keep track of every 16th note.
    this.beatNumber = 0;

    //Our analyser to connect the sound of the oscillator to the user.
    this.analyser = window.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    //Input Elements
    this.startStop = document.getElementById('start-stop');
    this.bpm = document.getElementById('bpm');
    this.resolution = document.getElementById('resolution');
}

Metronome.prototype.nextNote = function() {


    var beatsPerMinute = this.bpm.value;

    //Not to high or low beats per minute as to break the script.
    if (beatsPerMinute <20) {

        beatsPerMinute = 20;

    } else if (beatsPerMinute > 240) {

        beatsPerMinute = 240

    }
    //Convert to beats per second.
    this.beatsPerSecond = 60 / beatsPerMinute ;

    //Queue next note.
    this.nextNoteTime += 0.25 * this.beatsPerSecond;

    //The interval between beeps.
    this.nextResolutionLength = 0.2 + (this.beatsPerSecond * 0.25);

    //reset to zero after 16th beat.
    if (this.beatNumber == 16) {

        this.beatNumber = 0;

    }
    //Another beat happened.
    this.beatNumber ++;


};

Metronome.prototype.correct16thOfNote = function () {

    //Returns 'incorrect' if the beat numbers are not played in the corresponding resolution.
    if ( (this.resolution.options[this.resolution.selectedIndex].value==2) && (this.beatNumber%2))
    return 'incorrect';

    if ( (this.resolution.options[this.resolution.selectedIndex].value==3) && (this.beatNumber%4))
    return 'incorrect';

    if ( (this.resolution.options[this.resolution.selectedIndex].value==4) && (this.beatNumber%8))
    return 'incorrect';


};

Metronome.prototype.playNote = function () {

    //If incorrect beat number, do nothing.
    if (this.correct16thOfNote() == 'incorrect') {
        return;
    }
    //Creates our oscillator.
    var oscillator = window.audioContext.createOscillator();

    //Connecting sound to the user.
    this.analyser.connect(window.audioContext.destination);

    //Different accent depending on beat number.
    if (this.beatNumber % 16 == 0) {

        oscillator.frequency.value = 1200.0;

    }
    else if (this.beatNumber % 4 == 0){

        oscillator.frequency.value = 880.0;
    }
    else {

        oscillator.frequency.value = 600.0;
    }

    //Start on schedule and stop after the note length.
    oscillator.start(this.nextNoteTime);
    oscillator.stop(this.nextNoteTime + this.noteLength);

};

Metronome.prototype.draw = function () {

    //If incorrect beat number, do nothing.
    if (this.correct16thOfNote() == 'incorrect') {
        return;
    }

    //Css animation to rotate the bar in the current swing direction under the interval between notes.
    move('#bar')
        .rotate(this.barDirections[this.barSwingCount % 2])
        .duration(String(this.nextResolutionLength) + 's')
        .end();

    // Increase the swing count;
    this.barSwingCount ++;
};

Metronome.prototype.noteScheduler = function() {
    //When the next note time is less than the current time + 10 ms, schedule another
    while ( this.nextNoteTime < window.audioContext.currentTime + 0.1){

        //Play note.
        this.playNote();

        //Plan next note.
        this.nextNote();

        // If this is the first beat, do nothing. Otherwise draw.
        if (this.firstbeat) {

            this.firstbeat = false;

        } else {

            this.draw();

        }

    }

};

Metronome.prototype.play = function() {

    //Call the note scheduler every 25 ms.
    this.interval = window.setInterval(this.noteScheduler.bind(this), 25);
    //Change the text of the start-stop button to signal the user it is now a stop button.
    this.startStop.innerHTML = 'Stop';

};

Metronome.prototype.stop =  function () {

    //Clear the repeating interval.
    window.clearInterval(this.interval);
    //Return to original position.
    move('#bar').rotate(0).ease('in').duration('0.25s').end();
    //Change the text of the start-stop button to signal the user it is now a stop button.
    this.startStop.innerHTML = 'Start';

};

Metronome.prototype.toggle = function () {

    console.log("Metronome is playing!?", this.metronomePlaying);
    //Calling the stop or play function according to if metronome is playing or not.
    (this.metronomePlaying ? this.stop() : this.play());
    //Invert the boolean, i.e if it is true, make it false and vice versa.
    this.metronomePlaying = !this.metronomePlaying;
};

var run = new Metronome();


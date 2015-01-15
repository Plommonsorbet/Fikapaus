/**
* Created by Plommonsorbet on 2014-12-29.
*/





var alphabet = 'abcdefghijklmonpqrstuvwxyz';
var logo = 'Fikapaus';
var letter = 0; //letter is a bad name for a counter
var times = 0;
var text = document.getElementById("logo-text");
function textShuffle () {
    var animation = window.setInterval(animate, 15)


}



animate = function () {
        times ++;
        var randomInt = Math.floor(Math.random() * 25);



        if (times <9) {
            text.innerHTML = logo.slice(0, letter)+ alphabet[randomInt];
        }
        else if (times == 10) {
            if (letter == 7){    //change 7 to length of logo
                text.innerHTML = logo;


            }
            else {
                times = 0;
                letter ++;
                text.innerHTML = logo.slice(0, letter)+ alphabet[randomInt];
            }

        }

};

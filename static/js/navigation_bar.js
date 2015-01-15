
var isStatic=true;
var navBar = document.getElementById("nav-bar");
console.log(navBar);
var wrapper = document.getElementById("wrapper");
window.onscroll = scrolled;




function scrolled() {

    if ((wrapper.offsetTop <  window.scrollY) && (isStatic)){

        navBar.classList.add('fixed');

        isStatic = !isStatic;
    }

    else if ((wrapper.offsetTop >  window.scrollY) && (!isStatic)){
        navBar.classList.remove('fixed');
        isStatic = !isStatic;
    }



}

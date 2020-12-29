# Fikapaus

I wrote this 2015 during my final year of highschool as my final project to graduate. It's a browser based violin tuner and metronome.

Javascript, browsers and especially audio inside browsers was very much in flux and volatile and there was a lack of good libraries for a lot of things. So
for this project I had to write a lot of the tools from scratch.

For example I had to implement a FFT algorithm in javascript, had to use the canvas directly as opposed to a graphing libraries like you would if you were building this today.

# Setup
```
nix-shell --pure -p python27 python27Packages.flask

python views.py

```

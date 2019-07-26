# magenta-clientside

This is where I play with Magenta models for generating music.
You can try a demo at https://demos.nephometrics.com

Click on the microphone icon to start recording sounds. Whistling works well.
Your browser should ask your for permission to use the microphone. Whistle
(or record some other sound), then click on the microphone again to stop recording.
The application will stop recording by itself after 10 seconds.

The page will take a few seconds to transcribe your sounds to midi,then you can
play them. After that, you can use the "Compose" button (with the note on it)
to ask the computer for a composition inspired by your input. You can select
a style via the radio buttons. The output is nondeterministic, so you may want to try
several times.

The composer will pre-process your inputs and the result of that is also shown. It
tends to be a little easier on the ears than the midi from the original, though maybe
that is just my bad whistling.

Note that most of the heavy lifting is done in the browser, hence the long load time.
There's some background and possible alternatives here: https://www.nephometrics.ch/2019/06/serving-magenta/,
I just haven't got around to implementing them yet.

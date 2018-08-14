let audio = new AudioContext();
let soundCache = {};

export default function sound(url)
{
	if(soundCache[url]) {
		return soundCache[url];
	}
	
	return soundCache[url] = new Sound(url);
}

class Sound
{
	constructor(url)
	{
		let xhr = new XMLHttpRequest();
		
		xhr.responseType = "arraybuffer";
		xhr.open("get", url);
		
		this.ready = new Promise(res => {
			xhr.onload = () => {
				audio.decodeAudioData(xhr.response, buffer => {
					this.buffer = buffer;
					res();
				});
			};
		});
		
		xhr.send();
	}
	
	play()
	{
		return new Play(this).start();
	}
}

class Play
{
	constructor(sound, loop)
	{
		this.sound = sound;
		this.src = audio.createBufferSource();
		this.src.connect(audio.destination);
	}
	
	start()
	{
		this.sound.ready.then(() => {
			this.src.buffer = this.sound.buffer;
			this.src.start(0)
		});
		
		return this;
	}
	
	stop()
	{
		this.sound.ready.then(() => this.src.stop());
		
		return this;
	}
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

SlitScan = function () {

	console.log('SlitScan')

	var lastDrawTime = 0

	var video = document.createElement('video'),
		canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		bufferCanvas = document.createElement('canvas'),
		buffCtx = bufferCanvas.getContext('2d'),
		frames = [],
		_camera = '',
		videoPreviousTime = -1

	var options = {
		video: video,
		canvas: canvas,
		get camera(){ return _camera },
		set camera(value){
			_camera = value
			navigator.mediaDevices.enumerateDevices().then(function(info) {
				info.map(function(device){
					if(device.label === value){
						initCamera(device.deviceId)
					}
				})
			})
		},
		slices: 70,
		mode: 'vertical',
	}

	document.body.appendChild(video)
	document.body.appendChild(canvas)

	canvas.id = 'slit-scan'
	bufferCanvas.id = 'buffer'

	//add stats
	// stats = new Stats()
	// document.body.appendChild(stats.domElement)
	// stats.domElement.id = "stats"
	// stats.domElement.style.position = 'absolute'
	// stats.domElement.style.top = '0'
	// stats.domElement.style.left = '0'

	video.addEventListener('play', function () {
		update()
	})

	video.addEventListener('loadedmetadata', function(){
		onResize()
	})

	function onResize(){
		video.style.display = 'block'

		// scale this down to max dimension of 1280
		var scale = 1280 / Math.max(video.videoWidth, video.videoHeight)
		var w = video.videoWidth * scale
		var h = video.videoHeight * scale

		//canvas is same size as incoming video
		canvas.width = w
		canvas.height = h
		bufferCanvas.width = w
		bufferCanvas.height = h
		video.style.display = 'none'
	}
	window.addEventListener('resize', onResize)

	if(navigator.getUserMedia){

	}else{
		video.src = './dance.mp4'
		video.play()
	}

	function initCamera(cameraID){
		console.log('initCamera', cameraID)
		canvas.classList.add('mirror')
		var constraints = {
			video: {
				mandatory: {
					sourceId: cameraID
				},
				optional: [
					{ minWidth: 1280 },
					{ minHeight: 720 },
					{ minFrameRate: 60 }
				]
			},
			audio: false
		}
		navigator.getUserMedia(constraints, function (localMediaStream) {
			console.log('localMediaStream', localMediaStream)
			video.src = window.URL.createObjectURL(localMediaStream)
			setTimeout(function(){
				video.play()
			}, 500)
		}, function (e) {
			if (e.code === 1) {
				console.log('User declined permissions.', e)
			}
		})
	}

	var update = function(){
		// console.log(video.currentTime)
		if(video.currentTime !== videoPreviousTime){
			draw()
		}
		videoPreviousTime = video.currentTime

		// stats.update()
		requestAnimationFrame(update)
	}

	function drawVert() {

		var sliceHeight = canvas.height / options.slices

		// save current frame to array
		buffCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, bufferCanvas.width, bufferCanvas.height)
		frames.push(buffCtx.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height))

		// draw slices to canvas
		var i = options.slices
		while (i--) {
			try {
				ctx.putImageData(frames[i], 0, 0, 0, sliceHeight * i, bufferCanvas.width, sliceHeight)
			} catch (e) {
			}
		}
	}

	function drawHorz() {

		var sliceWidth = canvas.width / options.slices

		// save current frame to array
		buffCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, bufferCanvas.width, bufferCanvas.height)
		frames.push(buffCtx.getImageData(0, 0, bufferCanvas.width, bufferCanvas.height))

		// draw slices to canvas
		var i = options.slices
		while (i--) {
			try {
				ctx.putImageData(frames[i], 0, 0, sliceWidth * i, 0, sliceWidth, bufferCanvas.height)
			} catch (e) {
			}
		}
	}

	var drawMethods = {
		vertical: drawVert,
		horizontal: drawHorz
	}
	
	var draw = function () {

		if (video.paused) return
	
		drawMethods[options.mode]()

		while (frames.length > options.slices){
			frames.shift()
		}
	}

	return options
}
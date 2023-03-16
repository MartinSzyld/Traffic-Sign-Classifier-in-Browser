var canvas, ctx, classifyButton, clearButton, bigImage, copyImageButton;
const state = {
	mousedown: false
  };  
var pos = {x:0, y:0};
// rawImage will hold the content of canvas
var rawImage;
var model;
var color = 'red';

const CATEGORIES = 
["Red Speed 20", "Red Speed 30", "Red Speed 50", "Red Speed 60", "Red Speed 70", "Red Speed 80", "Gray Speed 80", "Red Speed 100", "Red Speed 120", 
	"Red Two Cars", "Red Truck and Car", "Blackie", "Yellow Danger", "Yield", "Stop", "Red Circle", "Red Truck", "Wrong Way", 
	"Red Danger (!)", "Red Danger Left", "Red Danger Right", "Red Danger Zigzag", "Red Danger Pothole", "Red Danger Slip", "Red Danger Narrow", "Red Danger Working", " danger lights", 
	"Red Danger Walking", "Red Danger Kids", "Red Danger Bike", "Red Danger Snow", "Red Danger Deer", "Gray Ending", "Blue Right", "Blue Left", "Blue Straight", 
	"Blue Straight Right", "Blue Straight Left", "Blue Right Down", "Blue Left Down", "Blue Roundabout", "Gray Two Cars", "Gray Truck and Car"];
const lineWidth = 10;
const shadowColor = '#333';
const shadowBlur = lineWidth / 4;

// copy a crop of bigImage to the canvas, depending on cursor position at event e
function crop_copy_image(e) {
	// image width = 867, it has 9 columns, 867/9 = 96 -->
	// that's why we do "e.offsetX - e.offsetX%96", and it's similar for offsetY
	ctx.drawImage(bigImage, e.offsetX - e.offsetX%96, e.offsetY - e.offsetY%100, 95, 95, 0, 0, 280, 280);
	rawImage.src = canvas.toDataURL('image/png');
  }

// aux function to upload image
// src: https://stackoverflow.com/questions/22087076/how-to-make-a-simple-image-upload-using-javascript-html
window.addEventListener('load', function() {
	document.querySelector('input[type="file"]').addEventListener('change', function() {
		if (this.files && this.files[0]) {
			var img = document.querySelector('#myImg');
			img.onload = () => {
				URL.revokeObjectURL(img.src);  // no longer needed, free memory
			}  
			img.src = URL.createObjectURL(this.files[0]); // set src to blob url
		}
	});
});

// copy the uploaded image to the canvas
function copy_uploaded_image() 
{
	var image = document.getElementById('myImg');
	ctx.drawImage(image, 0, 0, 280, 280);
	rawImage.src = canvas.toDataURL('image/png');
}

// functions for drawing in canvas, adapted from
// "HTML Canvas Drawing with Touch Support" @ CodePen
function handleWritingStart(event) {
	event.preventDefault();
	const radioButtons = document.querySelectorAll('input[name="color_radio"]');
	for (const radioButton of radioButtons) {
		if (radioButton.checked) {
			color = radioButton.value;
			break;
		}
	}
	const mousePos = getMousePositionOnCanvas(event);
	
	ctx.beginPath();
	ctx.moveTo(mousePos.x, mousePos.y); 
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = color; 
	ctx.fill();
	state.mousedown = true;
}

function handleWritingInProgress(event) {
	event.preventDefault();
	if (state.mousedown) {
	  const mousePos = getMousePositionOnCanvas(event);
	  ctx.lineTo(mousePos.x, mousePos.y);
	  ctx.stroke();
	}
}
  
function handleDrawingEnd(event) {
	event.preventDefault();
	if (state.mousedown) {
	  ctx.stroke();
	}
	state.mousedown = false;
	rawImage.src = canvas.toDataURL('image/png');
}

function getMousePositionOnCanvas(e) {
	var rect = canvas.getBoundingClientRect();
	const clientX = e.clientX || e.touches[0].clientX;
	const clientY = e.clientY || e.touches[0].clientY;
	pos.x = clientX - rect.left;
	pos.y = clientY - rect.top;
	return { x: pos.x, y: pos.y };
}

function clear() {
	ctx.fillStyle = "white";
	ctx.fillRect(0,0,280,280);
}

// predict the content in canvas (global var rawImage) using loaded model, adapted from
// src: https://www.coursera.org/learn/browser-based-models-tensorflow/home/week/2
function classify() {
	rawImage.src = canvas.toDataURL('image/png');
	var raw = tf.browser.fromPixels(rawImage,3);
	var resized = tf.image.resizeBilinear(raw, [30,30]);
	var tensor = resized.expandDims(0);
	var prediction = model.predict(tensor);
    var sign_number = tf.argMax(prediction, 1).dataSync();
	var sign_name = CATEGORIES[sign_number];
	var accuracy = prediction.dataSync()[sign_number].toFixed(3);
	// write prediction in DOM:
	document.getElementById("prediction").innerHTML =  `Predicting sign number ${sign_number} (${sign_name}), accuracy: ${accuracy}`;	
}

function init_script() {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext("2d");
	rawImage = new Image();
	
	classifyButton = document.getElementById('classify-button');
	clearButton = document.getElementById('clear-button');
	bigImage = document.getElementById('img-43-classes');
	copyImageButton = document.getElementById('copy_image');
	
	// Initialize canvas with white pixel from image
	// this avoids error message when trying to classify the empty canvas
	ctx.drawImage(bigImage, 0, 450, 1, 1, 0, 0, 280, 280);
	rawImage.src = canvas.toDataURL('image/png');

	canvas.addEventListener('mousedown', handleWritingStart);
	canvas.addEventListener('mousemove', handleWritingInProgress);
	canvas.addEventListener('mouseup', handleDrawingEnd);
	canvas.addEventListener('mouseout', handleDrawingEnd);
	
	canvas.addEventListener('touchstart', handleWritingStart);
	canvas.addEventListener('touchmove', handleWritingInProgress);
	canvas.addEventListener('touchend', handleDrawingEnd);

	classifyButton.addEventListener("click", classify);
	clearButton.addEventListener("click", clear);
	bigImage.addEventListener("click", crop_copy_image);
	copyImageButton.addEventListener("click", copy_uploaded_image);
}

async function load_model() {  
	model = await tf.loadLayersModel('tfjs-model-43/model.json');
	init_script();
}

document.addEventListener('DOMContentLoaded', load_model);
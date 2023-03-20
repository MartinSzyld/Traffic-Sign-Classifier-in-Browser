var body, canvas, ctx, canvas_answer, ctx_answer, classifyButton, clearButton, bigImage, bigAnswerImage, copyImageButton, colorInputCheckbox, colorPicker;
var shouldHideColorPicker = false;
const state = {
	mousedown: false
  };  
var pos = {x:0, y:0};
// rawImage will hold the content of canvas
var rawImage;
var model;
// Drawing color, marker color:
var colorAsArray = [255,0,0,1];
var rgbaColor = 'rgba(255,0,0,1)';

const CATEGORIES = 
["Red Speed 20", "Red Speed 30", "Red Speed 50", "Red Speed 60", "Red Speed 70", "Red Speed 80", "Gray Speed 80", "Red Speed 100", "Red Speed 120", 
	"Red Two Cars", "Red Truck and Car", "Blackie", "Yellow Danger", "Yield", "Stop", "Red Circle", "Red Truck", "Wrong Way", 
	"Red Danger (!)", "Red Danger Left", "Red Danger Right", "Red Danger Zigzag", "Red Danger Pothole", "Red Danger Slip", "Red Danger Narrow", "Red Danger Working", " danger lights", 
	"Red Danger Walking", "Red Danger Kids", "Red Danger Bike", "Red Danger Snow", "Red Danger Deer", "Gray Ending", "Blue Right", "Blue Left", "Blue Straight", 
	"Blue Straight Right", "Blue Straight Left", "Blue Right Down", "Blue Left Down", "Blue Roundabout", "Gray Two Cars", "Gray Truck and Car"];

// coordinates where to find each prediction in big answer image:
const STARTING_COORD = 
[ {x:8, y:0}, {x:112, y:0}, {x:218, y:0}, {x:322, y:0}, {x:426, y:0}, {x:529, y:0}, {x:430, y:565}, {x:635, y:0}, {x:740, y:0},
	{x:218, y:92}, {x:322, y:92}, {x:8, y:230}, {x:16, y:567}, {x:114, y:570}, {x:218, y:565}, {x:426, y:92}, {x:529, y:92}, {x:322, y:565},
	{x:112, y:230}, {x:218, y:230}, {x:322, y:230}, {x:426, y:230}, {x:529, y:230}, {x:635, y:230}, {x:740, y:230}, {x:61, y:312}, {x:165, y:312},
	{x:269, y:312}, {x:374, y:312}, {x:479, y:312}, {x:584, y:312}, {x:689, y:312}, {x:536, y:565}, {x:8, y:442}, {x:112, y:442}, {x:218, y:442},
	{x:322, y:442}, {x:426, y:442}, {x:529, y:442}, {x:635, y:442}, {x:740, y:442}, {x:640, y:565}, {x:742, y:567}
]

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

// predict the content in canvas (global var rawImage) using loaded model, adapted from
// src: https://www.coursera.org/learn/browser-based-models-tensorflow/home/week/2
function classify() {
	// console.log(rgbaColor);

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
	ctx_answer.drawImage(bigAnswerImage, STARTING_COORD[sign_number].x, STARTING_COORD[sign_number].y, 85, 85, 0, 0, 140, 140);
}



function init_script() {
	body = document.getElementById('big-div');

	canvas = document.getElementById('canvas');
	ctx = canvas.getContext("2d");
	rawImage = new Image();

	canvas_answer = document.getElementById('canvas_answer');
	ctx_answer = canvas_answer.getContext("2d");
	
	classifyButton = document.getElementById('classify-button');
	clearButton = document.getElementById('clear-button');
	bigImage = document.getElementById('img-43-classes');
	copyImageButton = document.getElementById('copy_image');
	
	colorInputCheckbox = document.getElementById('color-input');
	colorPicker = document.getElementById('color-picker');
	bigAnswerImage = document.getElementById('img-43-answers');
	
	colorInputCheckbox.addEventListener('click', dontHideColorPicker);
	colorPicker.addEventListener('click', dontHideColorPicker);
	body.addEventListener('click', hideColorPicker);


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

	// initialize marker with red:
	var mixed_color = mixTwoRgba([colorAsArray,[125, 125, 125, 0.5]]);
	colorLabel.style.background = `linear-gradient(${rgbaColor}, ${mixed_color}, ${rgbaColor})`;

	// Initialize canvas with white pixel from image
	// (this avoids error message when trying to classify the empty canvas)
	ctx.drawImage(bigImage, 0, 450, 1, 1, 0, 0, 280, 280);
	rawImage.src = canvas.toDataURL('image/png');
}

function mixTwoRgba (colors, range = 50) {
	let arr = [], i = 0
	for (let i = 0; i < 4; i++) {
	  let round = (i == 3) ? (x) => x : Math.round
	  arr[i] = round(
		(colors[0][i] + (
		  (colors[1][i] - colors[0][i]) * range / 100
		))
	  )
	}
	return `rgba(${arr})`
  }


async function load_model() {  
	model = await tf.loadLayersModel('tfjs-model-43/model.json');
	init_script();
}

document.addEventListener('DOMContentLoaded', load_model);


// functions for drawing in canvas, adapted from
// "HTML Canvas Drawing with Touch Support" @ CodePen
function handleWritingStart(event) {
	event.preventDefault();
	const mousePos = getMousePositionOnCanvas(event);
	
	ctx.beginPath();
	ctx.moveTo(mousePos.x, mousePos.y); 
	ctx.lineWidth = 10;
	ctx.strokeStyle = rgbaColor; 
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

// FROM HERE TO END OF DOCUMENT:
// COLOR PICKER
var colorBlock = document.getElementById('color-block');
var ctx1 = colorBlock.getContext('2d');
var width1 = colorBlock.width;
var height1 = colorBlock.height;

var colorStrip = document.getElementById('color-strip');
var ctx2 = colorStrip.getContext('2d');
var width2 = colorStrip.width;
var height2 = colorStrip.height;

var colorLabel = document.getElementById('color-label');

var x = 0;
var y = 0;
var drag = false;


ctx1.rect(0, 0, width1, height1);
fillGradient();

ctx2.rect(0, 0, width2, height2);
var grd1 = ctx2.createLinearGradient(0, 0, 0, height1);
grd1.addColorStop(0, 'rgba(255, 0, 0, 1)');
grd1.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
grd1.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
grd1.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
grd1.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
grd1.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
grd1.addColorStop(1, 'rgba(255, 0, 0, 1)');
ctx2.fillStyle = grd1;
ctx2.fill();

function dontHideColorPicker() {
	shouldHideColorPicker = false;
	setTimeout(function() {
		shouldHideColorPicker = true;
	}, 100);
}

function hideColorPicker(e) {
	setTimeout(function() {
		if (shouldHideColorPicker == true) {
			colorInputCheckbox.checked = false;
			console.log("hideColorPicker");
		}},50);
}

function click(e) {
  x = e.offsetX;
  y = e.offsetY;
  var imageData = ctx2.getImageData(x, y, 1, 1).data;
  rgbaColor = 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
  colorAsArray = [imageData[0],imageData[1],imageData[2],1];
  var mixed_color = mixTwoRgba([colorAsArray,[125, 125, 125, 0.5]]);
  colorLabel.style.background = `linear-gradient(${rgbaColor}, ${mixed_color}, ${rgbaColor})`;
  fillGradient();
}

function fillGradient() {
  ctx1.fillStyle = rgbaColor;
  ctx1.fillRect(0, 0, width1, height1);

  var grdWhite = ctx2.createLinearGradient(0, 0, width1, 0);
  grdWhite.addColorStop(0, 'rgba(255,255,255,1)');
  grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
  ctx1.fillStyle = grdWhite;
  ctx1.fillRect(0, 0, width1, height1);

  var grdBlack = ctx2.createLinearGradient(0, 0, 0, height1);
  grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
  grdBlack.addColorStop(1, 'rgba(0,0,0,1)');
  ctx1.fillStyle = grdBlack;
  ctx1.fillRect(0, 0, width1, height1);
}

function mousedown(e) {
  drag = true;
  changeColor(e);
}

function mousemove(e) {
  if (drag) {
    changeColor(e);
  }
}

function mouseup(e) {
  drag = false;
}

function changeColor(e) {
  x = e.offsetX;
  y = e.offsetY;
  var imageData = ctx1.getImageData(x, y, 1, 1).data;
  rgbaColor = 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
  colorAsArray = [imageData[0],imageData[1],imageData[2],1];
  var mixed_color = mixTwoRgba([colorAsArray,[125, 125, 125, 0.5]]);
  colorLabel.style.background = `linear-gradient(${rgbaColor}, ${mixed_color}, ${rgbaColor})`;
}

colorStrip.addEventListener("click", click, false);
colorBlock.addEventListener("mousedown", mousedown, false);
colorBlock.addEventListener("mouseup", mouseup, false);
colorBlock.addEventListener("mousemove", mousemove, false);

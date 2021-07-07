/*
MIT License

Copyright (c) 2021 nab622

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


// To get trace data from warnings and make errors fatal, set this to true
debug = false


warningCount = 0
errorCount = 0

// -------------------- MESSAGES --------------------
// -------------------- MESSAGES --------------------

function printWarning(message) {
	warningCount++

	console.log('Warning: ' + message)
	for(let i = 1; i < arguments.length; i++) {
		console.log('Warning ' + warningCount + ': ', arguments[i])
	}
	if(debug) {
		console.trace()
	}
}

function printError(message) {
	errorCount++

	console.log('Error: ' + message)
	for(let i = 1; i < arguments.length; i++) {
		console.log('Error ' + errorCount + ': ', arguments[i])
	}
	if(debug) {
		console.trace()
		throw arguments.length + pluralize(' Error', arguments.length) + ': ' + arguments.join(', ')
	}
}



// -------------------- VARIABLES --------------------
// -------------------- VARIABLES --------------------




// -------------------- COMPARISON --------------------
// -------------------- COMPARISON --------------------

function inputsAreIdentical() {
	// This function takes an 2+ arrays as arguments, and if they are identical, it returns true.
	// If anything does not match or an error is thrown, it will return false.

	if(arguments.length < 2) {
		printWarning('Need at least two inputs to compare, returning true')
		return true
	}

	// Check the type of each input
	for(let i = 1; i < arguments.length; i++) {
		if(typeof(arguments[0]) !== typeof(arguments[i])) return false
	}

	if(typeof(arguments[0]) === 'object') {
		if(Array.isArray(arguments[0])) {
			// Check the length of each array
			for(let i = 1; i < arguments.length; i++) {
				if(arguments[0].length != arguments[i].length) return false
			}
			// Now check the contents...
			for(let i = 1; i < arguments.length; i++) {
				for(let j = 0; j < arguments[0].length; j++) {
					if(typeof(arguments[0][j]) !== typeof(arguments[i][j])) return false
					if(typeof(arguments[0][j]) === 'object') {
						if(inputsAreIdentical(arguments[0][j], arguments[i][j]) === false) return false
					} else {
						if(arguments[0][j] !== arguments[i][j]) return false
					}
				}
			}
		} else {
			// Check the length of each object
			for(let i = 1; i < arguments.length; i++) {
				if(Object.keys(arguments[0]).length != Object.keys(arguments[i]).length) return false
			}
			// Now check the contents...
			for(let i = 1; i < arguments.length; i++) {
				for(key in arguments[0]) {
					if(!arguments[i].hasOwnProperty(key)) return false
					if(typeof(arguments[0][key]) !== typeof(arguments[i][key])) return false
					if(typeof(arguments[0][key]) === 'object') {
						if(inputsAreIdentical(arguments[0][key], arguments[i][key]) === false) return false
					} else {
						if(arguments[0][key] !== arguments[i][key]) return false
					}
				}
			}
		}
	} else {
		for(let i = 1; i < arguments.length; i++) {
			if(arguments[0] !== arguments[i]) return false
		}
	}

	return true
}



// -------------------- PAGE HASH --------------------
// -------------------- PAGE HASH --------------------

function getHashData() {
	let output = {}
	let hashData = decodeURI(window.location.hash.substr(1))

	hashData = hashData.split(';')
	for(let i = 0; i < hashData.length; i++) {
		if(hashData[i] == '') continue

		let temp1 = hashData[i].indexOf('=')
		let temp2 = hashData[i].indexOf(':')

		let varName = hashData[i].substring(0, temp1)
		let dataType = hashData[i].substring(temp1 + 1, temp2)
		let value = decodeURI(hashData[i].substring(temp2 + 1))

		switch(dataType) {
			case 'number':
				value = parseFloat(value)
				break
			case 'boolean':
				value = value.toLowerCase()
				if(value == '1' || value == 't' || value.search('true') >= 0) {
					value = true
				} else {
					value = false
				}
				break
			case 'object':
				value = JSON.parse(atob(value))
				break
			case 'string':
			default:
				break
		}
		output[varName] = value
	}

	return output
}

function setHashData(inputObject) {
	let hashData = getHashData()
	let output = ''

	// Add the new data to the hash data
	for(key in inputObject) {
		if(key == '' || typeof(key) == 'undefined') continue
		hashData[key] = inputObject[key]
	}

	for(key in hashData) {
		let dataType = typeof(hashData[key])
		switch(dataType) {
			case 'object':
				hashData[key] = btoa(JSON.stringify(hashData[key]))
				break
			case 'boolean':
				hashData[key] = ((hashData[key]) ? 1 : 0)
				break
		}
		output += key + '=' + dataType + ':' + encodeURI(hashData[key]) + ';'
	}

	window.location.hash = encodeURI(output)
}



// -------------------- MATH --------------------
// -------------------- MATH --------------------

function clamp(value, min, max) {
	// If min and max are backwards, swap them!
	if(min > max) [ min, max ] = [ max, min ]

	if(value < min) return min
	if(value > max) return max
	return value
}

function randFloatRange(min, max) {
	return Math.random() * (max - min) + min
}

function randIntRange(min, max) {
	return Math.round(Math.random() * (max - min) + min)
}



// -------------------- STRINGS --------------------
// -------------------- STRINGS --------------------

function pluralize(word, number) {
	if(number == 1) return word
	return word + 's'
}

function repeatText(inputText, repeats)
{
	if(typeof(inputText) !== 'string') {
		printError('inputText not a string', inputText)
		return inputText
	}
	let newText = ''
	for(let i = 0; i < repeats; i++)
	{
		newText = newText + inputText
	}
	return newText
}

function escapeSingleQuotes(inputString) {
	return inputString.replace("'", "\\\'")
}



// -------------------- OBJECTS --------------------
// -------------------- OBJECTS --------------------

function combineObjects() {
	let temp = {}
	for(let i = 0; i < arguments.length; i++) {
		if(typeof(arguments[i]) !== "object") {
			printWarning('Input is not an object', arguments[i])
			continue
		}
		temp = { ...temp, ...arguments[i] }
	}
	return temp
}

function findSortedIndex(inputArray, propertyToCheck, valueToCheck, caseSensitive = true) {
	// This function is used on an array of objects that are SORTED BY THE VALUE IN propertyToCheck,
	// to find the first instance of valueToCheck in propertyToCheck

	// THE ARRAY OF OBJECTS MUST MUST MUST BE SORTED BY propertyToCheck OR THIS WILL NOT WORK

	let min = 0
	let max = inputArray.length
	let mid = 0
	let test = ''

	if(!caseSensitive) valueToCheck = valueToCheck.toLowerCase()

	while(min < max && test != valueToCheck) {
		mid = Math.floor((min + max) / 2)
		test = inputArray[mid][propertyToCheck]
		if(!caseSensitive) test = test.toLowerCase()

		if(test < valueToCheck) {
			min = mid + 1
		} else {
			max = mid
		}
	}

	if(caseSensitive) {
		while(mid > 0 && inputArray[mid - 1][propertyToCheck] == propertyToCheck) {
			mid--
		}
	} else {
		while(mid > 0 && inputArray[mid - 1][propertyToCheck].toLowerCase() == propertyToCheck) {
			mid--
		}
	}

	if(test != valueToCheck) {
		printError('Could not find \'' + valueToCheck + '\' in property \'' + propertyToCheck +  '\' of array', inputArray)
		return false
	}
	return mid
}


// -------------------- ARRAYS --------------------
// -------------------- ARRAYS --------------------

function removeItemFromArray(inputArray, item, caseSensitive = true) {
	if(!caseSensitive) item = item.toLowerCase()

	for(let i = 0; i < inputArray.length; i++) {
		if((caseSensitive && item == inputArray[i]) || (!caseSensitive && (item == inputArray[i].toLowerCase()))) {
			inputArray.splice(i, 1)
			i--
		}
	}
}

function removeDuplicates(inputArray, caseSensitive = true) {
	let outputArray = []
	let match = false
	for(let i = 0; i < inputArray.length; i++) {
		match = false
		for(let j = 0; j < outputArray.length; j++) {
			if(i == j) continue
			if(!caseSensitive && typeof(inputArray[i]) === 'string' && typeof(outputArray[j]) === 'string') {
				if(inputArray[i].toLowerCase() === outputArray[j].toLowerCase()) {
					match = true
					break
				}
			} else {
				if(inputArray[i] === outputArray[j]) {
					match = true
					break
				}
			}
		}
		if(!match) outputArray.push(inputArray[i])
	}
	return outputArray
}

function joinArraysNoDuplicates() {
	let output = []

	if(arguments.length == 0)
	{
		printWarning('No input specified')
		return output
	}

	let match = false
	for(let i = 0; i < arguments.length; i++) {
		if(typeof(arguments[i]) !== 'object' || !Array.isArray(arguments[i])) {
			printWarning('Input \'' + i + '\' not an array', arguments[i])
			continue
		}

		for(let j = 0; j < arguments[i].length; j++) {
			match = false
			for(let k = 0; k < output.length; k++) {
				if(output[k] == arguments[i][j]) {
					match = true
					break
				}
			}
			if(!match) output.push(arguments[i][j])
		}
	}
	return output
}



// -------------------- COMPARATORS --------------------
// -------------------- COMPARATORS --------------------

function isObject(input) {
	if(typeof(input) == 'object') {
		if(Array.isArray(input)) return false
		return true
	}
	return false
}

function isEmpty(input) {
	if(!input || input === null || input === undefined) return true

	let temp = typeof(input)
	switch(temp) {
		case 'object':
			if(Array.isArray(input)) {
				if(input.length > 0) return false
			} else {
				for (key in input) {
					if (input.hasOwnProperty(key)) return false
				}
			}
			return true
			break
		case 'function':
			printWarning('I was passed a function as input', input)
			return false
			break
		case 'number':
			if(input == 0) return true
			break
		case 'string':
			if(input == '') return true
			break
		case 'boolean':
			if(!input) return true
			break
		default:
			printError('Unknown input type \'' + temp + '\'', input)
			break
	}
	return false
}

function isInArray(value, array) {
	if(!Array.isArray(array)) return false
	for(let i = 0; i < array.length; i++) {
		if(array[i] == value) {
			return true
		}
	}
	return false
}



// -------------------- CALLBACKS --------------------
// -------------------- CALLBACKS --------------------

function doNothing()
{
	//This is used to allow a callback to do nothing, without causing any errors
	return
}



// -------------------- ANIMATIONS --------------------
// -------------------- ANIMATIONS --------------------

// These are the default values given to all animated elements. They are overridden by individual animation settings
animationDefaults = {
	animation					:	null,		// This must refer to the animations object
	delay						:	0,			// Seconds
	duration					:	2,			// Seconds
	animationTiming				:	'ease',		// This is CSS transition-timing-function
	animationDirection			:	'forward',
	animationIterationCount		:	'1',
}

animations = {
	rotate	:	{
		description	:	'Rotate on the specified axis',
		x	:	{
			description	:	'Rotate on the X axis (Horizontal)',
			transform	:	'rotateX(<value1>deg)',		// Find a way to get the value into this...
		},
		y	:	{
			description	:	'Rotate on the Y axis (Vertical)',
			transform	:	'rotateY(<value1>deg)',
		},
		z	:	{
			description	:	'Rotate on the Z axis (Windmill)',
			transform	:	'rotateZ(<value1>deg)',
		},
	},
	translate	:	{
		description	:	'Move along the specified axis',
		x	:	'animationTranslateX',
		y	:	'animationTranslateY'
	}
}

function animateElement(animationObject) {
/*
	HERE IS A SAMPLE ANIMATION OBJECT
	{
		animation		:	''			// This must be a string containing the name of the animation (Used in the switch statement below)
		values			:	[]			// This array must contain all the values needed for the animation
		duration		:	<number>	// This value is optional. It is the time (In seconds) of the animation
		delay			:	<number>	// This value is optional. It is the time (In seconds) to delay before starting the animation
	}
*/
    let args = animationObject.values
    let animation = arguments[0].toString().toLowerCase()

	// Get the arguments in a usable format
    for(let i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

	switch(animation) {
		case 'rotatex':
			break
	}
}

function rotateX(args) {
	if(args.length < 1) {
		printError('Not enough values supplied to create animation')
		return {}
	}
	if(isNaN(args[0])) {
		printError('Value is not a number')
		return {}
	}
	return { transform	: 'rotateX(' + args.shift() + 'deg)' }
}

function rotateY(value) {
		return { transform	: 'rotateY(' + value + 'deg)' }
}

function rotateZ(value) {
		return { transform	: 'rotateZ(' + value + 'deg)' }
}



// -------------------- DOM ELEMENTS --------------------
// -------------------- DOM ELEMENTS --------------------

function addClassName(element, newClassName) {
	let temp = []
	if(element.className != '') {
		temp = element.className.split(' ')
	}
	let temp2 = []
	for(let i = 0; i < temp.length; i++) {
		if(temp[i] == newClassName) continue
		temp2.push(temp[i])
	}
	temp2.push(newClassName)
	element.className = temp2.join(' ')
}

function removeClassName(element, removeClassName) {
	let temp = []
	if(element.className != '') {
		temp = element.className.split(' ')
	}
	let temp2 = []
	for(let i = 0; i < temp.length; i++) {
		if(temp[i] == removeClassName) continue
		temp2.push(temp[i])
	}
	element.className = temp2.join(' ')
}

function getSelectIndex(inputSelect, defaultValue = 0) {
	// To be used on an HTML <select> element
	// inputSelect can either be the HTML element, or the ID of an element

	if(typeof(inputSelect) === 'string') inputSelect = document.getElementById(inputSelect)

	for(let i = 0; i < inputSelect.children.length; i++) {
		if(inputSelect.children[i].selected == true) {
			return i
		}
	}
	return defaultValue
}

function setSelectIndex(inputSelect, newIndex) {
	// To be used on an HTML <select> element
	// inputSelect can either be the HTML element, or the ID of an element

	if(typeof(inputSelect) === 'string') inputSelect = document.getElementById(inputSelect)

	if(inputSelect.children.length == 0) return

	// If the index supplied is out of bounds, it will be clamped
	clamp(newIndex, 0, inputSelect.children.length)

	inputSelect.children[newIndex].selected = true
}

function getSelectValue(inputSelect, defaultValue = '') {
	// To be used on an HTML <select> element
	// inputSelect can either be the HTML element, or the ID of an element

	if(typeof(inputSelect) === 'string') inputSelect = document.getElementById(inputSelect)

	for(let i = 0; i < inputSelect.children.length; i++) {
		if(inputSelect.children[i].selected == true) {
			return inputSelect.children[i].value
		}
	}
	return defaultValue
}

function setSelectValue(inputSelect, newValue, caseSensitive = true) {
	// To be used on an HTML <select> element
	// inputSelect can either be the HTML element, or the ID of an element

	if(typeof(inputSelect) === 'string') inputSelect = document.getElementById(inputSelect)
	if(!caseSensitive) newValue = newValue.toLowerCase()

	let pos = false

	// Iterate in reverse so we end up with the first occurrence of a match, not the last
	for(let i = inputSelect.children.length - 1; i >= 0; i--) {
		if(caseSensitive) {
			if(inputSelect.children[i].value == newValue) {
				pos = i
			}
		} else {
			if(inputSelect.children[i].value.toLowerCase() == newValue) {
				pos = i
			}
		}
		inputSelect.children[i].selected = false
	}

	if(pos !== false) inputSelect.children[pos].selected = true
}

function applyStyle(element, styleObject) {
	for(let styleKey in styleObject) {
		element.style[styleKey] = styleObject[styleKey]
	}
}

function createElement(inputValues) {
	let new_element = null
	if(inputValues) {
		if(!inputValues.hasOwnProperty('elementType') || inputValues.elementType == '') {
			printError('\'elementType\' not specified', inputValues)
			return
		}
		if(inputValues.hasOwnProperty('animations')) {
			if(Array.isArray(inputValues.animations)) {
				// 'animations' should be an array of objects coming in. We need to split this up so there is only
				// one animation per element, so every subsequent animation needs to move on to a child
				if(inputValues.animations.length > 0) {
					inputValues = { elementType : 'span', animations : inputValues.animations.shift(), children : [ inputValues ] }
				} else {
					delete inputValues.animations
				}
			} else {
				printError('\'animations\' value is not an array of objects', inputValues)
				delete inputValues.animations
			}
		}
		new_element = document.createElement(inputValues.elementType)

		for (var key in inputValues) {
			switch(key) {
				case 'elementType':
				case 'animations':
					continue
				case 'style':
					if(!isObject(inputValues[key])) {
						printError('\'style\' attribute is not an object', inputValues[key])
						continue
					}
					applyStyle(new_element, inputValues[key])
					break
				case 'text':
					let test = typeof(inputValues[key])
					if(test !== "string" && test !== "number") {
						printError('\'text\' is not a string:', inputValues[key])
						continue
					}
					if(inputValues.elementType == 'div') {
						let text_element = document.createElement('span')
						text_element.appendChild(document.createTextNode(inputValues[key].toString()))
						new_element.appendChild(text_element)
					}
					else
					{
						new_element.appendChild(document.createTextNode(inputValues[key].toString()))
					}
					break
				case 'children':
					if(!Array.isArray(inputValues[key])) {
						printError('\'children\' is not an array', inputValues[key])
						continue
					}
					for (let i = 0; i < inputValues[key].length; i++) {
						new_element.appendChild(createElement(inputValues[key][i]))
					}
					break
				default:
					new_element[key] = inputValues[key]
			}
		}
		if(inputValues.hasOwnProperty('animations')) {
			let delay = 0
			let duration = 0
			if(isObject(inputValues[animations])) {
				printError('\'animations\' attribute is not an object', inputValues[key])
				return
			}
			inputValues.animations = combineObjects(animationDefaults, inputValues.animations)
			if(inputValues.animations.animation !== null) {
				if(typeof(inputValues.animations.animation) === 'undefined') {
						printError('Invalid animation \'' + inputValues.animations.animation + '\'')
				} else {

					if(inputValues.animations.hasOwnProperty('delay')) {
						delay = inputValues.animations.delay
						delete inputValues.animations.delay
					}
					if(inputValues.animations.hasOwnProperty('duration')) {
						inputValues.animations.transitionDuration = inputValues.animations.duration + 's'
						delete inputValues.animations.duration
					}
					if(inputValues.animations.hasOwnProperty('animationTiming')) {
						inputValues.animations.transitionTimingFunction = inputValues.animations.animationTiming
						delete inputValues.animations.animationTiming
					}

					if(delay <= 0) {
						applyStyle(new_element, inputValues.animations)
					} else {
						// Need to make sure this object doesn't go away before the timeout runs
						let animationStyleObject = combineObjects(inputValues.animations)
						setTimeout(()=>{ applyStyle(new_element, animationStyleObject) }, delay * 1000)
					}
				}
			}
		}
	}

	return new_element
}

function clearElement(e) {
	for (let i = e.children.length - 1; i >= 0; i--)
	{
		let c = e.children[i]
		e.removeChild(c)
	}
}

function hslToRgb(h, s, l, o = 1) {
	// ALL inputs to this function should be between 0 and 1

	var r, g, b

	if (s == 0) {
		r = g = b = l	// achromatic
	} else {
		function hue2rgb(p, q, t) {
			if (t < 0) t += 1
			if (t > 1) t -= 1
			if (t < 1/6) return p + (q - p) * 6 * t
			if (t < 1/2) return q
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
			return p
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s
		var p = 2 * l - q

		r = hue2rgb(p, q, h + 1/3)
		g = hue2rgb(p, q, h)
		b = hue2rgb(p, q, h - 1/3)
	}

	r *= 255
	g *= 255
	b *= 255

	o = clamp(o, 0, 1)

	if(o == 1) return 'rgba(' + r + ',' + g + ',' + b + ',' + o + ')'
	return 'rgb(' + r + ',' + g + ',' + b + ')'
}




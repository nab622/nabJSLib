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




// -------------------- GLOBALS --------------------
// -------------------- GLOBALS --------------------

// To get trace data from warnings and make errors fatal, set this to true
debug = false

warningCount = 0
errorCount = 0

fileSizeDenominations = [ 'byt', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB' ]
fileSizeColors = [ '33B', '3BB', '3B3', 'BB3', 'B33', 'B3B', '999', 'FFF' ]



// -------------------- CSS --------------------
// -------------------- CSS --------------------

function getCSSVar(variableName) {
	// This is used to get CSS variable values from :root
	return getComputedStyle(document.querySelector(':root')).getPropertyValue('--' + variableName)
}

function changeCSSVar(variableName, newValue) {
	// This is used to set CSS variable values in :root
	document.querySelector(':root').style.setProperty('--' + variableName, newValue)
}



// -------------------- COLORS --------------------
// -------------------- COLORS --------------------

function interpolateHexColors(inputColor, changeColor, balance = 0.5) {
	inputColor = readColor(inputColor)
	changeColor = readColor(changeColor)
	balance = clamp(balance, 0, 1)

	let num1 = null
	let num2 = null
	let output = ''

	for(let i = 0; i < 8; i += 2) {
		num1 = null
		num2 = null
		if(inputColor.length >= i + 2) num1 = parseInt(inputColor.substring(i, i + 2), 16)
		if(changeColor.length >= i + 2) num2 = parseInt(changeColor.substring(i, i + 2), 16)

		if(num1 == null && num2 == null) {
			break
		} else if(num1 == null) {
			output += leadingString(num2.toString(16), 2, '0')
			continue
		} else if(num2 == null) {
			output += leadingString(num1.toString(16), 2, '0')
			continue
		}

		output += leadingString((Math.floor(num1 + ((num2 - num1) * balance))).toString(16), 2, '0')
	}

	return output
}

function interpolateHexColorInRange(min, max, value, color1, color2) {
	// This function is used to dynamically color an object based on it's value within a range
	// This is very useful for things like file sizes
	color1 = readColor(color1)
	color2 = readColor(color2)

	if(value < min) return color1
	if(value > max) return color2

	value = value - min
	max = max - min
	let multiplier = value / max

	let r1 = parseInt(color1.substring(0, 2), 16)
	let g1 = parseInt(color1.substring(2, 4), 16)
	let b1 = parseInt(color1.substring(4, 6), 16)
	let a1 = parseInt('FF', 16)
	if(color1.length == 8) a1 = parseInt(color1.substring(6, 8), 16)

	let r2 = parseInt(color2.substring(0, 2), 16)
	let g2 = parseInt(color2.substring(2, 4), 16)
	let b2 = parseInt(color2.substring(4, 6), 16)
	let a2 = parseInt('FF', 16)
	if(color2.length == 8) a2 = parseInt(color2.substring(6, 8), 16)

	let r3 = Math.floor(r1 + ((r2 - r1) * multiplier))
	let g3 = Math.floor(g1 + ((g2 - g1) * multiplier))
	let b3 = Math.floor(b1 + ((b2 - b1) * multiplier))
	let a3 = Math.floor(a1 + ((a2 - a1) * multiplier))

	return leadingString(r3.toString(16), 2, '0') + leadingString(g3.toString(16), 2, '0') + leadingString(b3.toString(16), 2, '0') + leadingString(a3.toString(16), 2, '0')
}

function readColor(color) {
	if(typeof(color) !== 'string') color = color.toString(16)
	color = color.toUpperCase()
	color = color.replace(/[^A-F0-9]/ig, '')

	if(color.length == 1) {
		return color.repeat(6)
	}

	if(color.length == 2) {
		return color[0].repeat(6) + color[1].repeat(2)
	}

	if(color.length == 3) {
		return color[0].repeat(2) + color[1].repeat(2) + color[2].repeat(2)
	}

	if(color.length == 4) {
		return color[0].repeat(2) + color[1].repeat(2) + color[2].repeat(2) + color[3].repeat(2)
	}

	if(color.length == 6) {
		return color
	}

	if(color.length == 8) {
		return color
	}

	console.log('Invalid color!', color)
	return 'F0F'
}



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



// -------------------- FILE SIZES --------------------
// -------------------- FILE SIZES --------------------

function reduceFileSize(size, betterColorSpectrum = true) {
	// size must be in BYTES

	let iterations = 0
	let divisionUnits = 1024
	while(size > divisionUnits && iterations < fileSizeDenominations.length) {
		if(betterColorSpectrum && iterations > 2) break		// We'll finish this down below
		size /= divisionUnits
		iterations += 1
	}

	size = Math.round(size * 1000) / 1000

	let denomination = fileSizeDenominations[iterations]

	let temp = size
	if(betterColorSpectrum && iterations > 2) {
		divisionUnits = 5
		while(temp > divisionUnits && iterations < fileSizeColors.length) {
			// If we're above the GiB range, change colors every 10
			temp /= divisionUnits
			iterations += 1
		}
	}


	let color1 = fileSizeColors[iterations]
	let color2 = fileSizeColors[iterations]
	if(iterations + 1 < fileSizeColors.length) {
		color2 = fileSizeColors[iterations + 1]
	}

	return { 'size' : size, 'denomination' : denomination, 'iterations' : iterations, 'color' : interpolateHexColorInRange(0, divisionUnits, temp, color1, color2) }
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

function pluralize(words, number) {
	// words must be an array of [ singular, plural ]
	if(number == 1) return words[0]
	return words[1]
}

function leadingString(number, spaces, spacerString = ' ') {
	// Akin to leadingSpaces or leadingZeroes. This is meant to align monospaced numbers by their decimal points

	output = number

	if(typeof(number) == String) {
		number = parseFloat(number)
	}
	number = number.toString()
	number = number.split('.')[0]

	return spacerString.repeat(spaces - number.length) + output
}

function tailingString(number, spaces, spacerString = ' ') {
	// Akin to tailingSpaces or tailingZeroes. This is meant to align monospaced numbers by their decimal points

	output = number

	if(typeof(number) == String) {
		number = parseFloat(number)
	}
	number = number.toString()
	number = number.split('.')
	if(number.length == 1) {
		return output + spacerString.repeat(spaces + 1)
	} else {
		number = number[1]
	}

	return output + spacerString.repeat(spaces - number.length)
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

function randomString(length, mask = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM') {
	let output = ''
	for(let i = 0; i < length; i++) {
		output = output + mask[Math.floor(Math.random() * mask.length)]
	}
	return output
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



// -------------------- FUN STUFF --------------------
// -------------------- FUN STUFF --------------------

function generateStarCanvasURL(canvasWidth, canvasHeight, starCount, starColor, starIntensityMin, starIntensityMax) {
	// There is a bug in Chrome that randomly causes the canvas to have a black background

	let starfield = document.createElement('canvas');
	if(starCount < 1) starCount = 1

	starfield.width = canvasWidth
	starfield.height = canvasHeight

	let ctx = starfield.getContext('2d')

	let starLocation = {}
	let gradient = {}
	for(let i = 0; i < starCount; i++) {
		starLocation = { 'x' : randFloatRange(2, starfield.width - 2), 'y' : randFloatRange(2, starfield.height - 2) }

		// Inner circle x, y, radius, outer circle x, y, radius
		gradient = ctx.createRadialGradient(starLocation.x, starLocation.y, starIntensityMin, starLocation.x, starLocation.y, randFloatRange(starIntensityMin, starIntensityMax));

		// Add the color stops
		gradient.addColorStop(0, '#' + starColor + 'AA')
		gradient.addColorStop(randFloatRange(starIntensityMin, starIntensityMax), '#' + starColor + '00');

		// Set the fill style and draw a rectangle
		ctx.fillStyle = gradient
		ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	}

	return starfield.toDataURL()
}

function renderStarscape(renderElement, starCount = 300, layers = 5, backgroundColor = '000', starColor = 'FFF', scrollLeftOrRight = 1, scrollUpOrDown = 0, scrollSpeed = 20) {
	let defaultStyle = { 'width' : '100%', 'height' : '100%', 'margin' : '0px' }
	let renderChild = createElement({ 'elementType' : 'div', 'style' : defaultStyle, 'children' : [] })

	let savedElements = []
	for (let i = renderElement.children.length - 1; i >= 0; i--)
	{
		let c = renderElement.children[i]
		savedElements.unshift(c)
		renderElement.removeChild(c)
	}

//	renderElement.style.position = 'relative'	// This causes issues with the parent element if it is the body element...
	renderElement.style.backgroundColor = '#' + backgroundColor

	defaultStyle.position = 'absolute'
	defaultStyle.padding = '0px'

	scrollSpeed = clamp(scrollSpeed, 1, 500)	// Prevent division by 0 below and restrict this to it's max value

	// Colors
	backgroundColor = readColor(backgroundColor)
	starColor = readColor(starColor)

	let starIntensityMin = 0.25
	let starIntensityMax = 0.85
	let starIntensityVariance = 0.1

	// Sizes
	let layerSizeMultiplier = 100
	let layerBaseSize = 5 * layerSizeMultiplier		// Do not change this or animations will look awful
	let canvasSizeXMax = 0
	let canvasSizeXMin = 0
	let canvasSizeYMax = 0
	let canvasSizeYMin = 0

	let starSizeMin = 0.5
	let starSizeMax = 1

	let gradientSizeMin = 1
	let gradientSizeMax = 10

	let animationName = ''

	let canvasSize = {}
	let starIntensity = starIntensityMax
	let layerMultiplier = 1
	let renderChildID = randomString(75)
	for(let currentLayer = 1; currentLayer <= layers; currentLayer++) {
		let newElement = { 'elementType' : 'div', 'style' : defaultStyle }
		newElement.style.zIndex = currentLayer * -1

		if(currentLayer == 1) newElement.id = renderChildID

		canvasSizeXMax = (layers - currentLayer + 1) * layerSizeMultiplier + layerBaseSize
		canvasSizeXMin = canvasSizeXMax
		canvasSizeYMax = (layers - currentLayer + 1) * layerSizeMultiplier + layerBaseSize
		canvasSizeYMin = canvasSizeYMax

		layerMultiplier = 1 / layers * currentLayer * 0.5 + 0.5
		animationName = randomString(50) + layers + currentLayer

		canvasSize = { 'x' : randFloatRange(canvasSizeXMin, canvasSizeXMax), 'y' : randFloatRange(canvasSizeYMin, canvasSizeYMax) }
		newElement.style.backgroundImage = 'url(' + generateStarCanvasURL(canvasSize.x, canvasSize.y, Math.floor(starCount / layers), starColor, starIntensity - starIntensityVariance, starIntensity + starIntensityVariance) + ')'
		newElement.style.animation = animationName + ' ' + 500 / scrollSpeed * layerMultiplier + 's linear infinite'
		newElement.style.top = '0px'
		newElement.style.left = '0px'

		starIntensity = clamp(((starIntensityMax - starIntensityMin) / layers * currentLayer) + starIntensityMin, starIntensityVariance + 0.001, 1 - starIntensityVariance - 0.001)
		renderElement.appendChild(createElement(newElement))

		if(scrollLeftOrRight != 0 || scrollUpOrDown != 0) {
			let horizontalScroll = '0%'
			let verticalScroll = '0%'
			if(scrollLeftOrRight < 0) {
				horizontalScroll = canvasSize.x + 'px'
			} else if(scrollLeftOrRight > 0) {
				horizontalScroll = '-' + canvasSize.x + 'px'
			}
			if(scrollUpOrDown < 0) {
				verticalScroll = canvasSize.y + 'px'
			} else if(scrollUpOrDown > 0) {
				verticalScroll = '-' + canvasSize.y + 'px'
			}
			renderElement.appendChild(createElement({ 'elementType' : 'style', 'text' : '@keyframes ' + animationName + ' {0% { background-position: 0px 0px; } 100% { background-position: ' + horizontalScroll + ' ' + verticalScroll + ' } }' }))
		}
	}

	for(let i = 0; i < savedElements.length; i++) {
		renderElement.appendChild(savedElements[i])
	}
}

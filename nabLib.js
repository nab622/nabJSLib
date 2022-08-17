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

	console.log('Invalid color: \'' + color + '\'')
	return 'F0F'
}



// -------------------- MESSAGES --------------------
// -------------------- MESSAGES --------------------

function printWarning(message) {
	warningCount++

//	console.log('Warning: ' + message)
	for(let i = 1; i < arguments.length; i++) {
		console.log('Warning ' + warningCount + ': ' + message, arguments[i])
	}
	if(debug) {
		console.trace()
	}
}

function printError(message) {
	errorCount++

//	console.log('Error: ' + message)
	for(let i = 1; i < arguments.length; i++) {
		console.log('Error ' + errorCount + ': ' + message, arguments[i])
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

function ucwords(inputString) {
	// This function makes the first letter of every word uppercase

	let temp = inputString.split(' ')
	for(let i = 0; i < temp.length; i++) {
		temp[i] = temp[i].charAt(0).toUpperCase() + temp[i].substring(1)
	}
	return temp.join(' ')
}

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

	if(spaces - number.length < 1) return output.toString()

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



// -------------------- STARSCAPE --------------------
// -------------------- STARSCAPE --------------------

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
 		starLocation = { 'x' : randFloatRange(0, starfield.width), 'y' : randFloatRange(0, starfield.height) }

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



// -------------------- SUPERTEXT MARKUP --------------------
// -------------------- SUPERTEXT MARKUP --------------------

superTextMarkupTags = [
	// Anything in the parameters object will be SuperImposed on the created element. Even elementType is okay to change
	// 'parameters' are automatically applied styles
	// 'variables' are things the user can set, like URL links and such, inside the declaring tag, like: "[url link='page.php']Link Text Here[/url]"
	// noText : true		means that even if the user put text in the tag, it will be ignored (Useful for things like images)
	// nest : true			means that everything contained within that tag will be a child
	// noClosingTag : true	means that the parser will not require a closing tag on this element. Uses are things like [br] or [hr]
	// noMarkup : true	means that the contents of this tag will not be parsed.		BE AWARE THIS IS BUGGED - If you use it on a nested element, it will terminate along with the parent!!
	// The following are global properties that can be used on any tag:
	//		fg			=	text color
	//		bg			=	background color
	//		font		=	Typeface
	//		size		=	Font size (Percent, range from 10-500%)
	//		nomarkup	= 	No other tags inside this tag will be parsed

	// All 'symbol' values correspond to characters in the 'WebHostingHub Glyphs' font. These are intended to be used in a text editor to represent each function.

	{ tag : 'b',
						description: 'Bold',
						symbol : '',
						parameters : { style : { fontWeight : 'bold' } }
	},
	{ tag : 'i',
						description: 'Italic',
						symbol : '',
						parameters : { style : { fontStyle : 'italic' } }
	},
	{ tag : 'u',
						description: 'Underline',
						symbol : '',
						parameters : { style : { textDecoration : 'underline' } }
	},
	{ tag : 's',
						description: 'Strikethrough',
						symbol : '',
						parameters : { style : { textDecoration : 'line-through' } }
	},
	{ tag : 'br',
						description: 'Line break',
						symbol : '',
						noClosingTag : true,
						noText : true,
						parameters : { elementType : 'br' }
	},
	{ tag : 'hr',
						description: 'Horizontal Line',
						symbol : '−',
						noClosingTag : true,
						noText : true,
						parameters : { elementType : 'hr' }, variables : { width : 'width' }
	},
	{ tag : 'url',
						description: 'Hyperlink',
						symbol : '',
						nest : true,
						variables : { href : 'link' },
						parameters : { elementType : 'a' }
	},
	{ tag : 'img',
						description: 'Image',
						symbol : '⊷ ',
						noText : true,
						variables : { src : 'src' },
						parameters : { elementType : 'img' }
	},
	{ tag : 'c',
						description: 'Block text and center align',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { width: '100%', textAlign : 'center', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'l',
						description: 'Block text and left align',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { width: '100%', textAlign : 'left', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'r',
						description: 'Block text and right align',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { width: '100%', textAlign : 'right', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'j',
						description: 'Block text and justify',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { width: '100%', textAlign : 'justify', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'h1',		description: 'Heading 1',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { fontSize : '3em', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'h2',
						description: 'Heading 2',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { fontSize : '2.66em', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'h3',
						description: 'Heading 3',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { fontSize : '2.33em', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'h4',
						description: 'Heading 4',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { fontSize : '2em', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'h5',
						description: 'Heading 5',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { fontSize : '1.75em', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'h6',
						description: 'Heading 6',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { fontSize : '1.5em', marginTop : '0px', marginBottom : '0px' } },
	},
	{ tag : 'ol',
						description: 'Ordered list',
						symbol : '',
						nest : true,
						parameters : { elementType : 'ol' }
	},
	{ tag : 'ul',
						description: 'Unordered list',
						symbol : '',
						nest : true,
						parameters : { elementType : 'ul' }
	},
	{ tag : 'li',
						description: 'List item',
						symbol : '',
						nest : true,
						parameters : { elementType : 'li' }
	},
	{ tag : 'sub',
						description: 'Subscript',
						symbol : '',
						nest : true,
						parameters : { style : { verticalAlign : 'sub', fontSize : '0.75em' } }
	},
	{ tag : 'sup',
						description: 'Superscript',
						symbol : '',
						nest : true,
						parameters : { style : { verticalAlign : 'super', fontSize : '0.75em' } }
	},
	{ tag : 'color',
						description: 'Text/background color',
						symbol : '',
	},
	{ tag : 'font',
						description: 'Switch typeface',
						symbol : '',
	},
	{ tag : 'size',
						description: 'Font size (Percent, 10 to 500)',
						symbol : '',
	},
	{ tag : 'code',
						description: 'Code snippet, no markup',
						symbol : '',
						noMarkup : true,
						parameters : { elementType : 'pre', style : { textAlign : 'left', fontFamily : '"nabfonts monospace", monospace', whiteSpace : 'break-spaces', backgroundColor : '#222', backgroundImage : 'linear-gradient(45deg, #7770 0%, #7770 49%, #7771 48.1%, #7771 51.9%, #7770 52%, #7770 100%)', backgroundRepeat : 'repeat', backgroundPosition: 'center', backgroundSize : '6px 6px', padding : '0.2em', border : '2px inset #333' } }
	},
	{ tag : 'quote',
						description: 'Quote, include markup',
						symbol : '',
						nest : true,
						parameters : { elementType : 'p', style : { textAlign : 'justify', backgroundColor : '#292929', backgroundImage : 'linear-gradient(135deg, #7770 0%, #7770 49%, #7771 48.1%, #7771 51.9%, #7770 52%, #7770 100%)', backgroundRepeat : 'repeat', backgroundPosition: 'center', backgroundSize : '6px 6px', padding : '0.2em', border : '2px inset #393939' } }
	},
	{ tag : 'nomarkup',
						description: 'Ignore markup',
						symbol : '',
						noMarkup : true
	},
]

// Tags really should be forced to lower case for efficiency down below
for(let i = 0; i < superTextMarkupTags.length; i++) { superTextMarkupTags[i].tag = superTextMarkupTags[i].tag.toLowerCase() }
// This array *MUST* be sorted and then reversed, or tags can get mismatched!
superTextMarkupTags.sort((a, b)=>{
	if (a.tag < b.tag) return -1
	if (a.tag > b.tag) return 1
	return 0
}).reverse()

smileyFaces = [
	// All 'replacement' values are done in superTextMarkup. The resulting text from this process is destined for that next.
	{ text : '[:)]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Smile' },
	{ text : '[;)]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Wink' },
	{ text : '[:D]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Grin' },
	{ text : '[XD]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Eyes closed grin' },
	{ text : '[>:D]',			font : 'webhostinghub glyphs',		color : 'a00',		character : '',		description : 'Evil grin' },
	{ text : '[:P]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Stick tongue out' },
	{ text : '[;P]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Wink with tongue out' },
	{ text : '[XP]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Eyes closed tongue out' },
	{ text : '[:(]',			font : 'webhostinghub glyphs',		color : 'bb5',		character : '',		description : 'Frown' },
	{ text : '[X(]',			font : 'webhostinghub glyphs',		color : 'bb5',		character : '',		description : 'Eyes closed frown' },
	{ text : '[o.0]',			font : 'webhostinghub glyphs',		color : 'ff0',		character : '',		description : 'Surprised or confused' },
	{ text : '[:\'(]',			font : 'webhostinghub glyphs',		color : '3bf',		character : '',		description : 'Crying' },
	{ text : '[zzz]',			font : 'webhostinghub glyphs',		color : '9cf',		character : '',		description : 'Sleeping' },
	{ text : '[<3]',			font : 'webhostinghub glyphs',		color : 'f00',		character : '',		description : 'Heart' },
//	{ text : '[trollface]',		font : 'memetica',					color : 'fff',		character : 'T',	size : '200',		description : 'Trollface' },
]

function addSmileyFaces(inputText) {
	let fontList = []

	for(let i = 0; i < smileyFaces.length; i++) {
		if(smileyFaces[i].hasOwnProperty('font')) fontList = joinArraysNoDuplicates(fontList, [ smileyFaces[i].font.toLowerCase() ])
	}

	for(let i = 0; i < fontList.length; i++) {
		if(getFontIndex(fontList[i]) === false) {
			// getFontIndex() will print an error if the font is not found
			fontList.splice(i, 1)
			i--
		}
	}

	if(fontList.length == 0) return inputText		// Terminate if no fonts are present

	for(let i = 0; i < smileyFaces.length; i++) {
		if(!fontList.includes(smileyFaces[i].font)) {
			printWarning('Missing font: ' + smileyFaces[i].font)
			continue
		}

		let formatting = []
		if(smileyFaces[i].hasOwnProperty('font')) formatting.push('font="' + smileyFaces[i].font + '"')
		if(smileyFaces[i].hasOwnProperty('color')) formatting.push('fg=' + smileyFaces[i].color)
		if(smileyFaces[i].hasOwnProperty('size')) formatting.push('size=' + smileyFaces[i].size)

		while(inputText.indexOf(smileyFaces[i].text) >= 0) {
			inputText = inputText.replace(smileyFaces[i].text, '[font ' + formatting.join(' ') + ']' + smileyFaces[i].character + '[/font]')
		}
	}

	return inputText
}

function generateSuperTextElement(inputText, preprocessorInfo) {
	let output = { elementType : 'span', text : inputText, style : {} }
	let noMarkup = false

	let parameters = []
	if(preprocessorInfo.hasOwnProperty('markup')) {
		parameters = preprocessorInfo.markup.slice(0)
	}

	if(preprocessorInfo.hasOwnProperty('children')) {
		output.children = preprocessorInfo.children.slice(0)
		output.text = ''	// Not sure about this..?
	}

	let variables = []
	for(let i = 0; i < parameters.length; i++) {
		if(parameters[i].hasOwnProperty('variables')) {
			variables = parameters[i].variables
		} else {
			variables = []
		}
		for(let h = 0; h < superTextMarkupTags.length; h++) {
			if(superTextMarkupTags[h].tag == parameters[i].tag) {
				if(superTextMarkupTags[h].hasOwnProperty('noText') && superTextMarkupTags[h].noText === true) {
					output.text = ''
				}

				if(noMarkup == false) {
					if(superTextMarkupTags[h].hasOwnProperty('parameters')) {
						for(parameter in superTextMarkupTags[h].parameters) {
							if(parameter.toLowerCase() == 'style') {
								// Apply styles here without overwriting anything
								for(styleKey in superTextMarkupTags[h].parameters.style) {
									if(output.style.hasOwnProperty(styleKey)) {
										output.style[styleKey] += ' ' + superTextMarkupTags[h].parameters.style[styleKey]
									} else {
										output.style[styleKey] = superTextMarkupTags[h].parameters.style[styleKey]
									}
								}
							} else {
								output[parameter] = superTextMarkupTags[h].parameters[parameter]
							}
						}
					}
					if(superTextMarkupTags[h].hasOwnProperty('variables')) {
						for(variable in superTextMarkupTags[h].variables) {
							if(variables.hasOwnProperty(superTextMarkupTags[h].variables[variable])) {
								output[variable] = variables[superTextMarkupTags[h].variables[variable]]
								if(superTextMarkupTags[h].tag == 'url' && variable == 'href' && output[variable].toLowerCase().substr(0, 4) == 'http') {
									// External link! Open in new tab/window
									output.target = '_blank'
								}
							} else {
								output[variable] = inputText
							}
						}
					}

					// Handle global options here, like colors and fonts, since they can apply to any tag
					for(key in variables) {
						let temp = key.toLowerCase()
						switch(temp) {
							case 'nomarkup':
							case 'notags':
								noMarkup = true
								break

							case 'color':
							case 'fgcolor':
							case 'fg':
							case 'text':
								temp = 'color'
								if(output.elementType == 'hr') {
									temp = 'borderColor'
								}
								output.style[temp] = '#' + readColor(variables[key])
								break

							case 'backgroundcolor':
							case 'highlight':
							case 'bgcolor':
							case 'bg':
								temp = 'backgroundColor'
								output.style[temp] = '#' + readColor(variables[key])
								break

							case 'font':
							case 'fontfamily':
							case 'font-family':
							case 'type':
								temp = 'fontFamily'
								let newFont = variables[key].toLowerCase()
								if(typeof(customFonts) !== 'undefined') {
									switch(newFont) {
										case 'serif':
										case 'sans-serif':
										case 'cursive':
										case 'fantasy':
										case 'monospace':
											newFont = 'nabfonts ' + newFont
											break
									}
								}

								output.style[temp] = "'" + newFont + "'"
								break

							case 'size':
							case 'fontsize':
								temp = 'fontSize'
								output.style[temp] = (clamp(variables[key].replace(/\D/g,''), 10, 500) / 100) + 'em'
								break
						}
					}
				}
				break	// Found matching tag in the tags array, no reason to continue
			}
		}
	}

	return output
}

function processTagInfo(startLoc, inputText, activeMarkups, noMarkup = false) {
	// startLoc must be the location of the opening '['

	if(activeMarkups.length < 1) noMarkup = false	// Force this if the markup array is empty

	let loc = startLoc
	while(loc < inputText.length && (inputText[loc] == '[' || inputText[loc] == ' ' )) {
		loc++
	}

	if(inputText[loc] == '/') {
		// Closing tag
		loc++
		let endLoc = inputText.indexOf(']', loc)
		let tagName = inputText.substring(loc, endLoc).trim().toLowerCase()
		if(noMarkup) {
			if(tagName != activeMarkups[activeMarkups.length - 1].tag) {
				return false
			}
		}
		return { openingTag : false, endLoc : endLoc, tagInfo : { tag : tagName } }
	}

	if(noMarkup) return false

	let parameters = []
	let currentParam = ''
	let quoteNum = 0	// 0 == no quotes, 1 == single quotes, 2 == double quotes
	while(loc < inputText.length) {
		let temp = inputText[loc]
		if(temp == '\\' && loc + 1 < inputText.length) {
			// Allow escaped characters - spaces, quotes, double quotes, etc
			if(	inputText[loc + 1] == "'" &&
				inputText[loc + 1] == '"' &&
				inputText[loc + 1] == ' '
			) {
				currentParam = currentParam + temp
				loc += temp.length
				continue
			}
		}
		if(quoteNum == 1) {
			if(temp == "'") quoteNum = 0
		} else if(quoteNum == 2) {
			if(temp == '"') quoteNum = 0
		} else if(quoteNum < 1) {
			if(temp == "'") {
				quoteNum = 1
			} else if(temp == '"') {
				quoteNum = 2
			} else if(temp == ' ') {
				// New parameter!
				parameters.push(currentParam)
				currentParam = ''
				temp = ''
				loc++	// Force to go past the space
				continue
			} else if(temp == ']') {
				parameters.push(currentParam)
				break
			}
		}
		currentParam = currentParam + temp
		loc += temp.length
	}

	if(loc >= inputText.length) {
		// Malformed code! Must terminate.
		return false
	}

	let tagName = parameters.shift().toLowerCase()
	if(getTagData(tagName) === false) {
		// Did not match a tag! Terminate.
		return false
	}

	let outputVariables = {}
	for(let i = 0; i < parameters.length; i++) {
		let paramLoc = 0
		let paramKey = ''
		let paramValue = ''

		let j = 0
		for(j = 0; j < parameters[i].length; j++){
			if(parameters[i][j] == '=') break
		}

		paramKey = parameters[i].substr(0, j).toLowerCase()
		if(paramKey == '') continue
		paramValue = parameters[i].substr(j + 1)

		let quote = ''
		if(paramValue[0] == '"' || paramValue[0] == "'") {
			quote = paramValue[0]
			paramValue = paramValue.substr(1)
		}

		j = paramValue.length
		if(paramValue[j - 1] == quote) {
			if((j > 2 && paramValue[j - 2] == '\\')) {
				paramValue = paramValue.substr(0, j - 2)
			} else {
				paramValue = paramValue.substr(0, j - 1)
			}
		}

		outputVariables[paramKey] = paramValue
	}

	if(loc < 0) loc = inputText.length

	return { openingTag : true, endLoc : loc, tagInfo : { tag : tagName, parameters : getTagData(tagName), variables : outputVariables } }
}

function getTagData(tag) {
	tag = tag.toLowerCase()
	for(let i = 0; i < superTextMarkupTags.length; i++) {
		if(tag == superTextMarkupTags[i].tag) return superTextMarkupTags[i]
	}
	return false
}

function superTextMarkup(inputText, addSmilies = true, loc = 0, activeMarkups = [], terminateRecursionOnTag = '', recursions = 0) {
	// This function takes text as input, and returns an array of objects ready to be rendered by createElement()
	// To render the output, apply it as a child to another element, and call createElement() on it
	// Like this:
	// createElement({ elementType : 'span', children : superTextMarkup(inputText) })

	let preprocessor = [{ markup : activeMarkups.slice(0), startPoint : loc }]

	if(recursions === 0) {
		inputText = inputText.replace(new RegExp("\n", 'g'), '[br]')		// Change line breaks to the correct formatting
		if(addSmilies === true) inputText = addSmileyFaces(inputText)
	}

	let terminate = false
	let nomarkup = false
	for(loc; terminate == false && loc >= 0 && loc < inputText.length; loc++) {
		loc = inputText.indexOf('[', loc)
		if(loc < 0) break
		let result = processTagInfo(loc, inputText, activeMarkups, nomarkup)

		if(result === false) continue	// No tag here. Keep going

		if(preprocessor.length > 0) preprocessor[preprocessor.length - 1].endPoint = loc

		if(result.openingTag == true) {

// **************************************************************** OPENING TAGS ****************************************************************

			activeMarkups.push({ tag : result.tagInfo.tag, parameters : result.tagInfo.parameters, variables : result.tagInfo.variables })

			loc = result.endLoc
			preprocessor.push({ markup : activeMarkups.slice(0), startPoint : loc + 1 })

			if((result.tagInfo.parameters.hasOwnProperty('noMarkup') && result.tagInfo.parameters.noMarkup === true) || result.tagInfo.variables.hasOwnProperty('nomarkup')) {
				tagData = result.tagInfo
				nomarkup = true
			}

			if(result.tagInfo.parameters.hasOwnProperty('noClosingTag') && result.tagInfo.parameters.noClosingTag === true) {
				preprocessor[preprocessor.length - 1].endPoint = loc + 1
				activeMarkups.pop()
				preprocessor.push({ markup : activeMarkups.slice(0), startPoint : loc + 1 })
				continue
			}

			if(result.tagInfo.parameters.hasOwnProperty('nest') && result.tagInfo.parameters.nest === true) {
				preprocessor[preprocessor.length - 1].children = superTextMarkup(inputText, false, loc + 1, activeMarkups, activeMarkups.pop().tag, recursions + 1)
				let nestedChildren = preprocessor[preprocessor.length - 1].children

				if(nestedChildren[0].hasOwnProperty('text')) {
					// FIXME: This is a bit hackish...it's intended to work for URLs so you don't always have to use 'link=' as a parameter
					preprocessor[preprocessor.length - 1].endPoint = clamp(preprocessor[preprocessor.length - 1].startPoint + nestedChildren[0].text.length, 0, inputText.length - 1)
				} else {
					preprocessor[preprocessor.length - 1].endPoint = preprocessor[preprocessor.length - 1].startPoint
				}

				loc = nestedChildren[0].endPoint
				if(loc <= preprocessor[preprocessor.length - 1].startPoint || loc >= inputText.length) {
					// If we went backwards or stayed the same, then there's a malformed tag in the nested material and we likely went past the end. Terminate.
					loc = inputText.length
				} else {
					preprocessor.push({ markup : activeMarkups.slice(0), startPoint : loc + 1 })
				}
			}

		} else {

// **************************************************************** CLOSING TAGS ****************************************************************

			if(recursions > 0 && result.tagInfo.tag == terminateRecursionOnTag) {
				terminate = true
			}

			for(let j = activeMarkups.length - 1; j >= 0; j--) {
				if(activeMarkups[j].tag == result.tagInfo.tag) {
					activeMarkups.splice(j, 1)
					nomarkup = false	// This can't possibly be true any longer if we just closed a tag
					if(loc > 0) {
						preprocessor[preprocessor.length - 1].endPoint = loc	// Terminate the previous tag here
					} else {
						preprocessor[preprocessor.length - 1].endPoint = inputText.length - 1
					}
					loc = result.endLoc
					preprocessor.push({ markup : activeMarkups.slice(0), startPoint : loc + 1 })
					break
				}
			}

// **********************************************************************************************************************************************

		}
	}

	// Terminate the last tag here
	if(recursions == 0) {
		preprocessor[preprocessor.length - 1].endPoint = inputText.length
	} else {
		if(loc >= 0 && loc < inputText.length) {
			preprocessor[preprocessor.length - 1].endPoint = loc - 1
		} else {
			preprocessor[preprocessor.length - 1].endPoint = inputText.length
		}
	}

	let output = []
	for(let i = 0; i < preprocessor.length; i++) {
		output.push(generateSuperTextElement(inputText.substring(preprocessor[i].startPoint, preprocessor[i].endPoint), preprocessor[i] ))
	}

	if(recursions > 0) {
		// Need to pass this back for recursions...
		if(loc >= 0 && loc < inputText.length) {
			let newIndex = inputText.indexOf(']', loc)
			if(newIndex < 0) newIndex = inputText.length - 1
			output[0].endPoint = newIndex
		} else {
			output[0].endPoint = loc
		}
	}

	return output
}

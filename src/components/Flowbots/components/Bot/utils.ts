// import { Bot } from './bot.types'

// const generateMusicalNumbers = (limit: number) => {
//     const triangles = []
//     const virtuosos = []
//     let n = 1
//     let _number = 0
//     while (_number <= limit) {
//         _number = (n * (n + 1)) / 2
//         if (_number <= limit) {
//             if (isPerfectNumber(_number)) {
//                 virtuosos.push(_number)
//             } else {
//                 triangles.push(_number)
//             }
//         }
//         n++
//     }
//     return { triangles, virtuosos }
// }

// const generateFibonacci = (limit: number) => {
//     const fibSequence = [1, 2] // Starting the sequence with the first two numbers
//     let nextFib
//     while (true) {
//         nextFib = fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2]
//         if (nextFib > limit) break // Stop if the next number exceeds the limit
//         fibSequence.push(nextFib) // Add the next Fibonacci number to the sequence
//     }
//     return fibSequence
// }

// const isPerfectNumber = (num: number): boolean => {
//     let sum = 1 // Start with 1, because 1 is a divisor of every number
//     for (let i = 2; i <= Math.sqrt(num); i++) {
//         if (num % i === 0) {
//             sum += i
//             if (i !== num / i) { // Avoid adding the square root twice if it's a perfect square
//                 sum += num / i
//             }
//         }
//     }
//     return sum === num
// }

// // Function to check if a number is prime
// const isPrime = (num: number) => {
//     if (num <= 1) return false
//     for (let i = 2; i <= Math.sqrt(num); i++) {
//         if (num % i === 0) return false
//     }
//     return true
// }

// // Function to reverse a number
// const reverseNumber = (num: number) => {
//     return parseInt(num.toString().split('').reverse().join(''), 10);
// }

// // Function to generate circular primes up to a limit
// const generateCircularPrimes = (limit: number) => {
//     const circleNumbers = []
//     for (let num = 2; num <= limit; num++) {
//         const reversed = reverseNumber(num)
//         if (isPrime(num) && isPrime(reversed)) {
//             circleNumbers.push(num)
//         }
//     }
//     return circleNumbers
// }

// const triangles: number[] = generateMusicalNumbers(1729).triangles
// const virtuosos: number[] = generateMusicalNumbers(1729).virtuosos
// const circles: number[] = generateCircularPrimes(1729)
// const agiles: number[] = generateFibonacci(1729)

// // Function to get awards based on input number and prime status
// const getAwards = (x: number, isPrime: number | boolean): string[] => {
//     const awards: string[] = []
//     if (x === 1) {
//         // Handle the case where x === 1, if needed
//     }

//     if (!isPrime) {
//         if (x === 1) {
//             awards.push('Musical')
//             awards.push('Agile')
//         } else {
//             agiles.includes(x) && awards.push('Agile')
//             circles.includes(x) && awards.push('Recycled')
//             triangles.includes(x) && awards.push('Musical')
//             virtuosos.includes(x) && awards.push('Virtuoso')
//             x % 100 === 0 && awards.push('Centurion')
//             x % 2 !== 0 && awards.push('Odd')
//         }
//     } else if (typeof isPrime === 'number') {
//         if (isPrime === 2 && x !== 2) awards.push('Twin')
//         if (isPrime === 4) awards.push('Yokel')
//         if (isPrime === 6) awards.push('Amorous')
//         if (isPrime === 8) {
//             awards.push('Amorous')
//             awards.push('Twin')
//         }
//         if (isPrime === 10) {
//             awards.push('Amorous')
//             awards.push('Yokel')
//         }
//         if (isPrime === 12) {
//             awards.push('Very Amorous')
//         }
//         if (isPrime === 14) {
//             awards.push('Very Amorous')
//             awards.push('Twin')
//         }
//         if (isPrime === 16) { // There actually aren't any of these...
//             awards.push('Very Amorous')
//             awards.push('Yokel')
//             console.log('!16!', x)
//         }
//         if (isPrime === 18) {
//             awards.push('Obsessed')
//         }
//         if (isPrime === 20) {
//             awards.push('Obsessed')
//             awards.push('Twin')
//         }
//         if (isPrime === 22) {
//             awards.push('Obsessed')
//             awards.push('Yokel')
//         }

//         if (isPrime === 24) {
//             awards.push('DTF')
//         }

//         if (isPrime > 24) {
//             console.log('!!!', x, isPrime)
//         }
//         circles.includes(x) && awards.push('Recycled')
//         triangles.includes(x) && awards.push('Musical')
//         agiles.includes(x) && awards.push('Agile')
//         if (x === 2) {
//             awards.push('Odd')
//         }
//     }
//     return awards
// }

// // Function to concatenate parts into a number
// const getIssue = (arms: number, grill: number, panel: number, body: number, head: number, legs: number): number =>
//     Number(arms.toString() + grill.toString() + panel.toString() + body.toString() + head.toString() + legs.toString())

// // Function to calculate the last prime before the given number
// const getLastPrime = (num: number): number | null => {
//     if (num <= 2) return null; // No primes less than 2
//     for (let i = num - 1; i > 1; i--) {
//         if (isPrime(i)) {
//             return i;
//         }
//     }
//     return null; // Fallback if no prime is found (shouldn't happen)
// };

// // Function to check if a number is prime and return an offset from the last prime
// const getIsPrime = (num: number): number | boolean => {
//     if (!isPrime(num)) return false; // Return false if the number is not prime
//     const lastPrime = getLastPrime(num);
//     if (lastPrime === null) return false; // If no last prime exists, return false
//     return num - lastPrime;
// }

// // Function to get modulo of a number with an offset
// const getMod = (bot: number, modder: number, offset: number): number => (bot + offset) % modder

// // Function to get the digital root of a number
// const digitalRoot = (num: number): number => 1 + ((num - 1) % 9)

// // Function to reduce a number's digits until a sum of single digit
// const reduceSum = (num: number): number => {
//     let sum = num.toString().split('').map(Number).reduce((acc, digit) => acc + digit, 0)
//     while (sum >= 10) {
//         sum = Math.floor(sum / 10) + (sum % 10)
//     }
//     return sum
// }

// Function to create a bot object
// export const makeBot = (bot: number): Bot => {
//     const id = bot + 1
//     const arms = getMod(bot, 19, 0)
//     const grill = getMod(bot, 21, 0)
//     const panel = getMod(bot, 14, 1)
//     const body = getMod(bot, 13, 0)
//     const head = getMod(bot, 13, 6)
//     const legs = getMod(bot, 14, 6)

//     const isPrime = getIsPrime(id)
//     const awards = getAwards(id, isPrime)
//     const power = arms + grill + panel + body + legs + head
//     const luck = digitalRoot(power)
//     const skill = reduceSum(power)
//     const issue = getIssue(arms, grill, panel, body, head, legs)

//     return { id, tokenId: id, arms, grill, panel, body, head, legs, awards, luck, skill, power, isPrime, issue, }
// }

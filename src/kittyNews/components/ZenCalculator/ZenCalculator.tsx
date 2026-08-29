import React, { useEffect, useState } from 'react'
import BN from 'big.js'
import * as Styled from './ZenCalculator.style'

const { VITE_CDN_URL } = import.meta.env

const createMultiplierOptions = (options: Array<string>) => options.map((name: string, index: number) => ({ label: name, value: '1' + '0'.repeat((index + 1) * 3) }))

const multiplierOptions = createMultiplierOptions([
    'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 
    'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 
    'Nonillion', 'Decillion', 'Undecillion', 'Duodecillion', 
    'Tredecillion', 'Quattuordecillion', 'Quindecillion', 
    'Sexdecillion', 'Septendecillion', 'Octodecillion', 
    'Novemdecillion', 'Vigintillion'
])

const ZenCalculator: React.FC = () => {
    const [zenPerSecond1, setZenPerSecond1] = useState<string>('')
    const [zenPerSecond2, setZenPerSecond2] = useState<string>('')
    const [multiplier1Index, setMultiplier1Index] = useState<number>(0)
    const [multiplier2Index, setMultiplier2Index] = useState<number>(0)
    const [balance, setBalance] = useState<Record<string, BN>>({})

    const formatLargeNumber = (number: BN): string => {
        const absNumber = number.abs()

        if (absNumber.lt(new BN('1000'))) return `${number.toString()}` // No suffix for numbers < 1000

        const scales = [
            { threshold: new BN('1000000'), suffix: 'thousand' },
            { threshold: new BN('1000000000'), suffix: 'million' },
            { threshold: new BN('1000000000000'), suffix: 'billion' },
            { threshold: new BN('1000000000000000'), suffix: 'trillion' },
            { threshold: new BN('1000000000000000000'), suffix: 'quadrillion' },
            { threshold: new BN('1000000000000000000000'), suffix: 'quintillion' },
            { threshold: new BN('1000000000000000000000000'), suffix: 'sextillion' },
            { threshold: new BN('1000000000000000000000000000'), suffix: 'septillion' },
            { threshold: new BN('1000000000000000000000000000000'), suffix: 'octillion' },
            { threshold: new BN('1000000000000000000000000000000000'), suffix: 'nonillion' },
            { threshold: new BN('1000000000000000000000000000000000000'), suffix: 'decillion' },
            { threshold: new BN('1000000000000000000000000000000000000000'), suffix: 'undecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000'), suffix: 'duodecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000'), suffix: 'tredecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000'), suffix: 'quattuordecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000'), suffix: 'quindecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000'), suffix: 'sexdecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000'), suffix: 'septendecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000000'), suffix: 'octodecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000000000'), suffix: 'novemdecillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000000000000'), suffix: 'vigintillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000000000000000'), suffix: 'unvigintillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000000000000000000'), suffix: 'duovigintillion' },
            { threshold: new BN('1000000000000000000000000000000000000000000000000000000000000000000000000000'), suffix: 'trevigintillion' },
        ]

        for (const scale of scales) {
            if (absNumber.lt(scale.threshold)) {
                const scaledValue = number.div(scale.threshold.div(new BN('1000'))) // Scale down by 1000 for readability
                return `${scaledValue.toFixed(2).replace(/\.00$/, '')} ${scale.suffix}` // Format the number and remove .00
            }
        }

        return `${number.toString()} (too large to categorize)`
    }

    useEffect(() => {
        calculateBalance()
    }, [zenPerSecond1, zenPerSecond2, multiplier1Index, multiplier2Index])

    

    const calculateBalance = () => {
        // Retrieve the multiplier values as BN
        const multiplier1 = new BN(multiplierOptions[multiplier1Index].value) 
        const multiplier2 = new BN(multiplierOptions[multiplier2Index].value) 
        try {
            const zps1 = zenPerSecond1 === '' && !(zenPerSecond2 === '') ? new BN('1') : new BN(zenPerSecond1)
            const zps2 = zenPerSecond2 === '' && !(zenPerSecond1 === '') ? new BN('1') : new BN(zenPerSecond2)
             // Calculate total zen per second based on inputs and selected multipliers
            const totalZenPerSecond = zps1.mul(multiplier1).add(zps2.mul(multiplier2))

            // Time calculations in seconds
            const oneMinute = new BN(60) // 1 minute = 60 seconds
            const oneHour = oneMinute.mul(new BN(60)) // 1 hour = 60 minutes
            const fiveHours = oneHour.mul(new BN(5))
            const twelveHours = oneHour.mul(new BN(12))
            const twentyFourHours = oneHour.mul(new BN(24))
            const oneWeek = twentyFourHours.mul(new BN(7))

            // Calculate the new balance for different time frames
            const newBalance = {
                "1 Minute": totalZenPerSecond.mul(oneMinute),
                "1 Hour": totalZenPerSecond.mul(oneHour),
                "5 Hours": totalZenPerSecond.mul(fiveHours),
                "12 Hours": totalZenPerSecond.mul(twelveHours),
                "24 Hours": totalZenPerSecond.mul(twentyFourHours),
                "1 Week": totalZenPerSecond.mul(oneWeek),
            }
             // Set the new balance
            setBalance(newBalance)
        } catch (e) {
            setBalance({
                "1 Minute": new BN('0'),
                "1 Hour": new BN('0'),
                "5 Hours": new BN('0'),
                "12 Hours": new BN('0'),
                "24 Hours": new BN('0'),
                "1 Week": new BN('0'),
            })
        }
    }

    const handleZpsInput = (value: string, index: number) => {
        if (value.length > 7) {
            return false
        }
        // Step 2: Allow valid decimal values (up to 3 decimal places)
        const decimalRegex = /^\d+(\.\d{0,3})?$/;
        if (!decimalRegex.test(value) && value !== '') {
            return false;
        }

        // Step 3: Check if value exceeds the valid range
        const parsedValue = parseFloat(value);
        if ((parsedValue > 999.999 || parsedValue < 0)) {
            return false;
        }

        // Step 4: Set the appropriate zenPerSecond based on the index
        if (index === 0) {
            setZenPerSecond1(value);
        } else {
            setZenPerSecond2(value);
        }
    }
    
    return (
        <Styled.Div>
            <img src={`${VITE_CDN_URL}/images/kittynews/atz-256x256.png`} />
            <h2>Zen Calculator</h2>
            <div>
                <div>
                    <label>zen p/s</label>
                    <input
                        type="text"
                        value={zenPerSecond1.toString()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleZpsInput(e.target.value, 0)}
                        placeholder='e.g. 1.234'
                    />
                    <select value={multiplier1Index} onChange={(e) => setMultiplier1Index(Number(e.target.value))}>
                        {multiplierOptions.map((option, index) => (
                            <option key={option.label} value={index}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>egg zen p/s</label>
                    <input
                        type="text"
                        value={zenPerSecond2.toString()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleZpsInput(e.target.value, 1)}
                        placeholder='e.g. 4.321'
                    />
                    <select value={multiplier2Index} onChange={(e) => setMultiplier2Index(Number(e.target.value))}>
                        {multiplierOptions.map((option, index) => (
                            <option key={option.label} value={index}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        
            {Object.entries(balance).length > 0 && (
                <div>
                    <h2>Projected zen:</h2>
                    <ul>
                        {Object.entries(balance).map(([time, amount]) => (
                            <li key={time}>{time}: {formatLargeNumber(amount)} zen</li>
                        ))}
                    </ul>
                </div>
            )}
        </Styled.Div>
    )
}

export default ZenCalculator

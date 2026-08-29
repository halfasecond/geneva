// @ts-nocheck
import React, { useEffect, useState } from 'react';
import BN from 'big.js';
import * as Styled from './ZenCalculator.style';

// Dynamically generate multiplier options using string concatenation
const createMultiplierOptions = (options: Array<string>) => options.map((name: string, index: number) => ({ label: name, value: '1' + '0'.repeat((index + 1) * 3) }))

const multiplierOptions = createMultiplierOptions(['Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion', 'Undecillion', 'Duodecillion', 'Tredecillion', 'Quattuordecillion', 'Quindecillion', 'Sexdecillion', 'Septendecillion', 'Octodecillion', 'Novemdecillion', 'Vigintillion'])

const ZenCalculator = () => {
    const [zenPerSecond1, setZenPerSecond1] = useState(new BN(1))
    const [zenPerSecond2, setZenPerSecond2] = useState(new BN(1))
    const [multiplier1Index, setMultiplier1Index] = useState(0)
    const [multiplier2Index, setMultiplier2Index] = useState(0)
    const [balance, setBalance] = useState({})

    useEffect(() => {
        calculateBalance()
    }, [zenPerSecond1, zenPerSecond2, multiplier1Index, multiplier2Index])

    const formatLargeNumber = (number) => {
        const absNumber = number.abs();
    
        if (absNumber.lt(new BN('1000'))) return `${number.toString()}`; // No suffix for numbers < 1000
    
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
                const scaledValue = number.div(scale.threshold.div(new BN('1000'))); // Scale down by 1000 for readability
                return `${scaledValue.toFixed(2).replace(/\.00$/, '')} ${scale.suffix}`; // Format the number and remove .00
            }
        }
    
        return `${number.toString()} (too large to categorize)`;
    };

    const calculateBalance = () => {
        // Retrieve the multiplier values as BN
        const multiplier1 = new BN(multiplierOptions[multiplier1Index].value); 
        const multiplier2 = new BN(multiplierOptions[multiplier2Index].value); 
    
        // Calculate total zen per second based on inputs and selected multipliers
        const totalZenPerSecond = zenPerSecond1.mul(multiplier1).add(zenPerSecond2.mul(multiplier2))
    
        // Time calculations in seconds
        const oneMinute = new BN(60); // 1 minute = 60 seconds
        const oneHour = oneMinute.mul(new BN(60)); // 1 hour = 60 minutes
        const fiveHours = oneHour.mul(new BN(5));
        const twelveHours = oneHour.mul(new BN(12));
        const twentyFourHours = oneHour.mul(new BN(24));
        const oneWeek = twentyFourHours.mul(new BN(7));
    
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
        setBalance(newBalance);
    };

    const withinRange = (value) => (parseInt(value) > 0 && parseInt(value) < 1000) || value === ''

    return (
        <Styled.Section>
            <div>
                <img src={'/atz-256x256.png'} />
                <h2>Zen Calculator</h2>
                <div>
                    
                    <div>
                        <label>zen p/s</label>
                        <input
                            type="number"
                            placeholder="Zen per second 1"
                            value={zenPerSecond1.toString()}
                            onChange={(e) => withinRange(e.target.value) && setZenPerSecond1(new BN(parseFloat(e.target.value) || 0))}
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
                            type="number"
                            placeholder="Zen per second 2"
                            value={zenPerSecond2.toString()}
                            onChange={(e) => withinRange(e.target.value) && setZenPerSecond2(new BN(parseFloat(e.target.value) || 0))}
                        />
                        <select value={multiplier2Index} onChange={(e) => setMultiplier2Index(Number(e.target.value))}>
                            {multiplierOptions.map((option, index) => (
                                <option key={option.label} value={index}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    {/* <div>
                        <label>Egg Pet Bonus</label>
                        <input
                            type="number"
                            placeholder="Egg Pet Bonus"
                            value={eggPetBonus.toString()}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEggPetBonus(new BN(parseFloat(e.target.value) || 0))}
                        />
                    </div> */}
                </div>
                {Object.entries(balance).length > 0 && (
                    <div>
                        <h2>Projected Balance:</h2>
                        <ul>
                            {Object.entries(balance).map(([time, amount]) => (
                                <li key={time}>{time}: {formatLargeNumber(amount)} Zen</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Styled.Section>
    );
};

export default ZenCalculator;

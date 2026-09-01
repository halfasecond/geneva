const geneToEyeColorRandomLeft: Record<number, Record<number, string>> = {
  28: {
    0: '6', 1: '7', 2: '0', 3: '1', 4: '2', 5: '3', 6: '4', 7: '5',
    8: '6', 9: '7', 10: '0', 11: '1', 12: '2', 13: '3', 14: '4', 15: '5',
    16: '6', 17: '7', 18: '0', 19: '1', 20: '2', 21: '3', 22: '4', 23: '5',
    24: '16', 25: '17', 26: '18', 27: '19', 28: '25', 29: '24', 30: '25', 31: '24',
  },
  29: {
    0: '8', 1: '9', 2: '10', 3: '11', 4: '12', 5: '13', 6: '14', 7: '15',
    8: '8', 9: '9', 10: '10', 11: '11', 12: '12', 13: '13', 14: '14', 15: '15',
    16: '8', 17: '9', 18: '10', 19: '11', 20: '12', 21: '13', 22: '14', 23: '15',
    24: '20', 25: '21', 26: '22', 27: '23', 28: '26', 29: '27', 30: '26', 31: '27',
  },
}

const geneToEyeColorRandomRight: Record<number, Record<number, string>> = {
  28: {
    0: '2', 1: '3', 2: '4', 3: '5', 4: '6', 5: '7', 6: '0', 7: '1',
    8: '2', 9: '3', 10: '4', 11: '5', 12: '6', 13: '7', 14: '0', 15: '1',
    16: '2', 17: '3', 18: '4', 19: '5', 20: '6', 21: '7', 22: '0', 23: '1',
    24: '18', 25: '19', 26: '16', 27: '17', 28: '24', 29: '25', 30: '24', 31: '25',
  },
  29: {
    0: '12', 1: '13', 2: '14', 3: '15', 4: '8', 5: '9', 6: '10', 7: '11',
    8: '12', 9: '13', 10: '14', 11: '15', 12: '8', 13: '9', 14: '10', 15: '11',
    16: '12', 17: '13', 18: '14', 19: '15', 20: '8', 21: '9', 22: '10', 23: '11',
    24: '22', 25: '23', 26: '20', 27: '21', 28: '27', 29: '26', 30: '27', 31: '26',
  },
}

export const getDioscuriEyeColors = (primaryGene: number, secondaryGene: number, tertiaryGene: number) => ({
  eyeColorRight: geneToEyeColorRandomLeft[primaryGene]?.[secondaryGene],
  eyeColorLeft: geneToEyeColorRandomRight[primaryGene]?.[tertiaryGene],
})

export const getGeminiEyeColors = (primaryGene: number, secondaryGene: number, tertiaryGene: number) => ({
  eyeColorLeft: geneToEyeColorRandomLeft[primaryGene]?.[tertiaryGene],
  eyeColorRight: geneToEyeColorRandomRight[primaryGene]?.[secondaryGene],
})

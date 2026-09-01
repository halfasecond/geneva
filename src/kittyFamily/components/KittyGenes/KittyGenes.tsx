// @ts-nocheck
import { genes } from 'kittyFamily/utils'
import { EYE_COLORS, grey } from 'kittyFamily/style/config'
import { getDioscuriEyeColors, getGeminiEyeColors } from './eyeColorMaps'
import { fancyRecipes } from './fancyRecipes'
import typeFancy from 'kittyFamily/svg/genes/type-fancy.svg'
import typeExclusive from 'kittyFamily/svg/genes/type-exclusive.svg'
import typeSpecial from 'kittyFamily/svg/genes/type-specialedition.svg'
import typePurrstige from 'kittyFamily/svg/genes/type-purrstige.svg'
import * as Styled from './KittyGenes.style'

const DISPLAY_CAT_TYPES = [
  { param: 'fu', readable: 'Body / Fur' },
  { param: 'pa', readable: 'Pattern' },
  { param: 'ec', readable: 'Eye Color' },
  { param: 'es', readable: 'Eye Shape' },
  { param: 'bc', readable: 'Base Color' },
  { param: 'hc', readable: 'Highlight Color' },
  { param: 'ac', readable: 'Accent Color' },
  { param: 'mo', readable: 'Mouth' },
  { param: 'we', readable: 'Wild' },
  { param: 'en', readable: 'Environment' },
  { param: 'se', readable: 'Secret' },
  { param: 'pu', readable: 'Purrstige' },
]

const TYPE_LABELS = {
  body: 'fur',
  pattern: 'pattern',
  coloreyes: 'eye colour',
  colorprimary: 'base colour',
  colorsecondary: 'highlight colour',
  colortertiary: 'accent colour',
  eyes: 'eye shape',
  mouth: 'mouth',
  wild: 'wild element',
  environment: 'environment',
  secret: 'secret',
  prestige: 'purrstige',
  purrstige: 'purrstige',
}

const PARAM_TYPE_LABELS = {
  fu: 'fur',
  pa: 'pattern',
  ec: 'eye colour',
  es: 'eye shape',
  bc: 'base colour',
  hc: 'highlight colour',
  ac: 'accent colour',
  mo: 'mouth',
  we: 'wild element',
  en: 'environment',
  se: 'secret',
  pu: 'purrstige',
}

const BRONZE_MAX = 500

const getRgba = (hex, opacity) => {
  if (!hex) return hex
  const raw = String(hex).replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return hex
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`
}

const parseGeneBlocks = (value) => {
  try {
    const binary = BigInt(value).toString(2).padStart(240, '0')
    const matched = binary.match(/.{1,5}/g)
    if (!matched || matched.length !== 48) return null
    const blocks = [...matched].reverse()
    return blocks.slice(0, 28).concat(blocks.slice(32, 36)).concat(blocks.slice(28, 32)).concat(blocks.slice(36, 48))
  } catch {
    return null
  }
}

const padGene = (gene) => (gene < 10 ? `0${gene}` : `${gene}`)

const jewelRank = (position) => {
  const p = parseInt(position, 10)
  if (p > 0 && p <= 1) return 'diamond'
  if (p <= 10) return 'gold'
  if (p <= 100) return 'silver'
  if (p <= 500) return 'bronze'
  return 'none'
}

const splitTraits = (kitty, enhanced) => {
  const mewtations = []
  const cattributes = []
  if (kitty.is_fancy || kitty.is_exclusive) return { mewtations, cattributes }
  if (!Array.isArray(enhanced)) return { mewtations, cattributes }
  const kittyId = parseInt(kitty.id ?? kitty.tokenId, 10)
  ;[...enhanced]
    .sort((a, b) => {
      const p1 = parseInt(a.position, 10)
      const p2 = parseInt(b.position, 10)
      if (p1 < 0) return 1
      if (p2 < 0) return -1
      return p1 - p2
    })
    .forEach((trait) => {
      const rootId = parseInt(trait.kittyId, 10)
      const position = parseInt(trait.position, 10)
      if (trait.type === 'prestige') return
      if (rootId === kittyId && position <= BRONZE_MAX && position !== -1) {
        mewtations.push(trait)
      } else if (trait.type !== 'secret' && trait.type !== 'purrstige') {
        cattributes.push(trait)
      }
    })
  return { mewtations, cattributes }
}

const findTrait = (list, name) => {
  if (!name) return null
  const needle = String(name).toLowerCase()
  return list.find((item) => String(item.description || '').toLowerCase() === needle)
}

const traitName = (geneIndex, param) => {
  const row = genes[geneIndex]
  if (!row) return ''
  return row[param] || ''
}

const KittyGenes = ({ kitty }) => {
  const genesValue = kitty?.genes
  if (genesValue === undefined || genesValue === null || genesValue === '') return null
  const geneBlocks = parseGeneBlocks(genesValue)
  if (!geneBlocks) return null

  const { mewtations, cattributes } = splitTraits(kitty, kitty.enhanced_cattributes || kitty.cattributes || [])
  const fancyKey = String(kitty.fancy_type || '').toLowerCase()
  const recipe = fancyRecipes[fancyKey]

  const isInFancyRecipe = (param, geneIndex) => {
    if (!recipe) return false
    return recipe.includes(genes[geneIndex]?.[param])
  }

  const GeneCell = (gene, opacity, eyeColorLeft, eyeColorRight, title) => {
    return (
      <Styled.Gene
        style={{
          backgroundColor: gene >= 28 ? 'transparent' : getRgba(EYE_COLORS[genes[gene]?.ec], opacity),
        }}
        className={gene === 30 ? '--color-kaleidoscope' : undefined}
        title={title}
      >
        {(gene === 28 || gene === 29) &&
          (eyeColorLeft === undefined ? (
            gene === 28 ? (
              <>
                <div style={{ backgroundColor: getRgba(grey[200], opacity) }} />
                <div style={{ backgroundColor: getRgba(grey[300], opacity) }} />
              </>
            ) : (
              <>
                <div style={{ backgroundColor: getRgba(grey[300], opacity) }} />
                <div style={{ backgroundColor: getRgba(grey[200], opacity) }} />
              </>
            )
          ) : (
            <>
              <div style={{ backgroundColor: getRgba(EYE_COLORS[genes[eyeColorLeft]?.ec], opacity) }} />
              <div style={{ backgroundColor: getRgba(EYE_COLORS[genes[eyeColorRight]?.ec], opacity) }} />
            </>
          ))}
        <span>{gene}</span>
      </Styled.Gene>
    )
  }

  return (
    <Styled.Div className={'kitty-genes'}>
      {geneBlocks.map((block, i) => {
        if (i % 4 !== 0) return null
        const catType = DISPLAY_CAT_TYPES[i / 4]
        const visibleGene = genes.findIndex((g) => g.binary === block)
        const h1 = genes.findIndex((g) => g.binary === geneBlocks[i + 1])
        const h2 = genes.findIndex((g) => g.binary === geneBlocks[i + 2])
        const h3 = genes.findIndex((g) => g.binary === geneBlocks[i + 3])
        if (visibleGene < 0 || h1 < 0 || h2 < 0 || h3 < 0 || !catType) return null

        const cattribute = traitName(visibleGene, catType.param)
        const isFancyCattribute = Boolean(kitty.is_fancy && isInFancyRecipe(catType.param, visibleGene))
        const isPurrstigeCattribute = Boolean(kitty.is_prestige && catType.param === 'pu')
        const pureBred = visibleGene === h1 && h1 === h2 && h2 === h3
        const faded = kitty.is_fancy && !isFancyCattribute && !kitty.is_exclusive && !kitty.is_special_edition

        const eyeColorLeft =
          visibleGene === 28
            ? getGeminiEyeColors(visibleGene, h1, h2).eyeColorLeft
            : visibleGene === 29
              ? getDioscuriEyeColors(visibleGene, h1, h2).eyeColorLeft
              : undefined
        const eyeColorRight =
          visibleGene === 28
            ? getGeminiEyeColors(visibleGene, h1, h2).eyeColorRight
            : visibleGene === 29
              ? getDioscuriEyeColors(visibleGene, h1, h2).eyeColorRight
              : undefined

        const mew = findTrait(mewtations, cattribute)
        const cat = mew ? null : findTrait(cattributes, cattribute)
        const chip = mew || cat
        const chipKind = mew ? 'mewtation' : 'jewel'
        const rank = chip ? jewelRank(chip.position) : 'none'
        const straightName = (chip && chip.description) || cattribute
        const straightType = (chip && (TYPE_LABELS[chip.type] || chip.type)) || PARAM_TYPE_LABELS[catType.param]

        const cellTitle = (geneIndex) => {
          const named = traitName(geneIndex, catType.param)
          return named || `${catType.param.toUpperCase()}${padGene(geneIndex)}`
        }

        return (
          <Styled.HelixContainer key={catType.param}>
            <Styled.Helix
              pureBred={pureBred}
              style={{ opacity: faded ? 0.5 : 1 }}
            >
              <label>
                {isFancyCattribute && <img src={typeFancy} alt="" />}
                {kitty.is_special_edition && <img src={typeSpecial} alt="" />}
                {kitty.is_exclusive && <img src={typeExclusive} alt="" />}
                {isPurrstigeCattribute && <img src={typePurrstige} alt="" />}
                <b>
                  {isPurrstigeCattribute
                    ? kitty.prestige_type
                    : isFancyCattribute
                      ? cattribute
                      : `${catType.param}${padGene(visibleGene)}`}
                </b>
                <span className={'binary'}>
                  {genes[visibleGene].binary} {genes[h1].binary} {genes[h2].binary} {genes[h3].binary}
                </span>
              </label>
              {GeneCell(visibleGene, 1, eyeColorLeft, eyeColorRight, cellTitle(visibleGene))}
              {GeneCell(h1, 0.75, eyeColorLeft, eyeColorRight, cellTitle(h1))}
              {GeneCell(h2, 0.5, eyeColorLeft, eyeColorRight, cellTitle(h2))}
              {GeneCell(h3, 0.25, eyeColorLeft, eyeColorRight, cellTitle(h3))}
            </Styled.Helix>
            {straightName && (
              <Styled.Chip $kind={chipKind} $rank={rank}>
                {rank !== 'none' && <Styled.ChipIcon $kind={chipKind} $rank={rank} />}
                <Styled.ChipCopy>
                  <span className={'title'}>{straightName}</span>
                  <span className={'type'}>{straightType}</span>
                </Styled.ChipCopy>
              </Styled.Chip>
            )}
          </Styled.HelixContainer>
        )
      })}
    </Styled.Div>
  )
}

export default KittyGenes

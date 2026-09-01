/** Shared type and colour tokens for kitty.family and kitty.news. */

export const fonts = {
    display: 'bungee, sans-serif',
    body: '"source-code-pro", monospace',
} as const

export const type = {
    displayLg: {
        fontFamily: fonts.display,
        fontSize: '22px',
        fontWeight: 400 as const,
        lineHeight: 1.15,
    },
    displayMd: {
        fontFamily: fonts.display,
        fontSize: '13px',
        fontWeight: 400 as const,
        lineHeight: 1.2,
    },
    displaySm: {
        fontFamily: fonts.display,
        fontSize: '12px',
        fontWeight: 400 as const,
        lineHeight: 1.2,
    },
    body: {
        fontFamily: fonts.body,
        fontSize: '13px',
        fontWeight: 400 as const,
        lineHeight: 1.45,
    },
    caption: {
        fontFamily: fonts.body,
        fontSize: '12px',
        fontWeight: 400 as const,
        lineHeight: 1.4,
    },
    code: {
        fontFamily: fonts.body,
        fontSize: '10px',
        fontWeight: 400 as const,
        lineHeight: 1.35,
    },
} as const

export const space = {
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '48px',
} as const

export const color = {
    ink: '#403e3d',
    muted: '#82817d',
    faint: '#9c9c9b',
    line: '#f3f1ee',
    wash: '#fcfbfa',
    paper: '#ffffff',
} as const

export const typeCss = (role: keyof typeof type) => {
    const t = type[role]
    return `
        font-family: ${t.fontFamily};
        font-size: ${t.fontSize};
        font-weight: ${t.fontWeight};
        line-height: ${t.lineHeight};
    `
}

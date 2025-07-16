export const getBanner = (version: string) => [
  `ÆRIA (create-aeria-app v${version})`,
  'Visit https://aeria.land/ for documentation',
].join('\n')

export const printBanner = () => {
  const { version } = require('../package.json')
  console.log(getBanner(version) + '\n')
}


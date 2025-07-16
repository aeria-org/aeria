import { getPackageJson } from './util.js'

export const getBanner = (version: string) => [
  `ÆRIA (create-aeria-app v${version})`,
  'Visit https://aeria.land/ for documentation',
].join('\n')

export const printBanner = async () => {
  const { version } = await getPackageJson()
  console.log(getBanner(version) + '\n')
}


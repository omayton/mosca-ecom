import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/address/reverse-geocode?lat=X&lon=Y
 *
 * Converts GPS coordinates to a Brazilian CEP + city/state.
 * Uses Nominatim (OpenStreetMap) for reverse geocoding,
 * then validates with ViaCEP for accurate Brazilian data.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lon = parseFloat(searchParams.get('lon') || '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  }

  // Validate rough bounding box for Brazil
  if (lat < -34 || lat > 6 || lon < -74 || lon > -28) {
    return NextResponse.json({ error: 'Localização fora do Brasil' }, { status: 400 })
  }

  try {
    // Step 1: Reverse geocode with Nominatim (OpenStreetMap — free, no API key)
    // Nominatim requires a User-Agent identifying the app
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MoscaBrancaParts/1.0 (moscabrancaparts.com.br)',
          'Accept-Language': 'pt-BR',
        },
        // Nominatim: 1 req/sec max — safe for user-triggered requests
        next: { revalidate: 0 },
      }
    )

    if (!nominatimRes.ok) {
      throw new Error(`Nominatim error: ${nominatimRes.status}`)
    }

    const nominatim = await nominatimRes.json()
    const addr = nominatim.address || {}

    // Extract postcode (may or may not be present)
    const rawPostcode = (addr.postcode || '').replace(/\D/g, '')

    // Extract city and state from Nominatim as fallback
    const nominatimCity = addr.city || addr.town || addr.village || addr.municipality || ''
    const nominatimState = addr['ISO3166-2-lvl4']?.replace('BR-', '') || ''

    // Step 2: If we got a valid 8-digit postcode, validate with ViaCEP
    if (rawPostcode.length === 8) {
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${rawPostcode}/json/`)
        const viaCep = await viaCepRes.json()

        if (!viaCep.erro) {
          return NextResponse.json({
            cep:    viaCep.cep.replace(/\D/g, ''),
            cidade: viaCep.localidade,
            uf:     viaCep.uf,
          })
        }
      } catch {
        // ViaCEP failed — fall through to Nominatim data
      }
    }

    // Step 3: Fallback — use Nominatim city/state without exact CEP
    // (user can still see city/state and confirm)
    if (nominatimCity && nominatimState) {
      return NextResponse.json({
        cep:        rawPostcode.length === 8 ? rawPostcode : null,
        cidade:     nominatimCity,
        uf:         nominatimState,
        approximate: true, // flag to show "localização aproximada"
      })
    }

    return NextResponse.json(
      { error: 'Não foi possível identificar o CEP desta localização' },
      { status: 404 }
    )
  } catch (err: any) {
    console.error('[reverse-geocode]', err.message)
    return NextResponse.json(
      { error: 'Erro ao detectar localização. Tente digitar o CEP manualmente.' },
      { status: 500 }
    )
  }
}

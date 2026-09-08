import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS, getSeason } from '@/lib/data/seasons';
import { bracketFor, championOf, runnerUpOf } from '@/lib/stats/season';
import { LEAGUE } from '@/lib/league';

/**
 * Dynamic share card for a completed season.
 *
 * The champion's mascot is the hero, on their team colour, beside the season
 * label and the grand-final scoreline. Rendered with Satori (ImageResponse), so
 * the layout is flexbox-only and the mascot is fetched as raw bytes from the
 * public URL — Satori can't resolve a bare `/mascots/x.png` the way the DOM can.
 * A missing mascot (e.g. a departed manager) falls back to a monogram on colour.
 */

export const alt = 'Season champion share card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** One card per completed season, pre-rendered at build. */
export function generateStaticParams() {
  return COMPLETED_SEASONS.map((season) => ({ seasonId: season.id }));
}

/**
 * Read a public asset straight off disk as raw bytes for Satori.
 *
 * Reading from the filesystem (rather than fetching an absolute URL) means the
 * card builds reliably regardless of network, and a missing file simply falls
 * back to the monogram. `publicPath` is the browser path, e.g. `/mascots/x.png`.
 */
async function loadImage(publicPath: string): Promise<ArrayBuffer | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
    const buffer = await readFile(filePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const season = getSeason(seasonId);
  const champion = season ? championOf(season.id) : undefined;

  // Fallback card when a season or champion can't be resolved.
  if (!season || !champion) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #16171d 0%, #0b0c10 100%)',
            color: '#ffffff',
            fontSize: 64,
            fontWeight: 900,
          }}
        >
          {LEAGUE.name}
        </div>
      ),
      size,
    );
  }

  const manager = getManager(champion.managerId);
  const runnerUp = runnerUpOf(season.id);
  const grandFinal = bracketFor(season.id).grandFinal;

  // Grand-final scoreline from the champion's perspective (their score first).
  let scoreline: string | null = null;
  if (grandFinal) {
    const champIsHome = grandFinal.homeId === champion.managerId;
    const champScore = champIsHome ? grandFinal.homeScore : grandFinal.awayScore;
    const oppScore = champIsHome ? grandFinal.awayScore : grandFinal.homeScore;
    scoreline = `${Math.round(champScore)} – ${Math.round(oppScore)}`;
  }

  const [mascot, logo] = await Promise.all([
    loadImage(`/mascots/${manager.id}.png`),
    loadImage(LEAGUE.logos.full),
  ]);

  const primary = manager.colours.primary;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0b0c10',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Mascot panel, left — the hero, on the champion's colour. */}
        <div
          style={{
            width: 470,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: `linear-gradient(150deg, ${primary}, #0b0c10)`,
            position: 'relative',
          }}
        >
          {mascot ? (
            <img
              // @ts-expect-error — ImageResponse accepts an ArrayBuffer src.
              src={mascot}
              width={470}
              height={630}
              style={{ width: 470, height: 630, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: 260,
                fontWeight: 900,
                color: 'rgba(255,255,255,0.28)',
              }}
            >
              {manager.name[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Detail panel, right. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '56px 60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {logo ? (
              <img
                // @ts-expect-error — ImageResponse accepts an ArrayBuffer src.
                src={logo}
                height={54}
                style={{ height: 54, objectFit: 'contain' }}
              />
            ) : null}
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#ff8534',
              }}
            >
              {season.label} Champion
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 108,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              marginTop: 24,
              textTransform: 'uppercase',
            }}
          >
            {manager.name}
          </div>

          {champion.teamName ? (
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#ff8534', marginTop: 14 }}>
              {champion.teamName}
            </div>
          ) : null}

          {/* Grand-final scoreline chip. */}
          {scoreline ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 40,
                padding: '20px 28px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                alignSelf: 'flex-start',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                Grand final{runnerUp ? ` · def. ${getManager(runnerUp.managerId).name}` : ''}
              </span>
              <span style={{ fontSize: 60, fontWeight: 900, letterSpacing: -1, marginTop: 6 }}>
                {scoreline}
              </span>
            </div>
          ) : null}
        </div>

        {/* Accent edge along the top. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #ef6511, #ff8534)',
          }}
        />
      </div>
    ),
    size,
  );
}
